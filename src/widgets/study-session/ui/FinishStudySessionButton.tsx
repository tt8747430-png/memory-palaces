import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { FlagTriangleRight } from 'lucide-react'
import { Button } from '@/shared/ui'

/**
 * The one control in the study session's settings that acts instead of setting something, so it is
 * a button among rows — and a filled danger one: stopping a study session early is the exit, not
 * the reward. The line under it says what that costs, since "finish" reads as "complete" until you
 * know the rest of the queue is dropped.
 */
export function FinishStudySessionButton({ onFinish }: { onFinish: () => void }) {
  const { t } = useTranslation()
  const hintId = useId()
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      {/* `--danger` filled, not the tinted `destructive` variant: a tint would carry no more weight
          than the settings rows stacked above it, which is what this needs to outrank. */}
      <Button
        className="w-full bg-(--danger) text-(--danger-foreground)"
        aria-describedby={hintId}
        onClick={onFinish}
      >
        {/* The finish flag, not the quick actions' `Flag` — that one means "flag this card". */}
        <FlagTriangleRight className="size-4.5" aria-hidden />
        {t('study.finishStudySession')}
      </Button>
      <p
        id={hintId}
        className="px-1 text-center text-(length:--p-text-label) leading-snug text-muted-foreground"
      >
        {t('study.finishStudySessionHint')}
      </p>
    </div>
  )
}
