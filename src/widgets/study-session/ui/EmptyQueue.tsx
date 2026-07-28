import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { Button, Empty } from '@/shared/ui'

export interface EmptyQueueProps {
  filtered: boolean
  onChangeSelection: () => void
  onStudyAll: () => void
  onDone: () => void
}

export function EmptyQueue({ filtered, onChangeSelection, onStudyAll, onDone }: EmptyQueueProps) {
  const { t } = useTranslation()
  return (
    <Empty
      variant="hero"
      className="px-1"
      icon={<Sparkles className="size-8 text-(--rating)" aria-hidden />}
      title={filtered ? t('study.nothingSelected') : t('study.allCaughtUp')}
      description={filtered ? t('study.nothingSelectedHint') : t('study.allCaughtUpHint')}
      action={
        filtered ? (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onChangeSelection}>
              {t('study.changeSelection')}
            </Button>
            <Button onClick={onStudyAll}>{t('study.studyAllCards')}</Button>
          </div>
        ) : (
          <Button onClick={onDone}>{t('study.done')}</Button>
        )
      }
    />
  )
}
