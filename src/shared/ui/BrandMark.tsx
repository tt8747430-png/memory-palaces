import { cn } from '@/shared/lib'

/** The Mindscape mark: a navy tile holding a single white locus (matches favicon.svg).
 * Size via `className` (e.g. `size-16`). Decorative — pair with a visible app name. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-12 place-items-center rounded-[28%] bg-primary shadow-interactive',
        className,
      )}
    >
      <span className="block aspect-square w-[42%] rounded-full bg-white" />
    </span>
  )
}
