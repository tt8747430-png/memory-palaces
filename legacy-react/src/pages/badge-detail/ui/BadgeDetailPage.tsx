import { useEffect, useMemo, useState } from 'react'
import { animate, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Check, Lock } from 'lucide-react'
import {
  type Badge,
  type BadgeId,
  cn,
  computeBadges,
  computeTrainingTotals,
  milestoneProgress,
  totalTrainingDays,
} from '@/shared/lib'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { BADGE_META } from '@/widgets/badge-list'
import { AppScreen, BadgeMedallion, cardSurface, ProgressBar, ScreenHeader } from '@/shared/ui'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

const BADGE_IDS: readonly BadgeId[] = ['xp', 'streak', 'decks', 'library', 'cards', 'days']
const isBadgeId = (value: string): value is BadgeId =>
  (BADGE_IDS as readonly string[]).includes(value)

export interface BadgeDetailPageProps {
  badgeId: string
  onBack?: () => void
}

export function BadgeDetailPage({ badgeId, onBack }: BadgeDetailPageProps) {
  const { t } = useTranslation()
  const progressStore = useProgressStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const progress = useProgressStore(selectProgress)
  const decks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)

  useEffect(() => {
    progressStore.getState().start()
    deckStore.getState().start()
    cardStore.getState().start()
  }, [progressStore, deckStore, cardStore])

  const totals = useMemo(() => computeTrainingTotals(decks, cards), [decks, cards])
  const topLevelDecks = useMemo(() => decks.filter((deck) => deck.parentId === null), [decks])
  const badges = useMemo(
    () =>
      computeBadges({
        xp: progress?.xp ?? 0,
        longestStreak: progress?.longestStreak ?? 0,
        decksCompleted: totals.decksCompleted,
        deckCount: topLevelDecks.length,
        totalCards: totals.totalCards,
        trainingDayCount: totalTrainingDays(progress?.trainingDays ?? []),
      }),
    [progress, totals, topLevelDecks.length],
  )

  const badge = isBadgeId(badgeId) ? badges.find((entry) => entry.id === badgeId) : undefined

  if (!badge) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('badges.title')} onBack={onBack} backLabel={t('common.back')} />
        }
      />
    )
  }

  const meta = BADGE_META[badge.id]
  const title = t(meta.titleKey)
  const heroTier = Math.max(badge.tier, 1)
  const maxed = badge.next === null
  const tierLabel =
    badge.tier === 0
      ? t('badgeDetail.locked')
      : t('badgeDetail.tierOf', { tier: badge.tier, total: badge.tiers.length })

  return (
    <AppScreen
      fill
      className="pb-28"
      header={<ScreenHeader title={title} onBack={onBack} backLabel={t('common.back')} />}
    >
      <div className="mt-2 flex flex-col gap-6">
        <Hero badge={badge} tier={heroTier} tierLabel={tierLabel} maxed={maxed} />

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('badgeDetail.howToTitle')}
          </h2>
          <p className="px-1 text-[length:var(--p-text-body)] leading-relaxed text-foreground">
            {t(`badges.${badge.id}.blurb`)}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('badgeDetail.ladderTitle')}
          </h2>
          <TierLadder badge={badge} />
        </section>
      </div>
    </AppScreen>
  )
}

function Hero({
  badge,
  tier,
  tierLabel,
  maxed,
}: {
  badge: Badge
  tier: number
  tierLabel: string
  maxed: boolean
}) {
  const { t } = useTranslation()
  const meta = BADGE_META[badge.id]
  return (
    <section className="relative flex flex-col items-center pt-3 text-center">
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 size-40 -translate-x-1/2 -translate-y-4 rounded-full opacity-35 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent 68%)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.84, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative"
      >
        <BadgeMedallion icon={meta.icon} tier={tier} shine className="size-28" />
      </motion.div>

      <p className="mt-4 text-[length:var(--p-text-headline)] font-bold leading-none tabular-nums text-heading">
        <CountUp
          to={badge.value}
          format={(n) => t('badgeDetail.nowValue', { value: n.toLocaleString() })}
        />
      </p>
      <span className="mt-3 inline-flex items-center rounded-full bg-info-surface px-3 py-1 text-[length:var(--p-text-label)] font-bold text-info-foreground">
        {tierLabel}
      </span>
      {maxed ? (
        <p className="mt-2 text-[length:var(--p-text-label)] font-semibold text-[var(--success-foreground)]">
          {t('badgeDetail.maxed')}
        </p>
      ) : null}
    </section>
  )
}

