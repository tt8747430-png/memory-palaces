import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Undo2 } from 'lucide-react'
import { IconButton } from '@/shared/ui'

export interface ReviewPromptProps {
  onReveal: () => void
  onUndo: () => void
  canUndo: boolean
  /** What is left to do, at the leading edge — remaining counts, or a Fast review's two tallies. */
  counts: ReactNode
}

/**
 * The row before the answer is shown: what is left to do, a pill that shows the answer, and Undo at
 * the trailing edge, enabled only when there is something to take back.
 *
 * "Tap to show answer" is a real button, not a caption. Tapping the card does the same thing, and
 * `data-flip` tells the swipe layer this control is one of the card's own — so a fling that starts
 * on it still throws the card instead of being swallowed.
 */
export function ReviewPrompt({ onReveal, onUndo, canUndo, counts }: ReviewPromptProps) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full items-center gap-2">
      <div className="shrink-0">{counts}</div>
      <button
        type="button"
        data-flip
        onClick={onReveal}
        className="h-11 min-w-0 flex-1 rounded-full bg-card-glass px-4 text-label font-semibold text-heading shadow-rest transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        {t('study.tapToReveal')}
      </button>
      <IconButton
        variant="glass"
        aria-label={t('study.undoLast')}
        disabled={!canUndo}
        onClick={onUndo}
        className="shrink-0 rounded-full disabled:opacity-40"
      >
        <Undo2 className="size-5" aria-hidden />
      </IconButton>
    </div>
  )
}
