import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/shared/lib'
import { IconButton } from './IconButton'

export interface ScreenHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  onBack?: () => void
  backLabel?: string
  action?: ReactNode
  className?: string
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  action,
  className,
}: ScreenHeaderProps) {
  return (
    <header className={cn('shrink-0 bg-glass px-5 pt-safe', className)}>
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
