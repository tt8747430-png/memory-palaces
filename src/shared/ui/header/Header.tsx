import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { clamp01, cn, keepFieldFocused } from '@/shared/lib'
import { IconButton } from '@/shared/ui/primitives'
import {
  type HeaderBackProps,
  HeaderContext,
  type HeaderContextValue,
  type HeaderSubject,
  useHeader,
} from './header-context'

export type HeaderProps = {
  children: ReactNode
  /** Hands the bar to a field for as long as it is passed. See `HeaderChrome`. */
  search?: ReactNode
  className?: string
} & HeaderSubject &
  HeaderBackProps

export function Header({
  children,
  title,
  subtitle,
  progress,
  search,
  className,
  onBack,
  backLabel,
}: HeaderProps) {
  const value = useMemo<HeaderContextValue>(
    () => ({
      state: {
        title,
        subtitle,
        progress,
        fraction: progress && progress.total > 0 ? clamp01(progress.done / progress.total) : 0,
      },
      actions: {
        back: onBack && backLabel !== undefined ? { go: onBack, label: backLabel } : undefined,
      },
      search,
    }),
    [title, subtitle, progress, search, onBack, backLabel],
  )

  return (
    <HeaderContext value={value}>
      <header
        data-slot="header"
        onMouseDown={keepFieldFocused}
        className={cn('pt-safe', className)}
      >
        {children}
      </header>
    </HeaderContext>
  )
}

/** The bar's own row rhythm, shared with any part that lays a row inside it. */
export const HEADER_ROW = 'flex items-center gap-1'

const LAYOUT = {
  bar: cn('relative h-16 shrink-0 px-2', HEADER_ROW),
  study: 'relative flex shrink-0 items-center justify-between gap-2 pt-3',
} as const

export type HeaderLayout = keyof typeof LAYOUT

export interface HeaderBarProps {
  children: ReactNode
  layout?: HeaderLayout
  className?: string
}

export function HeaderBar({ children, layout = 'bar', className }: HeaderBarProps) {
  return <div className={cn(LAYOUT[layout], className)}>{children}</div>
}

export interface HeaderBackButtonProps {
  children?: ReactNode
  className?: string
}

export function HeaderBack({ children, className }: HeaderBackButtonProps) {
  const { actions } = useHeader()
  if (!actions.back) return null
  return (
    <IconButton
      variant="glass"
      aria-label={actions.back.label}
      onClick={actions.back.go}
      className={className}
    >
      {children ?? <ChevronLeft className="size-5" aria-hidden />}
    </IconButton>
  )
}

export interface HeaderSlotProps {
  className?: string
}

export interface HeaderHeadingProps {
  children: ReactNode
  className?: string
}

export function HeaderHeading({ children, className }: HeaderHeadingProps) {
  const { actions } = useHeader()
  return (
    <div className={cn('min-w-0 flex-1', actions.back ? 'pl-1' : 'pl-3', className)}>
      {children}
    </div>
  )
}

export function HeaderTitle({ className }: HeaderSlotProps) {
  const { state } = useHeader()
  return <h1 className={cn('truncate', className)}>{state.title}</h1>
}

export function HeaderSubtitle({ className }: HeaderSlotProps) {
  const { state } = useHeader()
  return state.subtitle ? (
    <p className={cn('truncate text-label', className)}>{state.subtitle}</p>
  ) : null
}

export function HeaderCount({ className }: HeaderSlotProps) {
  const { state } = useHeader()
  if (!state.progress) return null
  return (
    <span
      className={cn('rounded-full bg-info-surface px-3 py-1 text-label tabular-nums', className)}
    >
      <span className="font-semibold text-heading">{state.progress.done}</span>
      <span className="text-muted-foreground">{`/${state.progress.total}`}</span>
    </span>
  )
}

export function HeaderTrack({ className }: HeaderSlotProps) {
  const { state } = useHeader()
  const reduce = useReducedMotion()
  return (
    <div className={cn('h-0.5 overflow-hidden rounded-full bg-info-surface', className)}>
      <div
        data-testid="header-progress-fill"
        className="h-full w-full origin-left rounded-full bg-(--success-foreground)"
        style={{
          transform: `scaleX(${state.fraction})`,
          transition: reduce ? undefined : 'transform 0.3s ease-out',
        }}
      />
    </div>
  )
}

export interface HeaderActionsProps {
  children: ReactNode
  className?: string
}

export function HeaderActions({ children, className }: HeaderActionsProps) {
  return <div className={cn('flex shrink-0 items-center gap-1', className)}>{children}</div>
}

export function HeaderSpacer() {
  return <div className="size-10 shrink-0" aria-hidden />
}
