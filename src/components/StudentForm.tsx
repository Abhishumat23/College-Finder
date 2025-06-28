import React, { useState, useEffect } from 'react';
import { Search, MapPin, Award, Users, BookOpen, Settings } from 'lucide-react';
import { StudentInput, FilterOptions } from '../types';

interface StudentFormProps {
  onSubmit: (data: StudentInput) => void;
  loading: boolean;
  filters: FilterOptions | null;
}

const StudentForm: React.FC<StudentFormProps> = ({ onSubmit, loading, filters }) => {
  const [formData, setFormData] = useState<StudentInput & { branchSearch?: string }>({
    rank: 0,
    category: 'OPEN',
    gender: 'Gender-Neutral',
    home_city: '',
    preferred_institutes: ['IIT', 'NIT'],
    preferred_branches: [],
    max_distance_km: undefined,
    priority_preference: 'rank',
    branchSearch: '',
    max_closing_rank: undefined
  });

  const categories = filters?.categories || [];
  const genders = ['Male-only', 'Female-only', 'Gender-Neutral'];
  const institutes = ['IIT', 'NIT', 'IIIT', 'GFTI'];
  const priorities = [
    { value: 'rank', label: 'Best Rank Match' },
    { value: 'distance', label: 'Nearest Colleges' },
    { value: 'institute', label: 'Preferred Institutes' }
  ];

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: categories[0] as string }));
    }
  }, [categories, formData.category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug: Log the form data before submission
    console.log('Form data before submission:', formData);
    
    if (formData.rank > 0 && formData.home_city && (!formData.max_distance_km || formData.home_city)) {
      onSubmit(formData);
    }
  };

  const handleInstituteChange = (institute: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_institutes: prev.preferred_institutes.includes(institute)
        ? prev.preferred_institutes.filter(i => i !== institute)
        : [...prev.preferred_institutes, institute]
    }));
  };

  return (
    <div className="bg-theme-secondary border border-theme-primary rounded-2xl shadow-theme-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 dark:from-blue-900/30 to-indigo-50 dark:to-indigo-900/30 px-8 py-6 border-b border-theme-primary">
        <h2 className="text-2xl font-bold text-theme-primary flex items-center">
          <Search className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
          Find Your Perfect College
        </h2>
        <p className="text-theme-secondary mt-2">Enter your details to get personalized recommendations</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-sm font-semibold text-theme-primary mb-3">
              <Award className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              JEE Main Rank *
            </label>
            <input
              type="number"
              value={formData.rank || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setFormData(prev => ({ ...prev, rank: 0 }));
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setFormData(prev => ({ ...prev, rank: numValue }));
                  }
                }
              }}
              className="w-full px-4 py-3 border border-theme-primary bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
              placeholder="Enter your JEE Main rank"
              required
              min="1"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-semibold text-theme-primary mb-3">
              <Users className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full px-4 py-3 border border-theme-primary bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
              required
            >
              <option value="" disabled>Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Closing Rank Filter - now beneath JEE Main Rank */}
        <div>
          <label className="flex items-center text-sm font-semibold text-theme-primary mb-3">
            <Award className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
            Recommended Closing Rank
          </label>
          <input
            type="number"
            value={formData.max_closing_rank || ''}
            onChange={e => setFormData(prev => ({ ...prev, max_closing_rank: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="w-full px-4 py-3 border border-theme-primary bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            placeholder="Enter a closing rank to filter (optional)"
            min="1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-sm font-semibold text-theme-primary mb-3">
              <Users className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              Gender Preference
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
              className="w-full px-4 py-3 border border-theme-primary bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            >
              {genders.map(gender => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center text-sm font-semibold text-theme-primary mb-3">
            <MapPin className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
            Home City {formData.max_distance_km ? '*' : ''}
          </label>
          {filters?.cities && filters.cities.length > 0 ? (
            <div className="relative">
              <input
                type="text"
                value={formData.home_city || ''}
                onChange={e => setFormData(prev => ({ ...prev, home_city: e.target.value }))}
                className="w-full px-4 py-3 border border-theme-primary bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                placeholder="Start typing your city..."
                required={!!formData.max_distance_km}
                autoComplete="off"
              />
              {(formData.home_city || '') &&
                !filters.cities.some(city => city.toLowerCase() === (formData.home_city || '').toLowerCase()) && (
                  <ul className="absolute z-10 w-full bg-theme-primary border border-theme-primary rounded-xl mt-1 max-h-48 overflow-y-auto shadow-theme-lg">
                    {filters.cities.filter(city =>
                      city.toLowerCase().includes((formData.home_city || '').toLowerCase())
                    ).slice(0, 10).map(city => (
                      <li
                        key={city}
                        className="px-4 py-2 cursor-pointer hover:bg-theme-tertiary text-theme-primary"
                        onClick={() => setFormData(prev => ({ ...prev, home_city: city }))}
                      >
                        {city}
                      </li>
                    ))}
                    {filters.cities.filter(city =>
                      city.toLowerCase().includes((formData.home_city || '').toLowerCase())
                    ).length === 0 && (
                      <li className="px-4 py-2 text-theme-tertiary">No matches found</li>
                    )}
                  </ul>
                )}
            </div>
          ) : (
            <input
              type="text"
              value={formData.home_city || ''}
              onChange={e => setFormData(prev => ({ ...prev, home_city: e.target.value }))}
              className="w-full px-4 py-3 border border-theme-primary bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
              placeholder="Enter your home city"
              required={!!formData.max_distance_km}
            />
          )}
        </div>

        {/* Preferences */}
        <div>
          <label className="flex items-center text-sm font-semibold text-theme-primary mb-4">
            <BookOpen className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
            Preferred Institute Types
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {institutes.map(institute => (
              <label key={institute} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preferred_institutes.includes(institute)}
                  onChange={() => handleInstituteChange(institute)}
                  className="w-5 h-5 text-blue-600 border-theme-primary rounded focus:ring-blue-500 bg-theme-primary"
                />
                <span className="text-sm font-medium text-theme-primary">{institute}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center text-sm font-semibold text-theme-primary mb-4">
            <BookOpen className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
            Preferred Branches
          </label>
          {filters?.branches && filters.branches.length > 0 && (
            <div className="relative">
              <input
                type="text"
                value={formData.branchSearch || ''}
                onChange={e => setFormData(prev => ({ ...prev, branchSearch: e.target.value }))}
                className="w-full px-4 py-3 border border-theme-primary bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                placeholder="Start typing a branch..."
                autoComplete="off"
              />
              {(formData.branchSearch || '') && (
                <ul className="absolute z-10 w-full bg-theme-primary border border-theme-primary rounded-xl mt-1 max-h-48 overflow-y-auto shadow-theme-lg">
                  {filters.branches.filter(branch =>
                    branch.toLowerCase().includes((formData.branchSearch || '').toLowerCase())
                  ).slice(0, 10).map(branch => (
                    <li
                      key={branch}
                      className="px-4 py-2 cursor-pointer hover:bg-theme-tertiary text-theme-primary"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          preferred_branches: prev.preferred_branches.includes(branch)
                            ? prev.preferred_branches
                            : [...prev.preferred_branches, branch],
                          branchSearch: ''
                        }));
                      }}
                    >
                      {branch}
                    </li>
                  ))}
                  {filters.branches.filter(branch =>
                    branch.toLowerCase().includes((formData.branchSearch || '').toLowerCase())
                  ).length === 0 && (
                    <li className="px-4 py-2 text-theme-tertiary">No matches found</li>
                  )}
                </ul>
              )}
              {/* Show selected branches with remove option */}
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.preferred_branches.map(branch => (
                  <span key={branch} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs flex items-center">
                    {branch}
                    <button
                      type="button"
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-red-600 dark:hover:text-red-400"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          preferred_branches: prev.preferred_branches.filter(b => b !== branch)
                        }))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-sm font-semibold text-theme-primary mb-3">
              <MapPin className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              Max Distance (km)
            </label>
            <input
              type="number"
              value={formData.max_distance_km || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setFormData(prev => ({ ...prev, max_distance_km: undefined }));
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setFormData(prev => ({ ...prev, max_distance_km: numValue }));
                  }
                }
              }}
              className="w-full px-4 py-3 border border-theme-primary bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
              placeholder="Optional distance limit"
              min="0"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-semibold text-theme-primary mb-3">
              <Settings className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              Priority Preference
            </label>
            <select
              value={formData.priority_preference}
              onChange={(e) => setFormData(prev => ({ ...prev, priority_preference: e.target.value as any }))}
              className="w-full px-4 py-3 border border-theme-primary bg-theme-primary text-theme-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.rank || !formData.home_city}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              Finding Your Perfect Colleges...
            </div>
          ) : (
            'Get College Recommendations'
          )}
        </button>
      </form>
    </div>
  );
};

export default StudentForm;