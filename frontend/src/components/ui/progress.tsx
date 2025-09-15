'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { classNameIndicator?: string }
>(({ className, value, classNameIndicator, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-3 sm:h-4 w-full overflow-hidden rounded-xl bg-primary/20 hover:shadow-md transition-shadow duration-150',
      className
    )}
    {...props}
  >
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 2, ease: "linear" }} // 5 sec me fill hoga
      className={cn("h-full flex-1 bg-[#3f9672]", classNameIndicator)}

      role="progressbar"
      aria-valuenow={value ?? undefined}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };