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
import { cn, EASE_OUT, syncFailureMessage, useOnline, useSyncRunner } from '@/shared/lib'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { Button } from '@/shared/ui'
import { selectSessionKind, useSessionStore } from '@/entities/session'
import { selectPendingCountIn, usePendingChangeStore } from '@/entities/pending-change'
import { selectCloudChanged, useSyncStateStore } from '@/entities/sync-state'
import { bannerView, type SyncBannerMessage, type SyncBannerTone } from '../model/banner-state'

const TONE: Record<SyncBannerTone, string> = {
  info: 'bg-info-surface text-(--info-foreground) border-(--info-border)',
  warning: 'bg-(--warning-surface) text-(--warning-foreground) border-(--warning-border)',
  success: 'bg-(--success-surface) text-(--success-on-surface) border-(--success-border)',
  danger: 'bg-(--danger-surface) text-(--danger-on-surface) border-(--danger-border)',
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

const NO_TABLES: readonly SyncedTable[] = []

export interface SyncBannerProps {
  className?: string
}

export function SyncBanner({ className }: SyncBannerProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const runner = useSyncRunner()
  const online = useOnline()
  const kind = useSessionStore(selectSessionKind)
  // Waiting means waiting on a held table a Sync covers: a disabled extension's rows are not, and
  // neither is a setting — those go up on their own and are never anyone's to send.
  const tables = runner?.held ?? NO_TABLES
  const pendingCount = usePendingChangeStore(useMemo(() => selectPendingCountIn(tables), [tables]))
  const cloudChanged = useSyncStateStore(selectCloudChanged)

  const failure = syncFailureMessage(t, runner?.error ?? null)

  const view =
    runner && kind === 'account'
      ? bannerView({ phase: runner.phase, pendingCount, cloudChanged, online })
      : null

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
            'flex items-center gap-3 rounded-card border px-3.5 py-3',
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
            {view.tone === 'danger' && failure ? (
              <p className="text-label opacity-80">{failure}</p>
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
