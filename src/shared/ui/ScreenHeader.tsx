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

/** Frosted top bar: safe-area aware, sticky over the daylight ground, with an
 * optional back control and trailing action. The blur lets content scroll under it. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  action,
  className,
}: ScreenHeaderProps) {
  return (
    <header className={cn('sticky top-0 z-[200] -mx-5 bg-glass px-5 pt-safe', className)}>
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
    </header>
  )
}
