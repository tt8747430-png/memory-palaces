import { useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, ChevronRight, Copy, MoreVertical, Star, Trash2, Zap } from 'lucide-react'
import { impact, useLongPress } from '@/shared/lib'
import { ActionSheet, type SheetAction } from '@/shared/ui'

export interface PalaceSummary {
  id: string
  name: string
  icon: string
  /** Mastery 0–100 (share of completed rooms). */
  progress: number
  roomsCompleted: number
  totalRooms: number
}

export interface PalacesOverviewProps {
  palaces: PalaceSummary[]
  onOpenPalace: (id: string) => void
  onViewAll: () => void
  /** Quick actions (long-press / ⋮). Each is optional; the menu only shows what's wired. */
  onTrainPalace?: (id: string) => void
  onDuplicatePalace?: (id: string) => void
  onDeletePalace?: (id: string) => void
  className?: string
}

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const MASTERED_AT = 70

/** The home's palace grid: each palace is a sky-glass card (kin to the Today's-training
 * hero) with its icon lifting off the surface over a progress ring that states real
 * mastery. Tap to open; long-press or the ⋮ opens quick actions (train, duplicate,
 * delete). Hidden on first run. */
export function PalacesOverview({
  palaces,
  onOpenPalace,
  onViewAll,
  onTrainPalace,
  onDuplicatePalace,
  onDeletePalace,
  className,
}: PalacesOverviewProps) {
  const { t } = useTranslation()
  const [menuFor, setMenuFor] = useState<PalaceSummary | null>(null)
  if (palaces.length === 0) return null

  const hasQuickActions = Boolean(onTrainPalace || onDuplicatePalace || onDeletePalace)

  const menuActions = (palace: PalaceSummary): SheetAction[] => {
    const actions: SheetAction[] = [
      {
        id: 'open',
        label: t('palaces.open'),
        icon: <ArrowUpRight className="size-5" aria-hidden />,
        onSelect: () => onOpenPalace(palace.id),
      },
    ]
    if (onTrainPalace) {
      actions.push({
        id: 'train',
        label: t('home.trainNow'),
        icon: <Zap className="size-5" aria-hidden />,
        onSelect: () => onTrainPalace(palace.id),
      })
    }
    if (onDuplicatePalace) {
      actions.push({
        id: 'duplicate',
        label: t('palaces.duplicate'),
        icon: <Copy className="size-5" aria-hidden />,
        onSelect: () => onDuplicatePalace(palace.id),
      })
    }
    if (onDeletePalace) {
      actions.push({
        id: 'delete',
        label: t('palaces.delete'),
        icon: <Trash2 className="size-5" aria-hidden />,
        destructive: true,
        // No confirm step: the delete is undoable (the home shows an undo toast), so the
        // forgiving path is to act immediately rather than gate behind a dialog.
        onSelect: () => onDeletePalace(palace.id),
      })
    }
    return actions
  }

  return (
    <section aria-labelledby="palaces-overview-heading" className={className}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2
          id="palaces-overview-heading"
          className="text-[length:var(--p-text-sub)] font-bold text-heading"
        >
          {t('home.palacesTitle')}
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="relative flex items-center gap-1 rounded-pill px-2 py-1 text-[length:var(--p-text-label)] font-semibold text-primary transition-transform after:absolute after:-inset-2 after:content-[''] active:scale-[0.98]"
        >
          {t('home.viewAll')}
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {/* Generous vertical gap leaves room for each icon to float above its card. */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 pt-4">
        {palaces.map((palace, index) => (
          <PalaceTile
            key={palace.id}
            palace={palace}
            index={index}
            onOpen={() => onOpenPalace(palace.id)}
            onMenu={hasQuickActions ? () => setMenuFor(palace) : undefined}
          />
        ))}
      </div>

      <ActionSheet
        open={menuFor !== null}
        onOpenChange={(open) => {
          if (!open) setMenuFor(null)
        }}
        title={menuFor?.name ?? ''}
        actions={menuFor ? menuActions(menuFor) : []}
        cancelLabel={t('common.cancel')}
      />
    </section>
  )
}

function PalaceTile({
  palace,
  index,
  onOpen,
  onMenu,
}: {
  palace: PalaceSummary
  index: number
  onOpen: () => void
  onMenu?: () => void
}) {
  const { t } = useTranslation()
  const longPress = useLongPress({
    onLongPress: () => {
      if (!onMenu) return
      impact()
      onMenu()
    },
    onTap: onOpen,
  })
  const interactive = onMenu ? longPress : { onClick: onOpen }

  return (
    <div className="relative">
      <motion.span
        aria-hidden
        initial={{ opacity: 0, scale: 0.82, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.12 + index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="drop-shadow-float pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-[34px] leading-none"
      >
        {palace.icon || '🏛️'}
      </motion.span>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 + index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileTap={{ scale: 0.98 }}
        aria-label={t('palaces.openLabel', { name: palace.name })}
        className="relative w-full text-left"
        {...interactive}
      >
        <div className="relative overflow-hidden rounded-card-featured border border-[color:var(--border-glass)] bg-gradient-to-br from-secondary/45 to-secondary/15 px-3 pb-4 pt-8 shadow-featured backdrop-blur-md">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent"
          />
          {palace.progress >= MASTERED_AT ? (
            <span
              role="img"
              aria-label={t('home.mastered')}
              className="absolute left-2 top-2 z-10 grid size-6 place-items-center rounded-full bg-[var(--warning)] text-[var(--warning-on-fill)] shadow-interactive"
            >
              <Star className="size-3.5" fill="currentColor" aria-hidden />
            </span>
          ) : null}

          <div className="relative flex flex-col items-center gap-1 text-center">
            <ProgressRing id={palace.id} progress={palace.progress} />
            <span className="mt-1 block w-full truncate text-[length:var(--p-text-label)] font-semibold text-heading">
              {palace.name}
            </span>
            <span className="block text-[length:var(--p-text-tiny)] font-medium text-[color:var(--text-heading)]/65">
              {t('home.roomsCount', {
                completed: palace.roomsCompleted,
                total: palace.totalRooms,
              })}
            </span>
          </div>
        </div>
      </motion.button>

      {onMenu ? (
        <button
          type="button"
          onClick={onMenu}
          aria-label={t('palaces.moreLabel', { name: palace.name })}
          className="absolute right-1.5 top-1.5 z-20 grid size-8 place-items-center rounded-full bg-card-glass text-heading shadow-rest transition-transform after:absolute after:-inset-2 after:content-[''] active:scale-90"
        >
          <MoreVertical className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}

function ProgressRing({ id, progress }: { id: string; progress: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)))
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE
  return (
    <span className="relative grid size-[68px] place-items-center">
      <svg viewBox="0 0 64 64" className="size-[68px] -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`ring-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          stroke="color-mix(in oklch, var(--primary) 14%, transparent)"
          strokeWidth="6"
        />
        <motion.circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute text-[length:var(--p-text-title)] font-bold tabular-nums text-heading">
        {pct}
        <span className="text-[length:var(--p-text-tiny)] font-semibold">%</span>
      </span>
    </span>
  )
}
