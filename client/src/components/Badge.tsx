import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'navy';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    default:
      'bg-grey-100 dark:bg-[#1B3055] text-grey-500 dark:text-[#A8B8CC]',
    navy:
      'bg-navy text-white',
    success:
      'bg-green-50 dark:bg-green-900/20 text-success dark:text-[#10B981]',
    warning:
      'bg-amber-50 dark:bg-amber-900/20 text-warning dark:text-[#F59E0B]',
    danger:
      'bg-red-50 dark:bg-red-900/20 text-danger dark:text-[#EF4444]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
