export interface QuotaOption {
  quota: string;
  opening_rank?: number;
  closing_rank: number;
}

export interface StudentInput {
  rank: number;
  category: string;
  gender: 'Male-only' | 'Female-only' | 'Gender-Neutral';
  home_city?: string;
  preferred_institutes: string[];
  preferred_branches: string[];
  max_distance_km?: number;
  max_closing_rank?: number;
  priority_preference?: 'rank' | 'distance' | 'institute';
}

export interface CollegeRecommendation {
  institute_name: string;
  college_name: string;
  branch: string;
  quota_options: QuotaOption[];
  category: string;
  gender: string;
  state: string;
  city?: string;
  distance_km?: number;
  institute_type: string;
  recommendation_score: number;
  cutoff_year?: string;
}

export interface FilterOptions {
  states: string[];
  branches: string[];
  categories: string[];
  genders: string[];
  institutes: string[];
  quotas: string[];
  cities: string[];
}