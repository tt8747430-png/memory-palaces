import { useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CloudAlert,
  CloudCheck,
  CloudUpload,
  RefreshCw,
  WifiOff,
} from 'lucide-react'
import { cn, EASE_OUT, useOnline, useSyncRunner } from '@/shared/lib'
import { Button } from '@/shared/ui'
import { selectSessionKind, useSessionStore } from '@/entities/session'
import { selectPendingCount, usePendingChangeStore } from '@/entities/pending-change'
import { selectCloudChanged, useSyncStateStore } from '@/entities/sync-state'
import { bannerView, type SyncBannerMessage, type SyncBannerTone } from '../model/banner-state'

const TONE: Record<SyncBannerTone, string> = {
  info: 'bg-info-surface text-(--info-foreground)',
  warning: 'bg-(--warning-surface) text-(--warning-foreground)',
  success: 'bg-(--success-surface) text-(--success-on-surface)',
  danger: 'bg-(--danger-surface) text-(--danger-on-surface)',
}

const ICON: Record<SyncBannerMessage, typeof RefreshCw> = {
  restoring: RefreshCw,
  syncing: RefreshCw,
  synced: CloudCheck,
  failed: CloudAlert,
  offline: WifiOff,
  pendingAndCloud: CloudUpload,
  pending: CloudUpload,
  cloudChanged: CloudAlert,
}

export interface SyncBannerProps {
  className?: string
}

export function SyncBanner({ className }: SyncBannerProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const runner = useSyncRunner()
  const online = useOnline()
  const kind = useSessionStore(selectSessionKind)
  const pendingCount = usePendingChangeStore(selectPendingCount)
  const cloudChanged = useSyncStateStore(selectCloudChanged)

  const view = useMemo(
    () =>
      runner && kind === 'account'
        ? bannerView({
            phase: runner.phase,
            pendingCount,
            cloudChanged,
            online,
          })
        : null,
    [runner, kind, pendingCount, cloudChanged, online],
  )

  const Icon = view ? ICON[view.message] : AlertTriangle

  return (
    <AnimatePresence initial={false}>
      {view ? (
        <motion.div
          key="sync-banner"
          role="status"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: EASE_OUT }}
          className={cn(
            'flex items-center gap-3 rounded-card px-3.5 py-3',
            TONE[view.tone],
            view.muted && 'opacity-80',
            className,
          )}
        >
          <Icon
            className={cn('size-4 shrink-0', view.busy && !reduce && 'animate-spin')}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-label leading-snug">
              {t(`sync.banner.${view.message}`, { count: view.count })}
            </p>
            {view.tone === 'danger' && runner?.error ? (
              <p className="truncate text-label opacity-80">{runner.error}</p>
            ) : null}
          </div>
          {view.action ? (
            <Button variant="secondary" className="shrink-0" onClick={() => void runner?.run()}>
              {t(view.action === 'retry' ? 'sync.action.retry' : 'sync.action.synchronise')}
            </Button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
