import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { NoticeDialog } from '@/shared/ui'

export interface AlgorithmLockedNoticeProps {
  /** The subdeck's algorithm control; pressing it opens the notice. */
  trigger: ReactElement
}

/**
 * What a subdeck answers when the learner reaches for its algorithm: a subdeck's cards are studied
 * in its main deck's study sessions, so the main deck owns every setting on the algorithm screen
 * (`MAIN_DECK_SETTINGS`). The deck-detail line and the deck-settings row both open this.
 */
export function AlgorithmLockedNotice({ trigger }: AlgorithmLockedNoticeProps) {
  const { t } = useTranslation()
  return (
    <NoticeDialog
      trigger={trigger}
      title={t('algorithm.locked.title')}
      description={t('algorithm.locked.body')}
      acknowledgeLabel={t('common.gotIt')}
    />
  )
}
