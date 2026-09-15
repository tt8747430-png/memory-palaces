import { useTranslation } from 'react-i18next'
import { ActionSheet, type ActionHandlers, buildMenuActions } from '@/shared/ui'
import { CARD_ACTIONS } from '@/shared/config/actions'

export interface CardActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  handlers: ActionHandlers
}

/** The card menu: every card action, in one order, built from the catalog. */
export function CardActionsSheet({ open, onOpenChange, handlers }: CardActionsSheetProps) {
  const { t } = useTranslation()
  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      hideTitle
      variant="filled"
      title={t('cardActions.title')}
      actions={buildMenuActions(CARD_ACTIONS, handlers, t)}
    />
  )
}
