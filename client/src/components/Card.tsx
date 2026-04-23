import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-grey-200 dark:border-gray-700 shadow-sm p-4 ${onClick ? 'cursor-pointer hover:border-navy dark:hover:border-blue-500 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
