'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'premium';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, variant = 'default', ...props }, ref) => {
    const inputId = id || props.name;
    const [isFocused, setIsFocused] = useState(false);

    const variants = {
      default: cn(
        'border-secondary-200 bg-white',
        'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
        error && 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
      ),
      filled: cn(
        'border-transparent bg-secondary-100',
        'focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
        error && 'bg-red-50 focus:border-red-500 focus:ring-red-500/10'
      ),
      premium: cn(
        'border-secondary-200/50 bg-white/80 backdrop-blur-sm',
        'focus:border-primary-400 focus:ring-4 focus:ring-primary-500/20 focus:bg-white',
        'shadow-sm hover:shadow-md',
        error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
      ),
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2 transition-colors duration-200',
              isFocused ? 'text-primary-600' : 'text-secondary-700',
              error && 'text-red-600'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className={cn(
              'absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200',
              isFocused ? 'text-primary-500' : 'text-secondary-400',
              error && 'text-red-400'
            )}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border-2 px-4 py-3',
              'text-secondary-900 placeholder:text-secondary-400',
              'transition-all duration-300 ease-out',
              'disabled:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-60',
              variants[variant],
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && (
            <div className={cn(
              'absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200',
              isFocused ? 'text-primary-500' : 'text-secondary-400'
            )}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 animate-fade-in-up">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-secondary-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
