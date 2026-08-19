import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { clamp01, cn } from '@/shared/lib'
import { IconButton } from './primitives'

export interface SessionScreenProps {
  children: ReactNode
  className?: string
}

/**
 * The frame a run of something — a study pass, a quiz, a match — lives in: one app-width column
 * that fills the shell and never scrolls itself, so the panel inside owns the scrolling.
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
  /**
   * How far through the run the learner is. Given, it replaces the title block with a count pill
   * and draws a track under the bar — a session's own name matters less than how much is left.
   */
  progress?: { done: number; total: number }
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
  progress,
  action,
  children,
}: SessionHeaderProps) {
  const reduce = useReducedMotion()
  const fraction = progress && progress.total > 0 ? clamp01(progress.done / progress.total) : 0

  return (
    <div className="px-5 pt-safe">
      <div className="flex items-center justify-between gap-2 pt-3">
        <IconButton variant="glass" aria-label={backLabel} onClick={onBack}>
          {backIcon ?? <X className="size-5" aria-hidden />}
        </IconButton>
        {progress ? (
          <div className="flex min-w-0 flex-1 justify-center">
            <span className="rounded-pill bg-info-surface px-3 py-1 text-(length:--p-text-label) tabular-nums">
              <span className="font-semibold text-heading">{progress.done}</span>
              <span className="text-muted-foreground">{`/${progress.total}`}</span>
            </span>
          </div>
        ) : (
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-(length:--p-text-title) font-semibold text-heading">
              {title}
            </h1>
            {subtitle ? <p className="truncate text-(length:--p-text-label)">{subtitle}</p> : null}
          </div>
        )}
        {action ?? <div className="size-10 shrink-0" aria-hidden />}
      </div>
      {progress ? (
        <div className="mt-2 h-0.5 overflow-hidden rounded-pill bg-primary/10">
          <div
            data-testid="session-progress-fill"
            className="h-full rounded-pill bg-(--success-foreground)"
            style={{
              width: `${fraction * 100}%`,
              transition: reduce ? undefined : 'width 0.3s ease-out',
            }}
          />
        </div>
      ) : null}
      {children}
    </div>
  )
}
