import { useState } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import StudentForm from './components/StudentForm';
import ResultsSection from './components/ResultsSection';
import { useApi } from './hooks/useApi';
import { StudentInput } from './types';

function App() {
  const { filters, recommendations, loading, error, getRecommendations } = useApi();
  const [hasSearched, setHasSearched] = useState(false);
  const [lastInput, setLastInput] = useState<StudentInput | null>(null);

  const handleFormSubmit = async (studentInput: StudentInput) => {
    setHasSearched(true);
    setLastInput(studentInput);
    await getRecommendations(studentInput);
  };

  const handleRelaxFilters = async () => {
    if (!lastInput) return;
    const relaxedInput = {
      ...lastInput,
      home_city: undefined,
      preferred_branches: [],
      preferred_institutes: [],
    };
    await getRecommendations(relaxedInput);
  };

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <WifiOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  Backend Connection Issue
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {error}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  <strong>Demo Mode:</strong> Showing sample recommendations for demonstration purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API Status Indicator */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center space-x-2 bg-theme-secondary border border-theme-primary rounded-full px-4 py-2 shadow-theme">
            {error ? (
              <>
                <WifiOff className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">Demo Mode</span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-300">API Connected</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="xl:col-span-1">
            <div className="sticky top-8">
              <StudentForm
                onSubmit={handleFormSubmit}
                loading={loading}
                filters={filters}
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="xl:col-span-2">
            {hasSearched ? (
              <ResultsSection
                recommendations={recommendations}
                loading={loading}
                onRelaxFilters={handleRelaxFilters}
              />
            ) : (
              <div className="bg-theme-secondary border border-theme-primary rounded-2xl shadow-theme-lg p-12">
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <AlertCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-theme-primary mb-2">
                    Ready to Find Your Perfect College?
                  </h3>
                  <p className="text-theme-secondary mb-6">
                    Fill out the form on the left with your JEE rank and preferences to get personalized college recommendations.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-left max-w-md mx-auto">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">What you'll get:</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
                        Personalized college recommendations
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
                        Match scores based on your preferences
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
                        Distance calculations from your home
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
                        Detailed cutoff information
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
                        Downloadable results
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-theme-secondary text-sm">
          <p>
            JEE College Predictor - Helping students find their perfect engineering college match
          </p>
          <p className="mt-2">
            Built with React, TypeScript, and FastAPI
          </p>
        </footer>
      </main>
      
      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
}

export default App;