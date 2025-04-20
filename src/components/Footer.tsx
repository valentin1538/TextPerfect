import React from 'react';
import { Github, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} TextPerfect. Un outil pour les écrivains.
        </p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <a 
            href="#" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            À propos
          </a>
          <a 
            href="#" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Confidentialité
          </a>
          <a 
            href="#" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Conditions
          </a>
          <a 
            href="#" 
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <span>Fait avec</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;