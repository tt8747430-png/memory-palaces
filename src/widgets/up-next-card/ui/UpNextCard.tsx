import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Chip, cardSurface } from '@/shared/ui'
import type { UpNextRoom } from '../lib/pick-up-next'

export interface UpNextCardProps {
  rooms: UpNextRoom[]
  onOpenRoom: (roomId: string) => void
  className?: string
}

/** "Up next" — the rooms to study now, prioritized by the picker. Tapping a row drops
 * straight into that room's training. Hidden when there's nothing to suggest. */
export function UpNextCard({ rooms, onOpenRoom, className }: UpNextCardProps) {
  const { t } = useTranslation()
  if (rooms.length === 0) return null

  return (
    <section aria-labelledby="up-next-heading" className={className}>
      <div className="mb-3 px-1">
        <h2 id="up-next-heading" className="text-[length:var(--p-text-sub)] font-bold text-heading">
          {t('home.upNext')}
        </h2>
        <p className="mt-0.5 text-[length:var(--p-text-label)] text-muted-foreground">
          {t('home.upNextCaption')}
        </p>
      </div>
      <ul className={cn(cardSurface, 'overflow-hidden')}>
        {rooms.map((room, index) => (
          <li key={room.roomId}>
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onOpenRoom(room.roomId)}
              className={cn(
                'flex w-full items-center gap-3.5 p-4 text-left',
                index > 0 && 'border-t border-border',
              )}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-card bg-info-surface text-[22px] leading-none">
                {room.palaceIcon || '🏛️'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[length:var(--p-text-label)] font-semibold text-heading">
                  {room.roomTitle}
                </span>
                <span className="block truncate text-[length:var(--p-text-tiny)] text-muted-foreground">
                  {room.palaceName} ·{' '}
                  {t(room.total === 1 ? 'home.cardsOne' : 'home.cardsOther', { count: room.total })}
                </span>
              </span>
              <StatusChip room={room} />
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </motion.button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function StatusChip({ room }: { room: UpNextRoom }) {
  const { t } = useTranslation()
  if (room.bucket === 0) {
    return (
      <Chip className="shrink-0 bg-[var(--warning-surface)] text-[var(--warning-foreground)]">
        {t('home.dueChip', { count: room.due })}
      </Chip>
    )
  }
  if (room.bucket === 1) return <Chip className="shrink-0">{t('home.inProgress')}</Chip>
  return <Chip className="shrink-0 bg-muted text-muted-foreground">{t('home.notStarted')}</Chip>
}
