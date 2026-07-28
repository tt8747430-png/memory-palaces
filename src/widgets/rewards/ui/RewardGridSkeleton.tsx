import { Skeleton } from '@/shared/ui'

/** Placeholder for a medallion grid while progress, decks and cards load. */
export function RewardGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-7">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-2.5 w-12" tone="quiet" />
        </div>
      ))}
    </div>
  )
}
