import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'

export type AlgorithmLineFrameProps = Omit<ComponentProps<'button'>, 'className'>

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