function TierLadder({ badge }: { badge: Badge }) {
  const { t } = useTranslation()
  const currentIndex = badge.tier < badge.tiers.length ? badge.tier : -1
  const pct = Math.round(milestoneProgress(badge) * 100)

  return (
    <ol className={cn(cardSurface, 'flex flex-col divide-y divide-border overflow-hidden')}>
      {badge.tiers.map((threshold, index) => {
        const reached = index < badge.tier
        const isCurrent = index === currentIndex
        const remaining = badge.next != null ? badge.next - badge.value : 0
        return (
          <motion.li
            key={threshold}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + index * 0.05, duration: 0.3, ease: EASE_OUT }}
            className="flex flex-col gap-2.5 p-4"
          >
            <div className="flex items-center gap-3.5">
              <TierMarker reached={reached} isCurrent={isCurrent} index={index} />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-[length:var(--p-text-sub)] font-bold leading-tight',
                    reached || isCurrent ? 'text-heading' : 'text-muted-foreground',
                  )}
                >
                  {t('badgeDetail.tierLabel', { n: index + 1 })}
                </p>
                <p className="text-[length:var(--p-text-label)] font-medium tabular-nums text-muted-foreground">
                  {threshold.toLocaleString()}
                </p>
              </div>
              <TierStatus reached={reached} isCurrent={isCurrent} remaining={remaining} />
            </div>

            {/* The tier a learner is climbing — here the fill *is* the moment,
                so this bar (alone) still animates up from zero on arrival. */}
            {isCurrent ? <ProgressBar value={pct} animateOnMount delay={0.3} /> : null}
          </motion.li>
        )
      })}
    </ol>
  )
}

function TierMarker({
  reached,
  isCurrent,
  index,
}: {
  reached: boolean
  isCurrent: boolean
  index: number
}) {
  if (reached) {
    return <BadgeMedallion icon={Check} tier={index + 1} className="size-10" />
  }
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full text-[length:var(--p-text-sub)] font-bold tabular-nums',
        isCurrent
          ? 'bg-primary/[0.08] text-primary ring-2 ring-primary/30'
          : 'bg-primary/[0.05] text-primary/40',
      )}
    >
      {isCurrent ? index + 1 : <Lock className="size-4" aria-hidden />}
    </span>
  )
}

function TierStatus({
  reached,
  isCurrent,
  remaining,
}: {
  reached: boolean
  isCurrent: boolean
  remaining: number
}) {
  const { t } = useTranslation()
  if (reached) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-[length:var(--p-text-label)] font-bold text-[var(--success-foreground)]">
        <Check className="size-4" aria-hidden />
        {t('badgeDetail.reached')}
      </span>
    )
  }
  if (isCurrent) {
    return (
      <span className="shrink-0 text-[length:var(--p-text-label)] font-bold tabular-nums text-primary">
        {t('badgeDetail.inProgress', { remaining: remaining.toLocaleString() })}
      </span>
    )
  }
  return (
    <span className="shrink-0 text-[length:var(--p-text-label)] font-semibold text-muted-foreground">
      {t('badgeDetail.upcoming')}
    </span>
  )
}

function CountUp({ to, format }: { to: number; format: (n: number) => string }) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? to : 0)
  useEffect(() => {
    if (reduce) {
      setN(to)
      return
    }
    const controls = animate(0, to, {
      duration: 0.9,
      ease: EASE_OUT,
      onUpdate: (value) => setN(Math.round(value)),
    })
    return () => controls.stop()
  }, [to, reduce])
  return <>{format(n)}</>
}
