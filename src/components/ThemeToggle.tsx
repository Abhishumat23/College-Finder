import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-theme-secondary border border-theme-primary flex items-center justify-center">
        <div className="w-5 h-5 rounded-full bg-theme-tertiary animate-pulse" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-lg bg-theme-secondary border border-theme-primary flex items-center justify-center hover:bg-theme-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-theme-primary"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-theme-primary" />
      ) : (
        <Sun className="w-5 h-5 text-theme-primary" />
      )}
    </button>
  );
};

export default ThemeToggle; 