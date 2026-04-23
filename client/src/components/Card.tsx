import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-grey-200 shadow-sm p-4 ${onClick ? 'cursor-pointer hover:border-navy transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
