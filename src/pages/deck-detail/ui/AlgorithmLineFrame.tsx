import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'

export type AlgorithmLineFrameProps = Omit<ComponentProps<'button'>, 'className'>

/**
 * The sentence `AlgorithmLine` and `LockedAlgorithmLine` both say — "Learning algorithm:" and the
 * algorithm's name as a button. What pressing the name does is theirs: every prop lands on it.
 */
export function AlgorithmLineFrame({ children, ...button }: AlgorithmLineFrameProps) {
  const { t } = useTranslation()
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-label text-muted-foreground">
      <span>{t('algorithm.deckLine')}</span>
      <button
        type="button"
        {...button}
        className="inline-flex items-center gap-1 rounded-control font-semibold text-accent underline-offset-2 transition-opacity hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:opacity-70"
      >
        {children}
      </button>
    </p>
  )
}
