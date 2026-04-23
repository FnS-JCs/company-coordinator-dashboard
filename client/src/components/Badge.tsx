import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => {
  const variants = {
    default: 'bg-grey-200 dark:bg-gray-700 text-grey-900 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400',
    danger: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};
