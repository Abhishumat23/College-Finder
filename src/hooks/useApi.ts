import { useState, useEffect } from 'react';
import { StudentInput, CollegeRecommendation, FilterOptions } from '../types';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend URL

export const useApi = () => {
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [recommendations, setRecommendations] = useState<CollegeRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load filters on component mount
  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/filters`);
      if (response.ok) {
        const data = await response.json();
        setFilters(data);
        setError(null);
      } else {
        setError('Unable to connect to the backend API.');
        setFilters(null);
      }
    } catch (err) {
      setError('Unable to connect to the backend API.');
      setFilters(null);
    }
  };

  const getRecommendations = async (studentInput: StudentInput) => {
    setLoading(true);
    setError(null);
    
    // Debug: Log the input data
    console.log('Submitting form data:', studentInput);
    
    try {
      const response = await fetch(`${API_BASE_URL}/predict-colleges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentInput),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('API Error:', err);
      setError('Unable to connect to the recommendation service. Please ensure the FastAPI backend is running on http://localhost:8000');
      
      // Generate mock data for demonstration
      const mockRecommendations = generateMockRecommendations(studentInput);
      setRecommendations(mockRecommendations);
    } finally {
      setLoading(false);
    }
  };

  const generateMockRecommendations = (input: StudentInput): CollegeRecommendation[] => {
    const mockColleges = [
      {
        institute_name: 'NIT Trichy',
        college_name: 'National Institute of Technology Tiruchirappalli',
        branch: 'Computer Science and Engineering',
        quota_options: [
          {
            quota: 'HS',
            opening_rank: Math.max(1000, input.rank - 5000),
            closing_rank: input.rank + 2000
          },
          {
            quota: 'OS',
            opening_rank: Math.max(1000, input.rank - 4000),
            closing_rank: input.rank + 1500
          }
        ],
        category: input.category,
        gender: 'Gender-Neutral',
        state: 'Tamil Nadu',
        city: 'Tiruchirappalli',
        distance_km: 150,
        institute_type: 'NIT',
        recommendation_score: 92.5,
        cutoff_year: '2023'
      },
      {
        institute_name: 'IIIT Hyderabad',
        college_name: 'International Institute of Information Technology Hyderabad',
        branch: 'Electronics and Communication Engineering',
        quota_options: [
          {
            quota: 'AI',
            opening_rank: Math.max(1000, input.rank - 3000),
            closing_rank: input.rank + 1500
          }
        ],
        category: input.category,
        gender: 'Gender-Neutral',
        state: 'Telangana',
        city: 'Hyderabad',
        distance_km: 320,
        institute_type: 'IIIT',
        recommendation_score: 88.7,
        cutoff_year: '2023'
      },
      {
        institute_name: 'NIT Warangal',
        college_name: 'National Institute of Technology Warangal',
        branch: 'Mechanical Engineering',
        quota_options: [
          {
            quota: 'HS',
            opening_rank: Math.max(1000, input.rank - 4000),
            closing_rank: input.rank + 3000
          },
          {
            quota: 'OS',
            opening_rank: Math.max(1000, input.rank - 3500),
            closing_rank: input.rank + 2500
          }
        ],
        category: input.category,
        gender: 'Gender-Neutral',
        state: 'Telangana',
        city: 'Warangal',
        distance_km: 280,
        institute_type: 'NIT',
        recommendation_score: 85.3,
        cutoff_year: '2023'
      }
    ];

    return mockColleges.filter(college => 
      input.preferred_institutes.some(inst => 
        college.institute_type.toLowerCase().includes(inst.toLowerCase())
      ) &&
      (input.preferred_branches.length === 0 || input.preferred_branches.some(branch => 
        college.branch.toLowerCase().includes(branch.toLowerCase())
      ))
    );
  };

  return {
    filters,
    recommendations,
    loading,
    error,
    getRecommendations,
    loadFilters
  };
};