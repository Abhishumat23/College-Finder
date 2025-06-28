import React, { useState } from 'react';
import { MapPin, Award, BookOpen, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { CollegeRecommendation } from '../types';

interface CollegeCardProps {
  college: CollegeRecommendation;
  rank: number;
}

const CollegeCard: React.FC<CollegeCardProps> = ({ college, rank }) => {
  const [showQuotaDetails, setShowQuotaDetails] = useState(false);

  const getInstituteColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'IIT': return 'bg-red-100 text-red-800 border-red-200';
      case 'NIT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IIIT': return 'bg-green-100 text-green-800 border-green-200';
      case 'GFTI': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-theme-tertiary text-theme-primary border-theme-primary';
    }
  };

  const getQuotaColor = (quota: string) => {
    switch (quota.toUpperCase()) {
      case 'HS': return 'bg-green-100 text-green-800 border-green-200';
      case 'OS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AI': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-theme-tertiary text-theme-primary border-theme-primary';
    }
  };

  // Get the best closing rank for display
  const bestQuota = college.quota_options.reduce((best, current) => 
    current.closing_rank < best.closing_rank ? current : best
  );

  return (
    <div className="bg-theme-secondary border border-theme-primary rounded-xl shadow-theme hover:shadow-theme-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-theme-tertiary to-blue-50 dark:to-blue-900/30 px-6 py-4 border-b border-theme-primary">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                #{rank}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getInstituteColor(college.institute_type)}`}>
                {college.institute_type}
              </span>
            </div>
            <h3 className="text-lg font-bold text-theme-primary leading-tight">
              {college.institute_name}
            </h3>
            <p className="text-sm text-theme-secondary mt-1">{college.college_name}</p>
          </div>
      </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Branch */}
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-theme-primary">{college.branch}</p>
            <p className="text-sm text-theme-secondary">Branch</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center space-x-3">
          <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-theme-primary">
              {college.city ? `${college.city}, ${college.state}` : college.state}
            </p>
            <div className="flex items-center space-x-2 text-sm text-theme-secondary">
              <span>Location</span>
              {college.distance_km && (
                <>
                  <span>•</span>
                  <span>{college.distance_km} km away</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Best Rank Information */}
        <div className="bg-theme-tertiary rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-theme-primary">Best Rank (All Quotas)</h4>
            <button
              onClick={() => setShowQuotaDetails(!showQuotaDetails)}
              className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {showQuotaDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show All Quotas
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-theme-secondary">Opening Rank</span>
              </div>
              <p className="text-lg font-bold text-theme-primary">
                {bestQuota.opening_rank ? bestQuota.opening_rank.toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Award className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-theme-secondary">Closing Rank</span>
              </div>
              <p className="text-lg font-bold text-theme-primary">
                {bestQuota.closing_rank.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Quota Details */}
        {showQuotaDetails && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-theme-primary mb-3">All Quota Options</h4>
            {college.quota_options.map((quota, index) => (
              <div key={index} className="bg-theme-primary rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getQuotaColor(quota.quota)}`}>
                    {quota.quota}
                  </span>
                  <span className="text-xs text-theme-tertiary">
                    {quota.quota === 'HS' ? 'Home State' : quota.quota === 'OS' ? 'Other State' : quota.quota}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-theme-secondary">Opening:</span>
                    <span className="font-semibold ml-1 text-theme-primary">
                      {quota.opening_rank ? quota.opening_rank.toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-theme-secondary">Closing:</span>
                    <span className="font-semibold ml-1 text-theme-primary">
                      {quota.closing_rank.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
            {college.category}
          </span>
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs font-medium rounded-full">
            {college.gender}
          </span>
          {college.cutoff_year && (
            <span className="px-3 py-1 bg-theme-tertiary text-theme-primary text-xs font-medium rounded-full">
              {college.cutoff_year} Data
            </span>
          )}
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs font-medium rounded-full">
            {college.quota_options.length} Quota{college.quota_options.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CollegeCard;