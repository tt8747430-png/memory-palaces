import { useMemo, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { BellOff, Flame, Star, Trophy, X, Zap, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Chip, IconButton, SwipeRow, cardSurface } from '@/shared/ui'
import type { AppNotification, NotificationType } from '@/entities/notification'
import { bucketOf, relativeTime, type DayBucket, type RelativeTime } from '../lib/group'

interface Visual {
  icon: LucideIcon
  /** Accessible icon color + its surface tint — both semantic tokens, never a raw
   * fill color (amber/green fills fail contrast as a foreground on their own tint). */
  fg: string
  tint: string
}

const VISUALS: Record<NotificationType, Visual> = {
  // Distinct, on-brand tiles (gold reward / amber streak / blue quiz), each with an
  // accessible foreground — the fill colors themselves fail as a foreground on tint.
  'level-up': {
    icon: Trophy,
    fg: 'var(--rating-edge)',
    tint: 'color-mix(in oklch, var(--rating) 30%, var(--surface))',
  },
  streak: {
    icon: Flame,
    fg: 'var(--warning-foreground)',
    tint: 'color-mix(in oklch, var(--warning) 22%, var(--surface))',
  },
  quiz: {
    icon: Star,
    fg: 'var(--info-foreground)',
    tint: 'color-mix(in oklch, var(--secondary) 45%, var(--surface))',
  },
}

const BUCKET_ORDER: DayBucket[] = ['today', 'yesterday', 'earlier']

export interface NotificationsPanelProps {
  notifications: AppNotification[]
  onRemove: (id: string) => void
  onClearAll: () => void
  now?: number
}

/** Presentational notification history: per-type badge, milestone copy, relative time,
 * and per-item remove, grouped into today/yesterday/earlier. The page owns the store
 * and passes the list + handlers. */
export function NotificationsPanel({
  notifications,
  onRemove,
  now = Date.now(),
}: NotificationsPanelProps) {
  const { t } = useTranslation()
  const sections = useMemo(() => groupByBucket(notifications, now), [notifications, now])

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 pt-24 text-center">
        <span className="grid size-20 place-items-center rounded-card-featured bg-info-surface text-info-foreground shadow-rest">
          <BellOff className="size-9" aria-hidden />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[length:var(--p-text-headline)] font-bold text-heading">
            {t('notifications.emptyTitle')}
          </h2>
          <p className="max-w-[34ch] text-pretty text-[length:var(--p-text-body)] text-muted-foreground">
            {t('notifications.emptyBody')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {BUCKET_ORDER.map((bucket) => {
        const items = sections[bucket]
        if (items.length === 0) return null
        return (
          <section key={bucket}>
            <h2 className="mb-2 px-1 text-[length:var(--p-text-tiny)] font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`notifications.${bucket}`)}
            </h2>
            <ul className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {items.map((notification) => (
                  <motion.li
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
                  >
                    <SwipeRow onSwipe={() => onRemove(notification.id)}>
                      <NotificationRow notification={notification} now={now} onRemove={onRemove} />
                    </SwipeRow>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function NotificationRow({
  notification,
  now,
  onRemove,
}: {
  notification: AppNotification
  now: number
  onRemove: (id: string) => void
}) {
  const { t } = useTranslation()
  const { icon: Icon, fg, tint } = VISUALS[notification.type]
  const badgeStyle: CSSProperties = { color: fg, backgroundColor: tint }

  return (
    <div
      className={cn(
        cardSurface,
        'relative flex items-start gap-3 p-3.5',
        // Unread rows lift with a soft sky ring (before the page marks them read).
        !notification.read && 'ring-1 ring-[color-mix(in_oklch,var(--secondary)_55%,transparent)]',
      )}
    >
      {!notification.read ? (
        <span
          className="absolute left-1 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary"
          aria-hidden
        />
      ) : null}
      <span className="grid size-10 shrink-0 place-items-center rounded-control" style={badgeStyle}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[length:var(--p-text-label)] font-semibold text-heading">
            {titleOf(t, notification)}
          </p>
          {notification.xpGain ? (
            <Chip
              className="shrink-0 px-1.5 py-0.5"
              icon={<Zap className="size-3" fill="currentColor" aria-hidden />}
            >
              {`+${notification.xpGain}`}
            </Chip>
          ) : null}
        </div>
        <p className="mt-0.5 text-[length:var(--p-text-label)] text-muted-foreground">
          {subtitleOf(t, notification)}
        </p>
        <p className="mt-1 text-[length:var(--p-text-tiny)] text-muted-foreground">
          {formatRelative(t, relativeTime(notification.createdAt, now))}
        </p>
      </div>
      <IconButton
        variant="ghost"
        size="sm"
        aria-label={t('notifications.removeLabel')}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onRemove(notification.id)}
      >
        <X className="size-4" aria-hidden />
      </IconButton>
    </div>
  )
}

function groupByBucket(
  notifications: AppNotification[],
  now: number,
): Record<DayBucket, AppNotification[]> {
  const sections: Record<DayBucket, AppNotification[]> = { today: [], yesterday: [], earlier: [] }
  for (const notification of notifications) {
    sections[bucketOf(notification.createdAt, now)].push(notification)
  }
  return sections
}

function titleOf(t: TFunction, n: AppNotification): string {
  switch (n.type) {
    case 'level-up':
      return t('notifications.levelUpTitle', { level: n.level ?? 0 })
    case 'streak':
      return t('notifications.streakTitle', { count: n.count ?? 0 })
    case 'quiz':
      return t('notifications.quizTitle')
  }
}

function subtitleOf(t: TFunction, n: AppNotification): string {
  switch (n.type) {
    case 'level-up':
      return t('notifications.levelUpBody')
    case 'streak':
      return t('notifications.streakBody', { count: n.count ?? 0 })
    case 'quiz':
      return t('notifications.quizBody', { accuracy: n.accuracy ?? 0 })
  }
}

function formatRelative(t: TFunction, r: RelativeTime): string {
  switch (r.unit) {
    case 'now':
      return t('notifications.justNow')
    case 'minutes':
      return t('notifications.minutesAgo', { count: r.value })
    case 'hours':
      return t('notifications.hoursAgo', { count: r.value })
    case 'days':
      return t('notifications.daysAgo', { count: r.value })
    case 'date':
      return new Date(r.iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
}
