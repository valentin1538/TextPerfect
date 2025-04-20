import React from 'react';
import { Lightbulb, Moon, AlignCenter } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="py-4 px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlignCenter className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl md:text-2xl font-serif font-bold text-gray-800 dark:text-white">
            TextPerfect
          </h1>
        </div>
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-gray-600" />
          ) : (
            <Lightbulb className="h-5 w-5 text-yellow-400" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;