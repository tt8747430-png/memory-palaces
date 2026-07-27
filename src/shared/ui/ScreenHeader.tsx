import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from './primitives/icon-button'
import { HeaderBar } from './HeaderBar'

export interface ScreenHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  onBack?: () => void
  backLabel?: string
  /** Trailing control(s). An `IconButton variant="glass"` to match the back chevron. */
  action?: ReactNode
  className?: string
}

/**
 * The header every screen wears: back on the left, the screen's name (and where it lives) in the
 * middle, its one action on the right — inside the shared `HeaderBar`, so the bar is the same
 * height and its controls are the same size on every screen.
 *
 * A screen with a selection swaps this for `SelectHeader`; the home and profile screens swap it
 * for their own bar. Nothing else builds a header of its own.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  action,
  className,
}: ScreenHeaderProps) {
  return (
    <HeaderBar className={className}>
      {onBack ? (
        <IconButton variant="glass" aria-label={backLabel} onClick={onBack}>
          <ChevronLeft className="size-5" aria-hidden />
        </IconButton>
      ) : null}
      {/* Without a back chevron the title has to find the content's left margin on its own. */}
      <div className={onBack ? 'min-w-0 flex-1 pl-1' : 'min-w-0 flex-1 pl-3'}>
        <h1 className="truncate">{title}</h1>
        {subtitle ? (
          <p className="truncate text-[length:var(--p-text-label)] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </HeaderBar>
  )
}
