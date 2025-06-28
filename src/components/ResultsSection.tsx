import React, { useState } from 'react';
import { Download, TrendingUp, Award } from 'lucide-react';
import { CollegeRecommendation } from '../types';
import CollegeCard from './CollegeCard';

interface ResultsSectionProps {
  recommendations: CollegeRecommendation[];
  loading: boolean;
  onRelaxFilters?: () => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ recommendations, loading, onRelaxFilters }) => {
  const [sortBy, setSortBy] = useState<'score' | 'rank' | 'distance'>('score');
  const [filterInstitute, setFilterInstitute] = useState<string>('all');

  if (loading) {
    return (
      <div className="bg-theme-secondary border border-theme-primary rounded-2xl shadow-theme-lg p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-theme-primary mb-2">
            Analyzing Your Profile
          </h3>
          <p className="text-theme-secondary">
            Finding the best college matches based on your preferences...
          </p>
        </div>
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div className="bg-theme-secondary border border-theme-primary rounded-2xl shadow-theme-lg p-12">
        <div className="text-center">
          <div className="bg-theme-tertiary rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Award className="h-12 w-12 text-theme-tertiary" />
          </div>
          <h3 className="text-xl font-semibold text-theme-primary mb-2">
            No Colleges Found
          </h3>
          <p className="text-theme-secondary mb-6">
            No colleges match your current criteria. Try adjusting your preferences or rank range.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left max-w-md mx-auto mb-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Suggestions:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Increase your maximum distance</li>
              <li>• Add more institute types</li>
              <li>• Include more branch options</li>
              <li>• Check if your rank is realistic</li>
            </ul>
          </div>
          {onRelaxFilters && (
            <button
              onClick={onRelaxFilters}
              className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Relax Filters and Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.recommendation_score - a.recommendation_score;
      case 'rank':
        const aBestRank = Math.min(...a.quota_options.map(q => q.closing_rank));
        const bBestRank = Math.min(...b.quota_options.map(q => q.closing_rank));
        return aBestRank - bBestRank;
      case 'distance':
        return (a.distance_km || 999999) - (b.distance_km || 999999);
      default:
        return 0;
    }
  });

  const filteredRecommendations = filterInstitute === 'all' 
    ? sortedRecommendations 
    : sortedRecommendations.filter(college => 
        college.institute_type.toLowerCase() === filterInstitute.toLowerCase()
      );

  const instituteTypes = Array.from(new Set(recommendations.map(r => r.institute_type)));

  const downloadResults = () => {
    const csvContent = [
      ['Rank', 'Institute', 'College', 'Branch', 'State', 'Quota', 'Opening Rank', 'Closing Rank', 'Score'].join(','),
      ...filteredRecommendations.flatMap((college, index) => 
        college.quota_options.map(quota => [
          index + 1,
          college.institute_name,
          college.college_name,
          college.branch,
          college.state,
          quota.quota,
          quota.opening_rank || 'N/A',
          quota.closing_rank,
          college.recommendation_score
        ].join(','))
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'college_recommendations.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="bg-theme-secondary border border-theme-primary rounded-2xl shadow-theme-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-theme-primary flex items-center">
              <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
              Your College Recommendations
            </h2>
            <p className="text-theme-secondary mt-1">
              Found {filteredRecommendations.length} colleges matching your criteria
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-theme-primary bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="score">Sort by Match Score</option>
              <option value="rank">Sort by Closing Rank</option>
              <option value="distance">Sort by Distance</option>
            </select>

            {/* Filter Options */}
            <select
              value={filterInstitute}
              onChange={(e) => setFilterInstitute(e.target.value)}
              className="px-4 py-2 border border-theme-primary bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Institutes</option>
              {instituteTypes.map(type => (
                <option key={type} value={type}>{type} Only</option>
              ))}
            </select>

            {/* Download Button */}
            <button
              onClick={downloadResults}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-theme-primary">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {recommendations.filter(r => r.institute_type === 'IIT').length}
            </div>
            <div className="text-sm text-theme-secondary">IIT Options</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {recommendations.filter(r => r.institute_type === 'NIT').length}
            </div>
            <div className="text-sm text-theme-secondary">NIT Options</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {recommendations.filter(r => r.institute_type === 'IIIT').length}
            </div>
            <div className="text-sm text-theme-secondary">IIIT Options</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {recommendations.filter(r => r.institute_type === 'GFTI').length}
            </div>
            <div className="text-sm text-theme-secondary">GFTI Options</div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRecommendations.map((college, index) => (
          <CollegeCard
            key={`${college.institute_name}-${college.branch}-${index}`}
            college={college}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ResultsSection;