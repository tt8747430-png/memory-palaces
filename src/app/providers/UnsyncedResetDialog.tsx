import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CloudAlert } from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui'
import type { UnsyncedReset } from './use-data-transition'

export function UnsyncedResetDialog({ reset }: { reset: UnsyncedReset | null }) {
  const { t } = useTranslation()
  const confirmed = useRef(false)
  return (
    <ConfirmDialog
      open={Boolean(reset)}
      onOpenChange={(open) => {
        if (open || confirmed.current) return
        void reset?.cancel()
      }}
      destructive
      icon={<CloudAlert className="size-6" aria-hidden />}
      title={t('sync.unsyncedReset.title')}
      description={t('sync.unsyncedReset.body', { count: reset?.count ?? 0 })}
      confirmLabel={t('sync.unsyncedReset.proceed')}
      cancelLabel={t('sync.unsyncedReset.signOut')}
      onConfirm={() => {
        confirmed.current = true
        void reset?.proceed()
      }}
    />
  )
}
