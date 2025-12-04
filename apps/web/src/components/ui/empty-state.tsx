'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-secondary-900 mb-1">{title}</h3>
      {description && (
        <p className="text-secondary-500 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
