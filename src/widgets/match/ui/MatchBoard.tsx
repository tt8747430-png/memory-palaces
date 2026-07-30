import { useEffect, useReducer, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Check, Puzzle, RotateCcw, Timer, Zap } from 'lucide-react'
import { cn, EASE_EXPO, SCREEN_SCROLL, success } from '@/shared/lib'
import { Button, Chip, Empty, IconButton, SessionHeader, SessionScreen } from '@/shared/ui'
import {
  buildTiles,
  initMatch,
  type MatchCard,
  matchReducer,
  remainingPairs,
} from '@/features/match'

export interface MatchBoardProps {
  cards: MatchCard[]
  subtitle?: string
  onBack: () => void
  onComplete: () => void
}

const WRONG_MS = 640

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MatchBoard({ cards, subtitle, onBack, onComplete }: MatchBoardProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [state, dispatch] = useReducer(matchReducer, cards, (init) => initMatch(buildTiles(init)))
  const [elapsed, setElapsed] = useState(0)

  const won = state.status === 'won'
  const hasWrong = state.wrong.length > 0

  useEffect(() => {
    if (won) return
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(id)
  }, [won])

  useEffect(() => {
    if (!hasWrong) return
    const id = window.setTimeout(() => dispatch({ type: 'clearWrong' }), WRONG_MS)
    return () => window.clearTimeout(id)
  }, [hasWrong])

  useEffect(() => {
    if (won) success()
  }, [won])

  const restart = () => {
    dispatch({ type: 'reset', tiles: buildTiles(cards) })
    setElapsed(0)
  }

  if (cards.length < 2) {
    return (
      <Empty
        variant="hero"
        className="mx-auto h-full w-full max-w-app"
        icon={<Puzzle className="size-8" aria-hidden />}
        title={t('match.notEnough')}
        description={t('match.notEnoughHint')}
        action={<Button onClick={onBack}>{t('match.back')}</Button>}
      />
    )
  }

  const board = state.tiles.filter((tile) => !state.matched.includes(tile.id))

  return (
    <SessionScreen>
      <SessionHeader
        title={t('match.title')}
        subtitle={subtitle}
        backLabel={t('match.goBack')}
        onBack={onBack}
        action={
          <IconButton variant="glass" aria-label={t('match.restart')} onClick={restart}>
            <RotateCcw className="size-5" aria-hidden />
          </IconButton>
        }
      >
        <div className="mt-4 flex items-center justify-center gap-2">
          <Chip icon={<Timer className="size-3.5" aria-hidden />}>{formatTime(elapsed)}</Chip>
          <Chip icon={<Zap className="size-3.5" aria-hidden />}>
            {t('match.moves', { count: state.moves })}
          </Chip>
          <Chip>{t('match.pairsLeft', { count: remainingPairs(state) })}</Chip>
        </div>
      </SessionHeader>

      <p className="px-5 pb-2 pt-3 text-center text-(length:--p-text-label) font-medium text-muted-foreground">
        {t('match.instruction')}
      </p>

      <div className={cn(SCREEN_SCROLL, 'min-h-0 flex-1 px-5 pb-6')}>
        <div className="grid auto-rows-fr grid-cols-2 gap-2.5">
          <AnimatePresence mode="popLayout">
            {board.map((tile) => {
              const isSelected = state.selected.includes(tile.id)
              const isWrong = state.wrong.includes(tile.id)
              return (
                <motion.button
                  key={tile.id}
                  type="button"
                  layout={!reduce}
                  initial={false}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2, ease: EASE_EXPO }}
                  animate={isWrong && !reduce ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
                  onClick={() => dispatch({ type: 'pick', tileId: tile.id })}
                  className={cn(
                    'flex min-h-23 items-center rounded-card border p-3 text-left transition-colors',
                    isWrong
                      ? 'border-destructive bg-(--danger-surface)'
                      : isSelected
                        ? 'border-primary bg-info-surface ring-2 ring-[color-mix(in_oklch,var(--primary)_20%,transparent)]'
                        : 'border-border bg-card shadow-rest',
                  )}
                >
                  <span
                    className={cn(
                      'wrap-break-word text-(length:--p-text-sub) leading-snug',
                      tile.kind === 'term'
                        ? 'font-semibold text-heading'
                        : 'font-medium text-muted-foreground',
                    )}
                  >
                    {tile.text}
                  </span>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {won ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-card-glass px-8 text-center"
          >
            <motion.div
              initial={reduce ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className="mb-3 grid size-20 place-items-center rounded-full bg-linear-to-br from-primary to-accent shadow-interactive"
            >
              <Check className="size-10 text-primary-foreground" strokeWidth={3} aria-hidden />
            </motion.div>
            <h2 className="text-(length:--p-text-headline) font-bold text-heading">
              {t('match.complete')}
            </h2>
            <p className="text-(length:--p-text-body) text-muted-foreground">
              {formatTime(elapsed)} · {t('match.summary', { moves: state.moves })}
            </p>
            <div className="mt-5 flex w-full max-w-xs flex-col gap-3">
              <Button size="lg" className="w-full" onClick={restart}>
                <RotateCcw className="size-5" aria-hidden />
                {t('match.playAgain')}
              </Button>
              <Button variant="secondary" size="lg" className="w-full" onClick={onComplete}>
                {t('match.done')}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </SessionScreen>
  )
}
