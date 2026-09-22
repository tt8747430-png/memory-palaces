import { type CSSProperties, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { BellOff, Flame, type LucideIcon, Star, Trash2, Trophy, X, Zap } from 'lucide-react'
import { cn } from '@/shared/lib'
import { cardSurface, Chip, IconButton, SwipeRow } from '@/shared/ui'
import {
  type AppNotification,
  type Milestone,
  milestoneXp,
  type MilestoneType,
} from '@/entities/notification'
import { bucketOf, type DayBucket, relativeTime, type RelativeTime } from '../lib/group'

interface Visual {
  icon: LucideIcon
  fg: string
  tint: string
}

/** How a milestone looks. Its words live in `copyOf`: a repaint is not a rewording. */
const VISUALS: Record<MilestoneType, Visual> = {
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
  /**
   * The ids that were still unread when the screen opened. The screen marks everything read on the
   * way in, so the ring cannot follow `read` without vanishing under the learner's eyes.
   */
  unseen: ReadonlySet<string>
  onRemove: (id: string) => void
  now?: number
}

export function NotificationsPanel({
  notifications,
  unseen,
  onRemove,
  now,
}: NotificationsPanelProps) {
  const { t } = useTranslation()
  // Read once, not per render: a fresh `Date.now()` in the default would void every memo below it.
  const at = useMemo(() => now ?? Date.now(), [now])
  const sections = useMemo(() => groupByBucket(notifications, at), [notifications, at])

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 pt-24 text-center">
        <span className="grid size-20 place-items-center rounded-card-featured bg-info-surface text-info-foreground shadow-rest">
          <BellOff className="size-9" aria-hidden />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-headline font-bold text-heading">{t('notifications.emptyTitle')}</h2>
          <p className="max-w-[34ch] text-pretty text-body text-muted-foreground">
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
            <h2 className="mb-2 px-1 text-tiny font-semibold uppercase tracking-wide text-muted-foreground">
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
                    <SwipeRow
                      trailing={[
                        {
                          id: 'dismiss',
                          icon: <Trash2 className="size-5" aria-hidden />,
                          label: t('common.delete'),
                          accent: 'red',
                          onAction: () => onRemove(notification.id),
                        },
                      ]}
                    >
                      <NotificationRow
                        notification={notification}
                        unseen={unseen.has(notification.id)}
                        now={at}
                        onRemove={onRemove}
                      />
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
  unseen,
  now,
  onRemove,
}: {
  notification: AppNotification
  unseen: boolean
  now: number
  onRemove: (id: string) => void
}) {
  const { t } = useTranslation()
  const { milestone } = notification
  const { icon: Icon, fg, tint } = VISUALS[milestone.type]
  const badgeStyle: CSSProperties = { color: fg, backgroundColor: tint }
  const copy = copyOf(t, milestone)
  const xp = milestoneXp(milestone)

  return (
    <div
      className={cn(
        cardSurface,
        'relative flex items-start gap-3 p-3.5',
        unseen && 'ring-1 ring-(--notification-unseen-ring)',
      )}
    >
      {unseen ? (
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
          <p className="truncate text-label font-semibold text-heading">{copy.title}</p>
          {xp !== undefined ? (
            <Chip
              className="shrink-0 px-1.5 py-0.5"
              icon={<Zap className="size-3" fill="currentColor" aria-hidden />}
            >
              {`+${xp}`}
            </Chip>
          ) : null}
        </div>
        <p className="mt-0.5 text-label text-muted-foreground">{copy.subtitle}</p>
        <p className="mt-1 text-tiny text-muted-foreground">
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

/** One pass over the kind, for both lines of copy — the numbers come from the milestone itself. */
function copyOf(t: TFunction, milestone: Milestone): { title: string; subtitle: string } {
  switch (milestone.type) {
    case 'level-up':
      return {
        title: t('notifications.levelUpTitle', { level: milestone.level }),
        subtitle: t('notifications.levelUpBody'),
      }
    case 'streak':
      return {
        title: t('notifications.streakTitle', { count: milestone.count }),
        subtitle: t('notifications.streakBody', { count: milestone.count }),
      }
    case 'quiz':
      return {
        title: t('notifications.quizTitle'),
        subtitle: t('notifications.quizBody', { accuracy: milestone.accuracy }),
      }
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
