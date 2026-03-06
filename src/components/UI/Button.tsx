
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'accent' | 'success' | 'error' | 'outline';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'accent',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 px-4 py-2 text-base shadow-sm';
  const variants: Record<string, string> = {
    accent:
      'bg-[color:var(--color-accent)] text-white hover:bg-[#5B21B6] disabled:bg-[color:var(--color-accent)]/60',
    success:
      'bg-success text-white hover:bg-success-dark disabled:bg-success/60',
    error:
      'bg-error text-white hover:bg-error-dark disabled:bg-error/60',
    outline:
      'bg-white text-[color:var(--color-accent)] border-2 border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-white disabled:bg-white disabled:text-[color:var(--color-accent)]/60',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
};
