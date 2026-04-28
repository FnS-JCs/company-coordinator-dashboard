import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] p-4 transition-all duration-150 ${
        onClick
          ? 'cursor-pointer hover:shadow-sm hover:border-grey-400 dark:hover:border-[#4A7FBF]'
          : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
