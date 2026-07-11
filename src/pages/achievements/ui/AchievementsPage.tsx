import { useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  type AchievementId,
  cn,
  computeAchievements,
  cardsInSubtree,
  computeTrainingTotals,
  isDeckCompleted,
  levelFromXp,
  totalTrainingDays,
} from '@/shared/lib'
import {
  selectIsReady as selectProgressReady,
  selectProgress,
  useProgressStore,
  useProgressStoreApi,
} from '@/entities/progress'
import {
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import {
  selectCards,
  selectIsReady as selectCardsReady,
  useCardStore,
  useCardStoreApi,
} from '@/entities/card'
import { AchievementGrid } from '@/widgets/achievement-list'
import { AppScreen, cardSurface, ScreenHeader } from '@/shared/ui'

export interface AchievementsPageProps {
  onBack?: () => void
  /** Open a milestone's "how to earn it" detail; wired by the route wrapper. */
  onOpenAchievement?: (id: AchievementId) => void
}

/** The Achievements screen: a compact grid of personal records (best-ever figures) over
 * the full milestone wall. Records and earned states derive live from the stores. Each
 * milestone taps through to its detail. Reached from the Profile "Achievements / See all". */
export function AchievementsPage({ onBack, onOpenAchievement }: AchievementsPageProps = {}) {
  const { t } = useTranslation()
  const progressStore = useProgressStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const progress = useProgressStore(selectProgress)
  const decks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  // Each store hook must run unconditionally (Rules of Hooks); combine after.
  const progressReady = useProgressStore(selectProgressReady)
  const decksReady = useDeckStore(selectDecksReady)
  const cardsReady = useCardStore(selectCardsReady)
  const dataReady = progressReady && decksReady && cardsReady

  useEffect(() => {
    progressStore.getState().start()
    deckStore.getState().start()
    cardStore.getState().start()
  }, [progressStore, deckStore, cardStore])

  const xp = progress?.xp ?? 0
  const totals = useMemo(() => computeTrainingTotals(decks, cards), [decks, cards])
  const daysTrained = useMemo(
    () => totalTrainingDays(progress?.trainingDays ?? []),
    [progress?.trainingDays],
  )
  const topLevelDecks = useMemo(() => decks.filter((deck) => deck.parentId === null), [decks])
  const anyDeckCompleted = useMemo(
    () => topLevelDecks.some((deck) => isDeckCompleted(cardsInSubtree(decks, cards, deck.id))),
    [topLevelDecks, decks, cards],
  )
  const achievements = useMemo(
    () =>
      computeAchievements({
        deckCount: topLevelDecks.length,
        streakCount: progress?.streakCount ?? 0,
        xp,
        bestQuizAccuracy: progress?.bestQuizAccuracy ?? 0,
        decksCompleted: totals.decksCompleted,
        anyDeckCompleted,
      }),
    [topLevelDecks.length, progress, xp, totals.decksCompleted, anyDeckCompleted],
  )

  const records = [
    {
      id: 'level',
      value: String(levelFromXp(xp).level),
      label: t('achievementsPage.records.level'),
    },
    {
      id: 'streak',
      value: String(progress?.longestStreak ?? 0),
      label: t('achievementsPage.records.streak'),
    },
    {
      id: 'xp',
      value: xp.toLocaleString(),
      label: t('achievementsPage.records.xp'),
    },
    {
      id: 'accuracy',
      value: `${progress?.bestQuizAccuracy ?? 0}%`,
      label: t('achievementsPage.records.accuracy'),
    },
    {
      id: 'rooms',
      value: String(totals.decksCompleted),
      label: t('achievementsPage.records.rooms'),
    },
    {
      id: 'days',
      value: String(daysTrained),
      label: t('achievementsPage.records.days'),
    },
  ]

  return (
    <AppScreen
      fill
      className="pb-28"
      header={
        <ScreenHeader
          title={t('achievementsPage.title')}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
    >
      {!dataReady ? (
        <AchievementsSkeleton />
      ) : (
        <div className="mt-2 flex flex-col gap-6">
          <section>
            <h2 className="mb-3 px-1 text-[length:var(--p-text-title)] font-bold text-heading">
              {t('achievementsPage.recordsTitle')}
            </h2>
            <motion.dl
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className={cn(cardSurface, 'grid grid-cols-3 overflow-hidden')}
            >
              {records.map((record, index) => (
                <div
                  key={record.id}
                  className={cn(
                    'flex flex-col-reverse items-center gap-1 px-2 py-5 text-center',
                    index % 3 !== 0 && 'border-l border-border',
                    index >= 3 && 'border-t border-border',
                  )}
                >
                  <dt className="text-[length:var(--p-text-label)] font-medium leading-tight text-muted-foreground">
                    {record.label}
                  </dt>
                  <dd className="text-[length:var(--p-text-headline)] font-bold leading-none tabular-nums text-heading">
                    {record.value}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </section>

          <section>
            <h2 className="px-1 text-[length:var(--p-text-title)] font-bold text-heading">
              {t('achievementsPage.milestonesTitle')}
            </h2>
            <p className="mb-4 mt-0.5 px-1 text-[length:var(--p-text-label)] text-muted-foreground">
              {t('achievementsPage.milestonesSubtitle')}
            </p>
            <AchievementGrid achievements={achievements} onOpenAchievement={onOpenAchievement} />
          </section>
        </div>
      )}
    </AppScreen>
  )
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

function AchievementsSkeleton() {
  return (
    <div aria-hidden className="mt-2 flex flex-col gap-6">
      <div className="h-3 w-36 animate-pulse rounded-full bg-secondary/30" />
      <div className="h-24 animate-pulse rounded-card bg-secondary/30" />
      <div className="grid grid-cols-3 gap-x-3 gap-y-7">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className="size-20 animate-pulse rounded-full bg-secondary/30" />
            <div className="h-2.5 w-12 animate-pulse rounded-full bg-secondary/20" />
          </div>
        ))}
      </div>
    </div>
  )
}
