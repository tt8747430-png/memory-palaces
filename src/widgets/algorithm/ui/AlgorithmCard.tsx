import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { LearningAlgorithm } from '@/entities/deck'
import { ALGORITHM_META } from './algorithm-meta'

export interface AlgorithmCardProps {
  algorithm: LearningAlgorithm
  onClick?: () => void
}

/**
 * The deck's algorithm, as a row you can press to change it. Deck settings and the algorithm screen
 * both lead with it, wearing exactly the skin `SettingsSection` gives every other card on those
 * pages — `bg-card` over `shadow-rest`, no border. The old tinted `bg-info-surface` fill sat a
 * shade off the page gradient with no shadow to lift it, which is what read as background rather
 * than as a control.
 */
export function AlgorithmCard({ algorithm, onClick }: AlgorithmCardProps) {
  const { t } = useTranslation()
  const meta = ALGORITHM_META[algorithm]
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3.5 rounded-card bg-card p-4 text-left shadow-rest transition-[transform,background-color] hover:bg-info-surface active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-card bg-info-surface">
        {meta.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-(length:--p-text-title) font-bold tracking-tight text-heading">
          {t(meta.nameKey as never)}
        </span>
        <span className="mt-0.5 block text-(length:--p-text-label) text-muted-foreground">
          {t('deckSettings.algorithmRow')}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}
