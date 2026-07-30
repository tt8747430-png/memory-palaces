import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from '@/shared/ui/primitives'
import { HeaderBar } from './HeaderBar'

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
    <HeaderBar className={className}>
      {onBack ? (
        <IconButton variant="glass" aria-label={backLabel} onClick={onBack}>
          <ChevronLeft className="size-5" aria-hidden />
        </IconButton>
      ) : null}
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
