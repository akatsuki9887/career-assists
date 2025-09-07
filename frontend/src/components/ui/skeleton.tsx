import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10 bg-gradient-to-r from-primary/10 to-primary/5", className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }