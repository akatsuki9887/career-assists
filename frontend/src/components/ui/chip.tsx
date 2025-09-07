import { HTMLAttributes } from 'react';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'warning';
}

export function Chip({ children, className, variant = 'default', ...props }: ChipProps) {
  const variantStyles = variant === 'warning' ? 'bg-accent-warning/20 text-accent-warning' : 'bg-primary/20 text-primary';
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}