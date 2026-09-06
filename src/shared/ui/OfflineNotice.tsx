import { WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, useOnline } from '@/shared/lib'

export interface OfflineNoticeProps {
  /** Override the default sentence when a surface can say something more specific. */
  message?: string
  className?: string
}

/**
 * What a surface that needs the network shows when there is none.
 *
 * Mindscape studies offline by design, so the handful of screens that genuinely cannot — a reset
 * email, a password change, an avatar upload, deleting an account — are the exception and have to
 * say so *before* the press rather than after it. Each of them used to leave its submit enabled and
 * let the transport fail, which surfaced as a toast reading "Failed to fetch".
 *
 * Renders nothing while online, so a caller can place it unconditionally.
 */
export function OfflineNotice({ message, className }: OfflineNoticeProps) {
  const { t } = useTranslation()
  const online = useOnline()
  if (online) return null

  return (
    <div
      role="status"
      className={cn('flex items-start gap-3 rounded-card bg-(--warning-surface) p-3.5', className)}
    >
      <WifiOff className="mt-0.5 size-4 shrink-0 text-(--warning-foreground)" aria-hidden />
      <p className="text-label leading-snug text-(--warning-foreground)">
        {message ?? t('common.offline')}
      </p>
    </div>
  )
}
