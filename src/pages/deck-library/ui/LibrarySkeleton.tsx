import { Skeleton } from '@/shared/ui'

export function LibrarySkeleton() {
  return (
    <div className="space-y-1 pt-2" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border py-3.5">
          <Skeleton className="size-11 shrink-0 rounded-card bg-secondary/50" />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-1/2 bg-secondary/50" />
            <Skeleton className="h-3 w-1/3 bg-secondary/40" />
          </span>
        </div>
      ))}
    </div>
  )
}
