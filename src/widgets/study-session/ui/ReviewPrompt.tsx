import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Undo2 } from 'lucide-react'
import { IconButton } from '@/shared/ui'

export interface ReviewPromptProps {
  onReveal: () => void
  onUndo: () => void
  canUndo: boolean
  /** What is left to do, in the trailing slot — remaining counts, or a Fast review's two tallies. */
  trailing: ReactNode
}

/**
 * The row before the answer is shown: undo, a button that shows it, and what is left to do.
 *
 * "Tap to show answer" is a real button, not a caption. Tapping the card does the same thing, and
 * `data-flip` tells the swipe layer this control is one of the card's own — so a fling that starts
 * on it still throws the card instead of being swallowed.
 */
export function ReviewPrompt({ onReveal, onUndo, canUndo, trailing }: ReviewPromptProps) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full items-center gap-2">
      <IconButton
        variant="glass"
        aria-label={t('study.undoLast')}
        disabled={!canUndo}
        onClick={onUndo}
        className="shrink-0 disabled:opacity-40"
      >
        <Undo2 className="size-5" aria-hidden />
      </IconButton>
      <button
        type="button"
        data-flip
        onClick={onReveal}
        className="h-11 min-w-0 flex-1 rounded-control bg-card-glass px-4 text-label font-semibold text-heading shadow-rest transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        {t('study.tapToReveal')}
      </button>
      <div className="shrink-0">{trailing}</div>
    </div>
  )
}
