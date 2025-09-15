// src/components/ui/skeleton.tsx
import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-primary/10 bg-gradient-to-r from-primary/10 to-primary/5 hover:scale-105 transition-transform duration-150', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };