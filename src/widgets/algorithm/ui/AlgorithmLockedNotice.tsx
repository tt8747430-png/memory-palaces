import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { NoticeDialog } from '@/shared/ui'

export interface AlgorithmLockedNoticeProps {
  trigger: ReactElement
}

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
