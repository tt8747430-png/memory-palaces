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
  className?: string
} & HeaderSubject &
  HeaderBackProps

/**
 * The one header frame in the app: the safe-area inset, what the bar is about, and the guard that
 * stops a control up here dropping an open keyboard. It paints nothing and renders no controls of
 * its own — the parts below fill it, and a screen composes the ones it needs.
 *
 * Bare, it is what a study session wants, where the card scene behind the bar already paints it
 * and a surface of the app's own would fight the scene's colour. `AppHeader` is the same frame
 * wearing the app's glass; `ScreenHeader`, `SelectHeader` and `StudySessionHeader` are the three
 * compositions worth naming. A screen that needs a fourth composes it from these parts rather than
 * hand-rolling a `<header>`: bespoke bars are how the heights drifted last time.
 *
 * `data-slot="header"` is a contract, not a debugging aid — `useKeyboardReveal` and the dev
 * viewport probe find the top of the reveal band with it. ADR 0002.
 */
export function Header({
  children,
  title,
  subtitle,
  progress,
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
    }),
    [title, subtitle, progress, onBack, backLabel],
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

/**
 * The row the controls sit in.
 *
 * `bar` is the app's own, and the reason §4a can promise a fixed height: every screen's chrome is
 * the same 64px, so a list does not jump when a selection swaps the contents. `study` is the row a
 * study session uses — deliberately not that height, because the count pill, the track and a chip
 * row stack inside the header rather than sitting beside each other in one line.
 */
const LAYOUT = {
  bar: 'relative flex h-16 shrink-0 items-center gap-1 px-2',
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
  /** The glyph. A chevron by default; pass a cross where back means "leave", not "up a level". */
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

/**
 * The name block on a leading-aligned bar. It closes the gap the back control leaves — reading
 * that from context rather than from a prop is what keeps the padding right for any composition,
 * including one that decides on a back control after this block is written.
 */
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

/**
 * How much of the study session is left. It stands in for the title, because a learner who started
 * a pass already knows what they are studying and does not know how much of it is left.
 */
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

/**
 * The fill is a `scaleX`, not a width: width is a layout property, and animating one on a bar that
 * moves with every graded card is the thrash CODE_STYLE §9 rules out. `origin-left` is what makes
 * the transform read as filling rather than growing out of the middle.
 */
export function HeaderTrack({ className }: HeaderSlotProps) {
  const { state } = useHeader()
  const reduce = useReducedMotion()
  return (
    <div className={cn('h-0.5 overflow-hidden rounded-full bg-primary/10', className)}>
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

/** The trailing cluster. */
export function HeaderActions({ children, className }: HeaderActionsProps) {
  return <div className={cn('flex shrink-0 items-center gap-1', className)}>{children}</div>
}

/** What keeps a centred title centred on a bar whose trailing side is empty. */
export function HeaderSpacer() {
  return <div className="size-10 shrink-0" aria-hidden />
}
