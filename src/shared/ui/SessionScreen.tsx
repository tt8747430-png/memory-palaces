import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib'
import { IconButton } from './primitives'

export interface SessionScreenProps {
  children: ReactNode
  className?: string
}

/**
 * The frame a run of something — a study pass, a quiz, a match — lives in: one
 * app-width column that fills the shell and never scrolls itself, so the panel
 * inside owns the scrolling.
 */
export function SessionScreen({ children, className }: SessionScreenProps) {
  return (
    <div
      className={cn(
        'relative mx-auto flex h-full w-full max-w-app flex-col overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}

export interface SessionHeaderProps {
  title: string
  subtitle?: string
  backLabel: string
  onBack: () => void
  /** Defaults to a close cross; pass a chevron where back means "up a level". */
  backIcon?: ReactNode
  /** Trailing control(s). A spacer keeps the title centred when there are none. */
  action?: ReactNode
  /** A progress bar, a chip row — whatever sits under the bar, inside its gutter. */
  children?: ReactNode
}

export function SessionHeader({
  title,
  subtitle,
  backLabel,
  onBack,
  backIcon,
  action,
  children,
}: SessionHeaderProps) {
  return (
    <div className="px-5 pt-safe">
      <div className="flex items-center justify-between gap-2 pt-3">
        <IconButton variant="glass" aria-label={backLabel} onClick={onBack}>
          {backIcon ?? <X className="size-5" aria-hidden />}
        </IconButton>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-(length:--p-text-title) font-semibold text-heading">
            {title}
          </h1>
          {subtitle ? <p className="truncate text-(length:--p-text-label)">{subtitle}</p> : null}
        </div>
        {action ?? <div className="size-10 shrink-0" aria-hidden />}
      </div>
      {children}
    </div>
  )
}
