import React from 'react';
import { GraduationCap, Target } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-theme-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
              <GraduationCap className="h-8 w-8 text-blue-200" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                JEE College Predictor
              </h1>
              <p className="text-blue-200 mt-1 text-lg">
                Find your perfect engineering college match
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Target className="h-5 w-5 text-green-300" />
              <span className="text-sm font-medium">Smart Recommendations</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;