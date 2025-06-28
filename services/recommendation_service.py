import pandas as pd
import logging
from typing import List, Dict, Any
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
import asyncio
import re
import difflib

from models.student_input import StudentInput
from models.college_response import CollegeResponse
from services.data_service import DataService

logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self, data_service: DataService):
        self.data_service = data_service
        self.geocoder = Nominatim(user_agent="jee_college_recommender", timeout=30)
        self.location_cache = {}
        # Load geo_data Excel for fast lookup using only city name
        self.geo_data = {}
        try:
            geo_df = pd.read_excel('data/Geo_data_INDIA_all_cities.xlsx')
            for _, row in geo_df.iterrows():
                city = str(row.get('City', '')).strip()
                lat = row.get('Latitude')
                lon = row.get('Longitude')
                if city and not pd.isna(lat) and not pd.isna(lon):
                    norm_city = self.normalize(city)
                    self.geo_data[norm_city] = (lat, lon)
            logger.info(f"Loaded {len(self.geo_data)} cities from geo_data Excel.")
            # Log a sample of keys
            logger.info(f"Sample geo_data keys: {list(self.geo_data.keys())[:10]}")
        except Exception as e:
            logger.error(f"Failed to load geo_data Excel: {e}")

    async def get_recommendations(self, student_input: StudentInput) -> List[CollegeResponse]:
        """Get college recommendations based on student preferences"""
        try:
            # Prepare filters from student input
            filters = {
                'rank': student_input.rank,
                'category': student_input.category.value,
                'gender': student_input.gender.value,
                'preferred_institutes': student_input.preferred_institutes,
                'preferred_branches': student_input.preferred_branches,
                'max_closing_rank': student_input.max_closing_rank
            }
            # Get filtered data
            filtered_data = await self.data_service.get_filtered_data(filters)
            if filtered_data.empty:
                logger.info("No colleges found matching the criteria")
                return []
            # Print unique city names in college data for comparison
            unique_college_cities = set(filtered_data['City'].dropna().unique()) if 'City' in filtered_data.columns else set()
            logger.info(f"Unique college cities in data: {list(unique_college_cities)[:20]}")
            logger.info(f"Unique geo_data cities: {list(self.geo_data.keys())[:20]}")
            # Calculate distances if required
            if student_input.max_distance_km:
                filtered_data = await self._filter_by_distance(
                    filtered_data, 
                    student_input, 
                    student_input.max_distance_km
                )
            else:
                logger.info("Distance filter disabled (max_distance_km is None or 0)")
            # Calculate recommendation scores
            recommendations = await self._calculate_recommendation_scores(
                filtered_data, 
                student_input
            )
            # Sort by recommendation score
            recommendations.sort(key=lambda x: x.recommendation_score, reverse=True)
            # Return top 50 recommendations
            return recommendations[:50]
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            raise

    async def _filter_by_distance(self, df: pd.DataFrame, student_input: StudentInput, max_distance: int) -> pd.DataFrame:
        """Filter colleges by distance from home city (or state if city not provided)"""
        try:
            # Use home_city if provided, else fallback to home_state
            home_location = student_input.home_city or student_input.home_state
            logger.info(f"Looking up coordinates for home location: {home_location}")
            home_coords = await self._get_coordinates(home_location)
            if not home_coords:
                logger.warning(f"Could not get coordinates for {home_location}")
                return df
            valid_rows = []
            for _, row in df.iterrows():
                college_city = row.get('City', row.get('city', ''))
                logger.info(f"Looking up coordinates for college city: {college_city}")
                if not college_city:
                    logger.warning(f"Skipping row due to missing city: {row.to_dict()}")
                    continue  # skip if city is missing
                college_coords = await self._get_coordinates(college_city)
                if not college_coords:
                    logger.warning(f"Skipping row due to failed coordinate lookup for city: {college_city} | Row: {row.to_dict()}")
                    continue
                distance = geodesic(home_coords, college_coords).kilometers
                if distance <= max_distance:
                    row_dict = row.to_dict()
                    row_dict['distance_km'] = round(distance, 2)
                    valid_rows.append(row_dict)
            logger.info(f"Rows after distance filtering: {len(valid_rows)}")
            return pd.DataFrame(valid_rows)
        except Exception as e:
            logger.error(f"Error filtering by distance: {str(e)}")
            return df

    def normalize(self, s):
        return re.sub(r'[^a-z0-9]', '', s.lower().strip()) if s else ''

    async def _get_coordinates(self, location: str) -> tuple:
        """Get coordinates for a city with caching and geo_data lookup, with suffix and fuzzy matching"""
        if location in self.location_cache:
            return self.location_cache[location]
        # Use only the city name for lookup
        city = location.split(',')[0] if ',' in location else location
        norm_city = self.normalize(city)
        coords = self.geo_data.get(norm_city)
        if coords:
            logger.info(f"Geo_data HIT for city '{city}' (normalized: '{norm_city}') -> {coords}")
            self.location_cache[location] = coords
            return coords
        # Suffix handling: look for any key that starts with norm_city
        for key in self.geo_data:
            if key.startswith(norm_city):
                coords = self.geo_data[key]
                logger.info(f"Geo_data SUFFIX MATCH for city '{city}' (normalized: '{norm_city}') -> {key} -> {coords}")
                self.location_cache[location] = coords
                return coords
        # Fuzzy matching: use difflib to find the closest match
        close_matches = difflib.get_close_matches(norm_city, self.geo_data.keys(), n=1, cutoff=0.8)
        if close_matches:
            match = close_matches[0]
            coords = self.geo_data[match]
            logger.info(f"Geo_data FUZZY MATCH for city '{city}' (normalized: '{norm_city}') -> {match} -> {coords}")
            self.location_cache[location] = coords
            return coords
        logger.info(f"Geo_data MISS for city '{city}' (normalized: '{norm_city}'), returning None (no geopy fallback)")
        self.location_cache[location] = None
        return None

    def _get_field(self, row, possible_names):
        # Normalize row keys for robust matching
        norm_row = {self.normalize(str(k)): v for k, v in row.items()}
        for name in possible_names:
            norm_name = self.normalize(name)
            if norm_name in norm_row and not pd.isna(norm_row[norm_name]) and norm_row[norm_name] != '':
                return norm_row[norm_name]
        return None

    async def _calculate_recommendation_scores(self, df: pd.DataFrame, student_input: StudentInput) -> List[CollegeResponse]:
        """Calculate recommendation scores for colleges"""
        # Group by institute, branch, and category to consolidate quota options
        grouped_data = {}
        
        # Map all possible variations for each required field
        field_map = {
            'Institute': ['institute', 'institute_name', 'college_name', 'college'],
            'Branch': ['branch', 'course', 'program'],
            'State_Quota': ['state_quota', 'quota', 'quota_type'],
            'Category': ['category', 'caste_category'],
            'Gender': ['gender', 'gender_type'],
            'Opening_Rank': ['opening_rank', 'opening_rank'],
            'Closing_Rank': ['closing_rank', 'closing_rank'],
            'City': ['city', 'location', 'place'],
            'State': ['state', 'college_state', 'institute_state']
        }
        
        # Log a sample row for debugging
        if not df.empty:
            logger.info(f"Processing {len(df)} rows of data")
            logger.info(f"Sample row columns: {list(df.columns)}")
            sample_row = df.iloc[0]
            logger.info(f"Sample row data: {sample_row.to_dict()}")
        
        try:
            for _, row in df.iterrows():
                values = {}
                for key, variations in field_map.items():
                    val = self._get_field(row, variations)
                    if val is None:
                        logger.warning(f"Row missing required field '{key}'. Available columns: {list(row.index)}. Filling with default.")
                        # Fill with default value
                        if 'Rank' in key:
                            val = 0
                        else:
                            val = 'Unknown'
                    values[key] = val
                
                # Create a unique key for grouping
                group_key = (
                    str(values['Institute']).strip().upper(),
                    str(values['Branch']).strip().upper(),
                    str(values['Category']).strip().upper(),
                    str(values['Gender']).strip().upper(),
                    str(values['State']).strip().upper(),
                    str(values['City']).strip().upper() if values['City'] else ''
                )
                
                # Create quota option
                opening_rank = self._safe_int(values['Opening_Rank'])
                closing_rank = self._safe_int(values['Closing_Rank'])
                
                quota_option = {
                    'quota': str(values['State_Quota']),
                    'opening_rank': opening_rank,
                    'closing_rank': closing_rank
                }
                
                if group_key not in grouped_data:
                    # Calculate score for this college
                    score = await self._calculate_single_score(row, student_input)
                    
                    grouped_data[group_key] = {
                        'institute_name': str(values['Institute']),
                        'college_name': str(values['Institute']),
                        'branch': str(values['Branch']),
                        'category': str(values['Category']),
                        'gender': str(values['Gender']),
                        'state': str(values['State']),
                        'city': str(values['City']),
                        'distance_km': row.get('distance_km'),
                        'institute_type': self._determine_institute_type(row),
                        'recommendation_score': round(score, 2),
                        'cutoff_year': '2023',
                        'quota_options': [quota_option]
                    }
                else:
                    # Add quota option to existing group
                    grouped_data[group_key]['quota_options'].append(quota_option)
            
            # Convert grouped data to CollegeResponse objects
            recommendations = []
            for group_data in grouped_data.values():
                # Sort quota options by closing rank
                group_data['quota_options'].sort(key=lambda x: x['closing_rank'])
                
                college_response = CollegeResponse(
                    institute_name=group_data['institute_name'],
                    college_name=group_data['college_name'],
                    branch=group_data['branch'],
                    quota_options=group_data['quota_options'],
                    category=group_data['category'],
                    gender=group_data['gender'],
                    state=group_data['state'],
                    city=group_data['city'],
                    distance_km=group_data['distance_km'],
                    institute_type=group_data['institute_type'],
                    recommendation_score=group_data['recommendation_score'],
                    cutoff_year=group_data['cutoff_year'],
                    additional_info={}
                )
                recommendations.append(college_response)
                
        except Exception as e:
            logger.error(f"Error calculating recommendation scores: {str(e)}")
        
        return recommendations

    async def _calculate_single_score(self, row: pd.Series, student_input: StudentInput) -> float:
        """Calculate recommendation score for a single college (normalized 0-100, weighted factors, never 0 if any match)"""
        try:
            weights = {
                'rank_safety': 0.4, 
                'institute': 0.2,
                'branch': 0.15,
                'distance': 0.15,
                'home_state': 0.1
            }
            score = 0.0
            max_score = sum(weights.values())
            debug_parts = []

            # --- Rank Safety ---
            closing_rank_variations = ['closing_rank', 'closing_rank']
            closing_rank = self._safe_int(self._get_field(row, closing_rank_variations) or 0)
            rank_safety = 0.0
            if closing_rank > 0 and student_input.rank > 0:
                margin = (closing_rank - student_input.rank) / student_input.rank
                if margin > 0.5:
                    rank_safety = 1.0
                elif margin > 0.2:
                    rank_safety = 0.7
                elif margin > 0:
                    rank_safety = 0.5
                else:
                    rank_safety = 0.2  # less harsh, not 0.1
            else:
                rank_safety = 0.2  # always give some score if data is present
            score += weights['rank_safety'] * rank_safety
            debug_parts.append(f"rank_safety={rank_safety}")

            # --- Institute Preference ---
            institute_variations = ['institute', 'institute_name', 'college_name', 'college']
            institute_name = str(self._get_field(row, institute_variations) or '').upper()
            institute_match = 0.0
            for pref_institute in student_input.preferred_institutes:
                if pref_institute.upper() == "IIT" and "INDIAN INSTITUTE OF TECHNOLOGY" in institute_name:
                    institute_match = 1.0
                    break
                elif pref_institute.upper() == "NIT" and "NATIONAL INSTITUTE OF TECHNOLOGY" in institute_name:
                    institute_match = 1.0
                    break
                elif pref_institute.upper() == "IIIT" and "INDIAN INSTITUTE OF INFORMATION TECHNOLOGY" in institute_name:
                    institute_match = 1.0
                    break
                elif pref_institute.upper() == "GFTI" and ("INDIAN INSTITUTE OF TECHNOLOGY" not in institute_name and 
                                                          "NATIONAL INSTITUTE OF TECHNOLOGY" not in institute_name and 
                                                          "INDIAN INSTITUTE OF INFORMATION TECHNOLOGY" not in institute_name):
                    institute_match = 1.0
                    break
            if institute_match == 0.0 and institute_name:
                institute_match = 0.2  # partial score if no match but data present
            score += weights['institute'] * institute_match
            debug_parts.append(f"institute_match={institute_match}")

            # --- Branch Preference ---
            branch_variations = ['branch', 'course', 'program']
            branch_name = str(self._get_field(row, branch_variations) or '').upper()
            branch_match = 0.0
            for pref_branch in student_input.preferred_branches:
                if pref_branch.upper() in branch_name:
                    branch_match = 1.0
                    break
            if branch_match == 0.0 and branch_name:
                branch_match = 0.2
            score += weights['branch'] * branch_match
            debug_parts.append(f"branch_match={branch_match}")

            # --- Distance ---
            distance_score = 0.0
            if 'distance_km' in row and row['distance_km'] is not None:
                distance = row['distance_km']
                if distance < 100:
                    distance_score = 1.0
                elif distance < 300:
                    distance_score = 0.7
                elif distance < 500:
                    distance_score = 0.4
                else:
                    distance_score = 0.2
            else:
                distance_score = 0.2
            score += weights['distance'] * distance_score
            debug_parts.append(f"distance_score={distance_score}")

            # --- Home State Quota ---
            state_variations = ['state', 'college_state', 'institute_state']
            quota_variations = ['state_quota', 'quota', 'quota_type']
            college_state = str(self._get_field(row, state_variations) or '').upper()
            quota = str(self._get_field(row, quota_variations) or '').upper()
            home_state_match = 0.0
            if (student_input.home_state and student_input.home_state.upper() in college_state) or ('HS' in quota or 'HOME STATE' in quota):
                home_state_match = 1.0
            elif college_state or quota:
                home_state_match = 0.2
            score += weights['home_state'] * home_state_match
            debug_parts.append(f"home_state_match={home_state_match}")

            # --- Normalize to 0-100 ---
            normalized_score = int(round((score / max_score) * 100))
            if normalized_score == 0:
                normalized_score = 10  # minimum score if any data present
            logger.info(f"[SCORE DEBUG] {debug_parts} => {normalized_score}")
            return normalized_score
        except Exception as e:
            logger.error(f"Error calculating score for row: {str(e)}")
            return 10  # Return 10 on error

    def _safe_int(self, value) -> int:
        """Safely convert value to integer"""
        try:
            if pd.isna(value) or value is None:
                return 0
            if isinstance(value, str):
                # Remove any non-numeric characters except decimal point
                cleaned = ''.join(c for c in value if c.isdigit() or c == '.')
                if not cleaned:
                    return 0
                return int(float(cleaned))
            return int(float(value))
        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to convert '{value}' to int: {e}")
            return 0

    def _determine_institute_type(self, row: pd.Series) -> str:
        """Determine institute type from row data (robust, non-overlapping)"""
        institute_variations = ['institute', 'institute_name', 'college_name', 'college']
        institute_name = self._get_field(row, institute_variations)
        if not institute_name:
            return 'Other'
        institute_name = str(institute_name).upper()
        
        # Use simple string matching based on actual institute names
        if "INDIAN INSTITUTE OF INFORMATION TECHNOLOGY" in institute_name:
            return 'IIIT'
        elif "INDIAN INSTITUTE OF TECHNOLOGY" in institute_name:
            return 'IIT'
        elif "NATIONAL INSTITUTE OF TECHNOLOGY" in institute_name:
            return 'NIT'
        else:
            # All other institutes are considered GFTI
            return 'GFTI'