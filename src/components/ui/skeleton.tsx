import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Professional skeleton components for immediate page display
function HeroSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="container mx-auto px-4 text-center">
        <Skeleton className="h-16 w-96 mx-auto mb-6 bg-gray-100 dark:bg-white/10" />
        <Skeleton className="h-6 w-80 mx-auto mb-8 bg-gray-50 dark:bg-white/5" />
        <div className="flex gap-4 justify-center">
          <Skeleton className="h-12 w-32 bg-gray-100 dark:bg-white/10" />
          <Skeleton className="h-12 w-32 bg-gray-50 dark:bg-white/5" />
        </div>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6 bg-gray-100 dark:bg-white/10" />
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full bg-gray-50 dark:bg-white/5" />
          <Skeleton className="h-32 w-full bg-gray-50 dark:bg-white/5" />
          <Skeleton className="h-32 w-full bg-gray-50 dark:bg-white/5" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton, HeroSkeleton, PageSkeleton }
