/** Placeholder rows while the folder and deck stores make their first emission. */
export function LibrarySkeleton() {
  return (
    <div className="space-y-1 pt-2" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border py-3.5">
          <span className="size-11 shrink-0 animate-pulse rounded-card bg-secondary/50" />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="h-3.5 w-1/2 animate-pulse rounded-full bg-secondary/50" />
            <span className="h-3 w-1/3 animate-pulse rounded-full bg-secondary/40" />
          </span>
        </div>
      ))}
    </div>
  )
}
