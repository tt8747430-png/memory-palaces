import { useTranslation } from 'react-i18next'
import { Empty, Sheet } from '@/shared/ui'

export interface LearningHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * There is no review log yet, so this sheet says so plainly rather than inventing one. It exists
 * because the action does — see docs/DECK_SETTINGS_UI_STATUS.md.
 */
export function LearningHistorySheet({ open, onOpenChange }: LearningHistorySheetProps) {
  const { t } = useTranslation()
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('cardActions.historyTitle')}>
      <Empty
        emoji="🕓"
        title={t('cardActions.historyEmpty')}
        description={t('cardActions.historyEmptyBody')}
      />
    </Sheet>
  )
}
