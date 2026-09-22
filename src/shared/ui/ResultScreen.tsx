import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { EASE_OUT } from '@/shared/lib'
import { Button } from './primitives/button'
import { StatTile } from './StatTile'

export interface ResultStat {
  id: string
  icon: ReactNode
  value: string
  label: string
}

export interface ResultAction {
  label: string
  onClick: () => void
  icon?: ReactNode
}

export interface ResultScreenProps {
  icon: ReactNode
  title: string
  /** One line under the title: what was reached, or what to do next. */
  message?: ReactNode
  stats?: readonly ResultStat[]
  /** The one thing to press. */
  action: ResultAction
  /** Anything else — drawn beside it as text, so there is never a question which one is next. */
  secondaryAction?: ResultAction
}

const STAGGER = 0.06

function riseIn(at: number, reduce: boolean) {
  return {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay: reduce ? 0 : at * STAGGER,
      duration: reduce ? 0.15 : 0.35,
      ease: EASE_OUT,
    },
  }
}

/**
 * The screen a finished study session ends on. Full-bleed and painted in the app's own chrome, so it
 * reaches the top of the app and the status bar matches it with nothing repainted — the bar is
 * already that colour (`theme.css`).
 *
 * It replaced an overlay that sat inside the study session's screen, which left the header of a
 * study session still under way above the result of one that had ended, and said its numbers in
 * prose.
 */
export function ResultScreen({
  icon,
  title,
  message,
  stats,
  action,
  secondaryAction,
}: ResultScreenProps) {
  const reduce = useReducedMotion()
  const rise = (at: number) => riseIn(at, reduce === true)

  return (
    <motion.div
      data-slot="result-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.15 : 0.25, ease: EASE_OUT }}
      className="chrome fixed inset-0 z-(--z-dialog) flex flex-col overflow-y-auto overscroll-contain"
    >
      <div className="mx-auto flex w-full max-w-app flex-1 flex-col px-6 pt-safe">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
          <motion.div
            {...(reduce
              ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
              : { initial: { scale: 0.7, opacity: 0 }, animate: { scale: 1, opacity: 1 } })}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="mb-2 grid size-24 place-items-center rounded-full bg-info-surface text-heading"
          >
            {icon}
          </motion.div>

          <motion.h2 {...rise(1)} className="text-headline font-bold text-heading">
            {title}
          </motion.h2>

          {message ? (
            <motion.p {...rise(2)} className="text-body text-muted-foreground">
              {message}
            </motion.p>
          ) : null}

          {stats && stats.length > 0 ? (
            <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
              {stats.map((stat, at) => (
                <StatTile
                  key={stat.id}
                  tone="chrome"
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                  delay={(3 + at) * STAGGER}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* The one thing to press, where a thumb already is, clear of the home indicator. */}
        <motion.div
          {...rise(6)}
          className="flex shrink-0 items-center gap-2 pb-(--app-bottom-inset) pt-2"
        >
          {secondaryAction ? (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={
                'inline-flex min-h-12 shrink-0 items-center gap-2 rounded-control px-4 text-body font-semibold text-heading ' +
                'transition-[transform,opacity] hover:opacity-80 active:scale-[0.97] ' +
                'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40 ' +
                '[&_svg]:size-4.5'
              }
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </button>
          ) : null}
          <Button size="lg" className="flex-1" onClick={action.onClick}>
            {action.icon}
            {action.label}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
