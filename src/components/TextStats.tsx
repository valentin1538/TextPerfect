import React from 'react';

interface TextStatsProps {
  stats: {
    characters: number;
    words: number;
    sentences: number;
  };
}

const TextStats: React.FC<TextStatsProps> = ({ stats }) => {
  return (
    <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-1">
        <span className="font-semibold">{stats.characters}</span>
        <span>caractères</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold">{stats.words}</span>
        <span>mots</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold">{stats.sentences}</span>
        <span>phrases</span>
      </div>
    </div>
  );
};

export default TextStats;