import pandas as pd
import os
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import asyncio
import re

logger = logging.getLogger(__name__)

class DataService:
    def __init__(self, data_folder_path: str):
        self.data_folder_path = Path(data_folder_path)
        self.data_cache: Dict[str, pd.DataFrame] = {}
        self.filters_cache: Optional[Dict[str, List[str]]] = None
        
    async def load_all_data(self):
        """Load all Excel files from the data folder"""
        try:
            self.data_cache.clear()
            
            if not self.data_folder_path.exists():
                raise FileNotFoundError(f"Data folder not found: {self.data_folder_path}")
            
            excel_files = list(self.data_folder_path.glob("*.xlsx"))
            
            if not excel_files:
                raise FileNotFoundError("No Excel files found in data folder")
            
            for file_path in excel_files:
                try:
                    df = pd.read_excel(file_path, engine='openpyxl')
                    file_key = file_path.stem.lower()
                    self.data_cache[file_key] = df
                    logger.info(f"Loaded {len(df)} records from {file_path.name}")
                except Exception as e:
                    logger.error(f"Error loading {file_path.name}: {str(e)}")
            
            # Clear filters cache to force regeneration
            self.filters_cache = None
            
            logger.info(f"Successfully loaded {len(self.data_cache)} Excel files")
            
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise

    async def get_available_filters(self) -> Dict[str, List[str]]:
        """Get all available filter options from the loaded data"""
        if self.filters_cache:
            return self.filters_cache
        
        if not self.data_cache:
            await self.load_all_data()
        
        filters = {
            "states": set(),
            "branches": set(),
            "categories": set(),
            "genders": set(),
            "institutes": set(),
            "quotas": set(),
            "cities": set()
        }
        
        try:
            for df in self.data_cache.values():
                # Standardize column names (handle variations)
                df_columns = [col.lower().replace(' ', '_') for col in df.columns]
                
                # Map common column variations
                column_mapping = {
                    'state': ['state', 'college_state', 'institute_state'],
                    'branch': ['branch', 'course', 'program'],
                    'category': ['category', 'caste_category'],
                    'gender': ['gender', 'gender_type'],
                    'institute': ['institute', 'institute_name', 'college_name'],
                    'quota': ['quota', 'quota_type'],
                    'city': ['city', 'location', 'place']
                }
                
                for filter_key, possible_cols in column_mapping.items():
                    for col in possible_cols:
                        if col in df_columns:
                            idx = df_columns.index(col)
                            actual_col = df.columns[idx]
                            unique_values = df[actual_col].dropna().unique()
                            # Fix pluralization for filter keys
                            if filter_key == "branch":
                                key_name = "branches"
                            elif filter_key == "category":
                                key_name = "categories"
                            elif filter_key == "city":
                                key_name = "cities"
                            else:
                                key_name = f"{filter_key}s"
                            filters[key_name].update(unique_values)
                            break
            
            # Convert sets to sorted lists
            self.filters_cache = {
                key: sorted(list(values)) for key, values in filters.items()
            }
            
            # Add cities from geo_data Excel
            geo_df = pd.read_excel('data/Geo_data_INDIA_all_cities.xlsx')
            cities = sorted(list(set(str(city).strip() for city in geo_df['City'].dropna().unique())))
            self.filters_cache['cities'] = cities
            
            return self.filters_cache
            
        except Exception as e:
            logger.error(f"Error generating filters: {str(e)}")
            raise

    async def get_filtered_data(self, filters: Dict[str, Any]) -> pd.DataFrame:
        """Get filtered college data based on provided filters"""
        if not self.data_cache:
            await self.load_all_data()
        
        combined_df = pd.DataFrame()
        
        for file_key, df in self.data_cache.items():
            # Skip geo_data file as it's not college data
            if file_key == 'geo_data_india_all_cities':
                continue
            
            # Normalize columns before any logging or filtering
            df = df.copy()
            df.columns = [col.lower().replace(' ', '_') for col in df.columns]
            
            # Debug: show which file is being filtered
            logger.info(f"Filtering file: {file_key}, columns: {list(df.columns)}")
            if 'institute' in df.columns:
                logger.info(f"Sample institute values: {df['institute'].unique()[:5]}")
            
            # Extra debug: log sample IIT data
            if file_key.startswith('iit'):
                logger.info(f"[IIT DEBUG] Sample IIT data: {df.head(3).to_dict('records')}")
            
            # Apply filters to each dataframe
            filtered_df = self._apply_filters_to_dataframe(df, filters)
            
            if not filtered_df.empty:
                # Add source information
                filtered_df = filtered_df.copy()
                filtered_df['source_file'] = file_key
                combined_df = pd.concat([combined_df, filtered_df], ignore_index=True)
        
        # Remove duplicate rows
        logger.info(f"Combined results before dropping duplicates: {len(combined_df)} rows")
        combined_df = combined_df.drop_duplicates()
        logger.info(f"Combined results after dropping duplicates: {len(combined_df)} rows")
        
        # Debug: log preferred_institutes filter
        logger.info(f"[FILTER DEBUG] preferred_institutes: {filters.get('preferred_institutes')}")
        
        return combined_df

    def _apply_filters_to_dataframe(self, df: pd.DataFrame, filters: Dict[str, Any]) -> pd.DataFrame:
        """Apply filters to a single dataframe (robust version)"""
        # Normalize columns
        df = df.copy()
        df.columns = [col.lower().replace(' ', '_') for col in df.columns]
        expected_columns = ['institute', 'branch', 'category', 'gender', 'city', 'state', 'closing_rank']
        for col in expected_columns:
            if col not in df.columns:
                df[col] = None
        filtered_df = df.copy()
        try:
            # Rank filter
            if 'rank' in filters and filters['rank']:
                if 'closing_rank' in filtered_df.columns and not filtered_df['closing_rank'].dropna().empty:
                    filtered_df = filtered_df[
                        pd.to_numeric(filtered_df['closing_rank'], errors='coerce') >= filters['rank']
                    ]
            # Max closing rank filter
            if 'max_closing_rank' in filters and filters['max_closing_rank']:
                if 'closing_rank' in filtered_df.columns and not filtered_df['closing_rank'].dropna().empty:
                    filtered_df = filtered_df[
                        pd.to_numeric(filtered_df['closing_rank'], errors='coerce') <= filters['max_closing_rank']
                    ]
            # Category filter
            if 'category' in filters and filters['category']:
                if 'category' in filtered_df.columns and not filtered_df['category'].dropna().empty:
                    category = filters['category'].upper()
                    if category == 'GENERAL':
                        category = 'OPEN'
                    filtered_df = filtered_df[
                        filtered_df['category'].str.upper().str.contains(category, na=False)
                    ]
            # Gender filter
            if 'gender' in filters and filters['gender']:
                if 'gender' in filtered_df.columns and not filtered_df['gender'].dropna().empty:
                    gender = filters['gender'].upper()
                    filtered_df = filtered_df[
                        filtered_df['gender'].str.upper().str.contains(gender, na=False)
                    ]
            # Institute filter
            if 'preferred_institutes' in filters and filters['preferred_institutes']:
                institute_cols = ['institute', 'institute_name', 'college_name']
                institute_col = None
                for col in institute_cols:
                    if col in filtered_df.columns and not filtered_df[col].dropna().empty:
                        institute_col = col
                        break
                if institute_col:
                    institutes = [inst.upper() for inst in filters['preferred_institutes']]
                    logger.info(f"Institute filter using column: {institute_col}")
                    logger.info(f"Sample values: {filtered_df[institute_col].unique()[:5]}")
                    logger.info(f"Filtering for: {institutes}")
                    
                    def match_institute(val):
                        val_upper = str(val).upper()
                        for inst in institutes:
                            if inst == "IIT":
                                if "INDIAN INSTITUTE OF TECHNOLOGY" in val_upper:
                                    return True
                            elif inst == "NIT":
                                if "NATIONAL INSTITUTE OF TECHNOLOGY" in val_upper:
                                    return True
                            elif inst == "IIIT":
                                if "INDIAN INSTITUTE OF INFORMATION TECHNOLOGY" in val_upper:
                                    return True
                            elif inst == "GFTI":
                                # GFTI institutes don't have a common pattern, so we'll include all non-IIT/NIT/IIIT institutes
                                if ("INDIAN INSTITUTE OF TECHNOLOGY" not in val_upper and 
                                    "NATIONAL INSTITUTE OF TECHNOLOGY" not in val_upper and 
                                    "INDIAN INSTITUTE OF INFORMATION TECHNOLOGY" not in val_upper):
                                    return True
                        return False
                    
                    filtered_df = filtered_df[
                        filtered_df[institute_col].apply(match_institute)
                    ]
                    logger.info(f"[INSTITUTE FILTER DEBUG] Institutes filter: {institutes}, Filtered count: {len(filtered_df)}")
            # Branch filter
            if 'preferred_branches' in filters and filters['preferred_branches']:
                if 'branch' in filtered_df.columns and not filtered_df['branch'].dropna().empty:
                    branches = [b.upper() for b in filters['preferred_branches']]
                    filtered_df = filtered_df[
                        filtered_df['branch'].str.upper().apply(lambda val: any(b in val for b in branches))
                    ]
            # City filter
            if 'home_city' in filters and filters['home_city']:
                if 'city' in filtered_df.columns and not filtered_df['city'].dropna().empty:
                    city = filters['home_city'].upper()
                    filtered_df = filtered_df[
                        filtered_df['city'].str.upper().str.contains(city, na=False)
                    ]
            return filtered_df
        except Exception as e:
            logger.error(f"Error applying robust filters: {str(e)}")
            return pd.DataFrame()

    async def get_data_summary(self) -> Dict[str, Any]:
        """Get summary statistics of loaded data"""
        if not self.data_cache:
            await self.load_all_data()
        
        summary = {
            "total_files": len(self.data_cache),
            "files": {},
            "total_records": 0
        }
        
        for file_key, df in self.data_cache.items():
            file_info = {
                "records": len(df),
                "columns": list(df.columns),
                "sample_data": df.head(2).to_dict('records') if not df.empty else []
            }
            summary["files"][file_key] = file_info
            summary["total_records"] += len(df)
        
        return summary