import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { getDueLoci } from '@/shared/lib'
import {
  selectIsReady as selectLociReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import { selectIsReady as selectRoomsReady, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import {
  selectIsReady as selectPalacesReady,
  selectPalaces,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import { gradeCard } from '@/features/review'
import { studyXp } from '@/features/progress'
import { StudySession, type StudyCard } from '@/widgets/study-session'
import { useSessionReward } from '@/widgets/session-reward'
import { AppScreen, Button } from '@/shared/ui'

export interface ReviewPageProps {
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

/** Daily Review — the cross-library queue of every card due now, regardless of
 * palace. A fixed review session (no browse/scope/edit): the whole point is the
 * spaced-repetition catch-up. */
export function ReviewPage({ onBack }: ReviewPageProps) {
  const { t } = useTranslation()
  const locusStore = useLocusStoreApi()
  const roomStore = useRoomStoreApi()
  const palaceStore = usePalaceStoreApi()
  const reward = useSessionReward()
  // Snapshot the clock so the due queue stays stable for the whole session.
  const [now] = useState(() => Date.now())

  useEffect(() => {
    locusStore.getState().start()
    roomStore.getState().start()
    palaceStore.getState().start()
  }, [locusStore, roomStore, palaceStore])

  const allLoci = useLocusStore(selectLoci)
  const rooms = useRoomStore(selectRooms)
  const palaces = usePalaceStore(selectPalaces)
  // Each store hook must run unconditionally (Rules of Hooks) — combine after.
  const lociIsReady = useLocusStore(selectLociReady)
  const roomsIsReady = useRoomStore(selectRoomsReady)
  const palacesIsReady = usePalaceStore(selectPalacesReady)
  const ready = lociIsReady && roomsIsReady && palacesIsReady

  const byId = useMemo(() => new Map(allLoci.map((locus) => [locus.id, locus])), [allLoci])
  const due = useMemo(() => getDueLoci(palaces, rooms, allLoci, now), [palaces, rooms, allLoci, now])
  const liveCards = useMemo<StudyCard[]>(
    () =>
      due.flatMap((card) => {
        const locus = byId.get(card.locus.id)
        return locus ? [{ locus, palaceName: card.palaceName, roomTitle: card.roomTitle }] : []
      }),
    [due, byId],
  )
  const livePalaceCount = useMemo(() => new Set(due.map((card) => card.palaceId)).size, [due])

  // Freeze the due queue at the first ready render. Grading moves a card out of the
  // live due set, which would otherwise shrink the deck mid-session and unmount the
  // StudySession before it can celebrate completion (and award XP).
  const snapshotRef = useRef<{ cards: StudyCard[]; palaceCount: number } | null>(null)
  if (ready && snapshotRef.current === null) {
    snapshotRef.current = { cards: liveCards, palaceCount: livePalaceCount }
  }
  const snapshot = snapshotRef.current

  if (!ready || !snapshot) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (snapshot.cards.length === 0) {
    return (
      <AppScreen className="items-center justify-center gap-5 text-center">
        <div className="grid size-16 place-items-center rounded-card-featured bg-card shadow-rest">
          <Check className="size-8 text-[var(--success-foreground)]" aria-hidden />
        </div>
        <div>
          <h2 className="mb-1 text-[length:var(--p-text-headline)] font-bold text-heading">
            {t('review.allCaughtUp')}
          </h2>
          <p className="mx-auto max-w-[34ch] text-[length:var(--p-text-body)]">
            {t('review.allCaughtUpHint')}
          </p>
        </div>
        <Button onClick={onBack}>{t('review.back')}</Button>
      </AppScreen>
    )
  }

  const subtitle = `${t('review.dueCount', { count: snapshot.cards.length })} · ${t(
    snapshot.palaceCount === 1 ? 'review.palaceOne' : 'review.palaceOther',
    { count: snapshot.palaceCount },
  )}`

  return (
    <StudySession
      cards={snapshot.cards}
      title={t('review.title')}
      subtitle={subtitle}
      features={{ browse: false, scope: false, edit: false, swipe: true }}
      initialPrefs={{ mode: 'review', sortIntoPiles: false }}
      onGrade={(id, grade) => void gradeCard(locusStore, id, grade, now)}
      onBack={onBack ?? (() => {})}
      onComplete={(summary) => {
        void reward({ xp: studyXp(summary.graded) })
        onBack?.()
      }}
      now={now}
    />
  )
}
