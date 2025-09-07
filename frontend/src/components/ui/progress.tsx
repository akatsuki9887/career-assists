"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { classNameIndicator?: string }
>(({ className, value, classNameIndicator, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "h-full flex-1 bg-primary transition-all",
        classNameIndicator
      )}
      role="progressbar"
      aria-valuenow={value ?? undefined} 
      aria-valuemin={0}
      aria-valuemax={100}
    />

  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }