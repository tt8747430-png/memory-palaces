import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { verseText } from '@/shared/lib'
import { lociForRoom, selectIsReady, selectLoci, useLocusStore, useLocusStoreApi, } from '@/entities/locus'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { selectEffectivePreferences, usePreferencesStore, usePreferencesStoreApi, } from '@/entities/preferences'
import { editLocus } from '@/features/locus'
import { setPreferences } from '@/features/preferences'
import { type VerseCard, VerseStudy, type VerseStudyPrefs } from '@/widgets/verse'
import { useSessionReward } from '@/widgets/session-reward'
import { AppScreen, ScreenHeader } from '@/shared/ui'

/** Memorize a single room's verses, or a whole palace's verses across its rooms. */
export type VerseScope = { kind: 'room'; roomId: string } | { kind: 'palace'; palaceId: string }

export interface VerseStudyPageProps {
  scope: VerseScope
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

/** Verse study — a scope's loci as memorizable verses (`front` reference, `back` text).
 * Memorized + edits write through the existing `editLocus` command; the recall modes
 * are read-only. */
export function VerseStudyPage({ scope, onBack }: VerseStudyPageProps) {
  const { t } = useTranslation()
  const locusStore = useLocusStoreApi()
  const roomStore = useRoomStoreApi()
  const palaceStore = usePalaceStoreApi()
  const preferencesStore = usePreferencesStoreApi()
  const preferences = usePreferencesStore(selectEffectivePreferences)
  const reward = useSessionReward()

  useEffect(() => {
    locusStore.getState().start()
    roomStore.getState().start()
    palaceStore.getState().start()
    preferencesStore.getState().start()
  }, [locusStore, roomStore, palaceStore, preferencesStore])

  const allRooms = useRoomStore(selectRooms)
  const room = useMemo(
    () =>
      scope.kind === 'room'
        ? allRooms.find((candidate) => candidate.id === scope.roomId)
        : undefined,
    [allRooms, scope],
  )
  const palaceId = scope.kind === 'palace' ? scope.palaceId : room?.palaceId
  const palace = usePalaceStore((state) =>
    state.palaces.find((candidate) => candidate.id === palaceId),
  )
  const allLoci = useLocusStore(selectLoci)
  const ready = useLocusStore(selectIsReady)

  const verses = useMemo<VerseCard[]>(() => {
    const toVerses = (id: string) =>
      lociForRoom(allLoci, id).map((locus) => ({
        id: locus.id,
        reference: locus.front,
        text: verseText(locus),
        memorized: locus.memorized,
      }))
    if (scope.kind === 'room') return toVerses(scope.roomId)
    return roomsForPalace(allRooms, scope.palaceId).flatMap((each) => toVerses(each.id))
  }, [allLoci, allRooms, scope])

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  const missing = scope.kind === 'room' ? !room : !palace
  if (missing) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('train.notFound')} onBack={onBack} backLabel={t('verse.back')} />
        }
      />
    )
  }

  const handleToggleMemorized = (id: string) => {
    const locus = locusStore.getState().loci.find((candidate) => candidate.id === id)
    if (!locus) return
    const nowMemorized = !locus.memorized
    void editLocus(locusStore, id, { memorized: nowMemorized })
    if (nowMemorized) void reward({ kind: 'verse', memorized: 1 })
  }

  const handleEdit = (id: string, changes: { front: string; back: string }) => {
    void editLocus(locusStore, id, changes)
  }

  const prefs: VerseStudyPrefs = {
    mode: preferences.verseMode,
    shuffle: preferences.verseShuffle,
    wordSpaces: preferences.verseWordSpaces,
  }
  const handlePrefsChange = (changes: Partial<VerseStudyPrefs>) => {
    void setPreferences(preferencesStore, {
      ...(changes.mode !== undefined ? { verseMode: changes.mode } : {}),
      ...(changes.shuffle !== undefined ? { verseShuffle: changes.shuffle } : {}),
      ...(changes.wordSpaces !== undefined ? { verseWordSpaces: changes.wordSpaces } : {}),
    })
  }

  return (
    <VerseStudy
      key={scope.kind === 'room' ? scope.roomId : scope.palaceId}
      verses={verses}
      title={scope.kind === 'room' ? (room?.title ?? '') : (palace?.name ?? '')}
      subtitle={scope.kind === 'room' ? palace?.name : t('verse.palaceScope')}
      prefs={prefs}
      onPrefsChange={handlePrefsChange}
      onBack={onBack ?? (() => {})}
      onToggleMemorized={handleToggleMemorized}
      onEditVerse={handleEdit}
    />
  )
}
