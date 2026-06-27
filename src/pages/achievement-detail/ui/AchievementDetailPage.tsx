import { useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Check, Lock } from 'lucide-react'
import {
  type AchievementId,
  computeAchievements,
  computeTrainingTotals,
  isRoomCompleted,
} from '@/shared/lib'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectPalaces, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { lociForRoom, selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { ACHIEVEMENT_META } from '@/widgets/achievement-list'
import { AppScreen, BadgeMedallion, ScreenHeader, cardSurface } from '@/shared/ui'

const ACHIEVEMENT_IDS: readonly AchievementId[] = [
  'first-palace',
  'week-warrior',
  'palace-master',
  'xp-champion',
  'perfectionist',
  'dedicated-learner',
]
const isAchievementId = (value: string): value is AchievementId =>
  (ACHIEVEMENT_IDS as readonly string[]).includes(value)

export interface AchievementDetailPageProps {
  achievementId: string
  onBack?: () => void
}

/** A single milestone, end to end: the medallion in its earned or locked state, what it
 * takes to earn it, and the exact condition behind it. One-shot (no tiers), so the page
 * is a clear "here's the goal and how to reach it". */
export function AchievementDetailPage({ achievementId, onBack }: AchievementDetailPageProps) {
  const { t } = useTranslation()
  const progressStore = useProgressStoreApi()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const progress = useProgressStore(selectProgress)
  const palaces = usePalaceStore(selectPalaces)
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)

  useEffect(() => {
    progressStore.getState().start()
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
  }, [progressStore, palaceStore, roomStore, locusStore])

  const totals = useMemo(() => computeTrainingTotals(rooms, loci), [rooms, loci])
  const anyPalaceCompleted = useMemo(
    () =>
      palaces.some((palace) => {
        const palaceRooms = roomsForPalace(rooms, palace.id)
        return (
          palaceRooms.length > 0 &&
          palaceRooms.every((room) => isRoomCompleted(lociForRoom(loci, room.id)))
        )
      }),
    [palaces, rooms, loci],
  )
  const achievements = useMemo(
    () =>
      computeAchievements({
        palaceCount: palaces.length,
        streakCount: progress?.streakCount ?? 0,
        xp: progress?.xp ?? 0,
        bestQuizAccuracy: progress?.bestQuizAccuracy ?? 0,
        roomsCompleted: totals.roomsCompleted,
        anyPalaceCompleted,
      }),
    [palaces.length, progress, totals.roomsCompleted, anyPalaceCompleted],
  )

  const achievement = isAchievementId(achievementId)
    ? achievements.find((entry) => entry.id === achievementId)
    : undefined

  if (!achievement) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('achievementsPage.title')} onBack={onBack} backLabel={t('common.back')} />
        }
      />
    )
  }

  const meta = ACHIEVEMENT_META[achievement.id]
  const title = t(meta.titleKey)
  const earned = achievement.earned

  return (
    <AppScreen
      fill
      className="pb-28"
      header={<ScreenHeader title={title} onBack={onBack} backLabel={t('common.back')} />}
    >
      <div className="mt-2 flex flex-col gap-6">
        <section className="relative flex flex-col items-center pt-3 text-center">
          {earned ? (
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 size-40 -translate-x-1/2 -translate-y-4 rounded-full opacity-35 blur-3xl"
              style={{ background: 'radial-gradient(circle, var(--accent), transparent 68%)' }}
            />
          ) : null}
          <motion.div
            initial={{ opacity: 0, scale: 0.84, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative"
          >
            <BadgeMedallion icon={meta.icon} locked={!earned} shine={earned} className="size-28" />
          </motion.div>

          <span
            className={
              earned
                ? 'mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--success-surface)] px-3 py-1 text-[length:var(--p-text-label)] font-bold text-[var(--success-on-surface)]'
                : 'mt-4 inline-flex items-center gap-1.5 rounded-full bg-info-surface px-3 py-1 text-[length:var(--p-text-label)] font-bold text-info-foreground'
            }
          >
            {earned ? <Check className="size-4" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
            {t(earned ? 'achievementDetail.earned' : 'achievementDetail.locked')}
          </span>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('achievementDetail.howToTitle')}
          </h2>
          <p className="px-1 text-[length:var(--p-text-body)] leading-relaxed text-foreground">
            {t(`achievementDetail.${achievement.id}.howTo`)}
          </p>
        </section>

        <div className={`${cardSurface} flex items-start gap-3 p-4`}>
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-control bg-info-surface text-info-foreground">
            <meta.icon className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[length:var(--p-text-sub)] font-bold leading-tight text-heading">
              {title}
            </p>
            <p className="mt-0.5 text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
              {t(meta.descriptionKey)}
            </p>
          </div>
        </div>

        {earned ? (
          <p className="px-1 text-[length:var(--p-text-label)] font-semibold text-[var(--success-foreground)]">
            {t('achievementDetail.earnedNote')}
          </p>
        ) : null}
      </div>
    </AppScreen>
  )
}
