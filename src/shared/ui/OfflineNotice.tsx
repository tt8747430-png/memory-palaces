import { WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, useOnline } from '@/shared/lib'

export interface OfflineNoticeProps {
  message?: string
  className?: string
}

export function OfflineNotice({ message, className }: OfflineNoticeProps) {
  const { t } = useTranslation()
  const online = useOnline()
  if (online) return null

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-card border border-(--warning-border) bg-(--warning-surface) p-3.5',
        className,
      )}
    >
      <WifiOff className="mt-0.5 size-4 shrink-0 text-(--warning-foreground)" aria-hidden />
      <p className="text-label leading-snug text-(--warning-foreground)">
        {message ?? t('common.offline')}
      </p>
    </div>
  )
}
