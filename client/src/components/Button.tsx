import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-navy text-white hover:bg-navy-hover dark:bg-[#4A7FBF] dark:hover:bg-[#5A90D0]',
    secondary:
      'bg-white dark:bg-transparent border border-grey-200 dark:border-[#243D6A] text-grey-900 dark:text-[#F0F4FA] hover:bg-grey-50 dark:hover:bg-[#1B3055]',
    danger:
      'bg-danger text-white hover:bg-red-700 dark:bg-[#EF4444] dark:hover:bg-red-500',
    ghost:
      'bg-transparent text-navy dark:text-[#4A7FBF] hover:bg-grey-50 dark:hover:bg-[#1B3055]',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
