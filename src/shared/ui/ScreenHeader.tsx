import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/shared/lib'
import { IconButton } from './IconButton'

export interface ScreenHeaderProps {
  title: ReactNode
  /** Optional short line under the title. */
  subtitle?: ReactNode
  /** Renders a frosted back control when provided. */
  onBack?: () => void
  backLabel?: string
  /** Optional trailing control (e.g. an action button). */
  action?: ReactNode
  className?: string
}

/** Frosted top bar for sub-screens (no collapsible hero): safe-area aware, fixed to the
 * viewport so it stays put even while the content rubber-bands on overscroll. The blur
 * lets content scroll under it; an inert, invisible copy reserves its height in flow. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  action,
  className,
}: ScreenHeaderProps) {
  const bar = (
    <div className="flex min-h-14 items-center gap-3 pt-3 pb-2">
      {onBack ? (
        <IconButton variant="glass" aria-label={backLabel} onClick={onBack}>
          <ChevronLeft className="size-5" aria-hidden />
        </IconButton>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-balance">{title}</h1>
        {subtitle ? (
          <p className="truncate text-[length:var(--p-text-label)]">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  )

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[200] mx-auto max-w-[430px] bg-glass px-5 pt-safe',
          className,
        )}
      >
        {bar}
      </header>
      {/* Reserve the bar's exact height in flow so content starts below it. `inert` keeps
          this duplicate out of the focus/accessibility tree; the page's own `pt-safe`
          covers the safe-area inset above. */}
      <div aria-hidden inert className="invisible">
        {bar}
      </div>
    </>
  )
}
