import { useTranslation } from 'react-i18next'
import { Sheet } from '@/shared/ui'
import { QuickActionRows, type QuickActionsModel } from './QuickActionRows'

export interface QuickActionsSheetProps extends QuickActionsModel {
  open: boolean
  onClose: () => void
}

/** Press-and-hold quick actions for the active card — the fast path (the merged gear sheet
 * carries the same actions for discoverability). Each choice dismisses the sheet. */
export function QuickActionsSheet({ open, onClose, ...model }: QuickActionsSheetProps) {
  const { t } = useTranslation()
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()} title={t('study.quickActions')}>
      <div className="pb-2">
        <QuickActionRows model={model} after={onClose} />
      </div>
    </Sheet>
  )
}
