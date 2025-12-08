'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'outline' | 'premium' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, pulse = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-secondary-100 text-secondary-700 border border-secondary-200/50',
      primary: 'bg-primary-50 text-primary-700 border border-primary-200/50',
      success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
      warning: 'bg-amber-50 text-amber-700 border border-amber-200/50',
      danger: 'bg-red-50 text-red-700 border border-red-200/50',
      info: 'bg-blue-50 text-blue-700 border border-blue-200/50',
      secondary: 'bg-gray-100 text-gray-700 border border-gray-200/50',
      outline: 'border-2 border-secondary-200 text-secondary-700 bg-white/80',
      premium: 'bg-gradient-to-r from-primary-50 to-violet-50 text-primary-700 border border-primary-200/50 shadow-sm',
      gradient: 'gradient-primary text-white border-0 shadow-md',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    const dotColors = {
      default: 'bg-secondary-500',
      primary: 'bg-primary-500',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
      info: 'bg-blue-500',
      secondary: 'bg-gray-500',
      outline: 'bg-secondary-500',
      premium: 'bg-primary-500',
      gradient: 'bg-white',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-200',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              dotColors[variant],
              pulse && 'animate-pulse'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
