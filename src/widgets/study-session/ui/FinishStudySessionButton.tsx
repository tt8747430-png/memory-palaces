import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { FlagTriangleRight } from 'lucide-react'
import { Button } from '@/shared/ui'

export function FinishStudySessionButton({ onFinish }: { onFinish: () => void }) {
  const { t } = useTranslation()
  const hintId = useId()
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      <Button
        className="w-full bg-(--danger) text-(--danger-foreground)"
        aria-describedby={hintId}
        onClick={onFinish}
      >
        <FlagTriangleRight className="size-4.5" aria-hidden />
        {t('study.finishStudySession')}
      </Button>
      <p id={hintId} className="px-1 text-center text-label leading-snug text-muted-foreground">
        {t('study.finishStudySessionHint')}
      </p>
    </div>
  )
}
