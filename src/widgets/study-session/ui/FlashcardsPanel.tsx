import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Check, MoreVertical } from 'lucide-react'
import type { FastOutcome } from '@/entities/card'
import type { LearningAlgorithm } from '@/entities/deck'
import type { StudyMode } from '@/entities/preferences'
import type { SrsState } from '@/shared/lib'
import { speak, speechAvailable, srsStatus, success, tick, useShake } from '@/shared/lib'
import {
  applyStudyFilter,
  buildStudyQueue,
  canUndo,
  currentId,
  initSession,
  sessionReducer,
  type StudyFilter,
  studyFilterCounts as computeFilterCounts,
  upcomingIds,
} from '@/features/review'
import {
  type FlashcardSwipeByMode,
  isGradeAction,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { IconButton, SessionHeader } from '@/shared/ui'
import { CardDraftSheet } from '@/widgets/content-editor'
import { studyFaces } from '../model/study-faces'
import { useStudySettings } from '../model/use-study-settings'
import { StudyDeck } from './StudyDeck'
import { EmptyQueue } from './EmptyQueue'
import { type RemainingTally, SessionFooter } from './SessionFooter'
import { GearSheet } from './GearSheet'
import { ModeSheet } from './ModeSheet'
import { QuickActionsSheet } from './QuickActionsSheet'
import type { QuickActionsModel } from './QuickActionRows'
import { CompletionOverlay } from './CompletionOverlay'
import type { CardChanges, Grade, SessionSummary, StudyCard, StudyPrefs } from '../model/types'

export interface FlashcardsPanelProps {
  cards: StudyCard[]
  prefs: StudyPrefs
  algorithm: LearningAlgorithm
  mode: StudyMode
  wordSpaces: boolean
  shakeToUndo: boolean
  swipeByMode: FlashcardSwipeByMode
  onPrefsChange?: (prefs: StudyPrefs) => void
  onSwipeByModeChange?: (config: FlashcardSwipeByMode) => void
  onModeChange?: (mode: StudyMode) => void
  onWordSpacesChange?: (value: boolean) => void
  onShakeToUndoChange?: (value: boolean) => void
  title: string
  subtitle?: string
  onGrade: (cardId: string, grade: Grade) => void
  onAnswer?: (cardId: string, outcome: FastOutcome) => void
  onRestoreCard?: (cardId: string, srs: SrsState | undefined) => void
  onToggleFlag?: (cardId: string) => void
  onEditCard?: (cardId: string, changes: CardChanges) => void
  onBack: () => void
  onComplete: (summary: SessionSummary) => void
  now?: number
}

const COMPLETE_DELAY_MS = 2200

type UndoEntry = { cardId: string; prevSrs: SrsState | undefined } | null

export function FlashcardsPanel({
  cards,
  prefs,
  algorithm,
  mode,
  wordSpaces,
  shakeToUndo,
  swipeByMode,
  onPrefsChange,
  onSwipeByModeChange,
  onModeChange,
  onWordSpacesChange,
  onShakeToUndoChange,
  title,
  subtitle,
  onGrade,
  onAnswer,
  onRestoreCard,
  onToggleFlag,
  onEditCard,
  onBack,
  onComplete,
  now = Date.now(),
}: FlashcardsPanelProps) {
  const { t } = useTranslation()
  const canSpeak = speechAvailable()

  const [filter, setStudyFilter] = useState<StudyFilter>({ kind: 'all' })
  const [gearOpen, setGearOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [editing, setEditing] = useState(false)

  const cardEntities = useMemo(() => cards.map((card) => card.card), [cards])
  const byId = useMemo(() => new Map(cards.map((card) => [card.card.id, card])), [cards])
  const filterCounts = useMemo(() => computeFilterCounts(cardEntities, now), [cardEntities, now])

  const settings = useStudySettings({
    mode,
    prefs,
    onPrefsChange,
    wordSpaces,
    onWordSpacesChange,
    shakeToUndo,
    onShakeToUndoChange,
    swipeByMode,
    onSwipeByModeChange,
    filter,
    filterCounts,
    onFilterChange: (next) => {
      setStudyFilter(next)
      rebuild(next)
    },
  })
  const activeSwipe = settings.value.swipe

  const buildIds = (activeFilter: StudyFilter): string[] =>
    buildStudyQueue(applyStudyFilter(cardEntities, activeFilter, now), {
      now,
      algorithm,
      shuffle: prefs.shuffle,
      newCardsPerDay: prefs.newCardsPerDay,
      maxCardsPerDay: prefs.maxCardsPerDay,
    })

  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    initSession({ ids: buildIds({ kind: 'all' }), mode: algorithm }),
  )

  const undoTrail = useRef<UndoEntry[]>([])

  const rebuild = (activeFilter: StudyFilter) => {
    undoTrail.current = []
    dispatch({
      type: 'reset',
      state: initSession({ ids: buildIds(activeFilter), mode: algorithm }),
    })
  }

  const completed = state.status === 'complete'
  const handedOff = useRef(false)
  const handoff = () => {
    if (handedOff.current || state.status !== 'complete') return
    handedOff.current = true
    onComplete({ graded: state.graded, learning: state.piles.learning, known: state.piles.known })
  }
  useEffect(() => {
    if (!completed) {
      handedOff.current = false
      return
    }
    success()
    const handle = window.setTimeout(handoff, COMPLETE_DELAY_MS)
    return () => window.clearTimeout(handle)
    // Completion fires once per run. `handoff` closes over the final tallies and guards itself with
    // a ref, so re-running on its identity would only restart the delay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed])

  const id = currentId(state)
  const card = id ? byId.get(id) : undefined
  const upcoming = upcomingIds(state, 2)
    .map((cardId) => byId.get(cardId))
    .filter((c): c is StudyCard => c !== undefined)
  const flipped = state.status !== 'complete' && state.flipped

  const canEdit = Boolean(onEditCard || onToggleFlag)

  const faces = card ? studyFaces(card.card, prefs.direction) : undefined
  const prompt = faces?.prompt ?? ''
  const answer = faces?.answer ?? ''

  // Speak on the events worth speaking on — arriving at a card, turning it over — not whenever the
  // text changes. On `prompt`/`answer` an edit mid-card would re-read it aloud.
  useEffect(() => {
    if (prefs.textToSpeech && card && !flipped) speak(prompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, prefs.textToSpeech])
  useEffect(() => {
    if (prefs.textToSpeech && card && flipped) speak(answer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped])

  useEffect(() => {
    dispatch({ type: 'unflip' })
  }, [mode])

  const applyGrade = (grade: Grade) => {
    if (!id || !card) return
    undoTrail.current.push({ cardId: id, prevSrs: card.card.srs })
    onGrade(id, grade)
    dispatch({ type: 'grade', grade })
  }

  const applyAnswer = (outcome: FastOutcome) => {
    if (!id || !card) return
    undoTrail.current.push({ cardId: id, prevSrs: card.card.srs })
    onAnswer?.(id, outcome)
    dispatch({ type: 'answer', outcome })
  }

  const applySkip = () => {
    if (!id) return
    undoTrail.current.push(null)
    dispatch({ type: 'skip' })
  }

  const handleUndo = () => {
    if (!canUndo(state)) return
    const entry = undoTrail.current.pop() ?? null
    dispatch({ type: 'undo' })
    if (entry) onRestoreCard?.(entry.cardId, entry.prevSrs)
    tick()
  }

  const handleFlag = () => {
    if (id && canEdit) onToggleFlag?.(id)
  }

  const handleCommit = (dir: SwipeDirection) => {
    const action = activeSwipe[dir]
    if (action === 'flag') handleFlag()
    else if (action === 'skip') applySkip()
    else if (isGradeAction(action)) applyGrade(action)
  }

  useShake(shakeToUndo && canUndo(state), handleUndo)

  const speakFace = () => {
    if (card) speak(flipped ? answer : prompt)
  }

  const changeMode = (nextMode: StudyMode) => {
    dispatch({ type: 'unflip' })
    onModeChange?.(nextMode)
  }

  const summaryNow: SessionSummary =
    state.status === 'complete'
      ? { graded: state.graded, learning: state.piles.learning, known: state.piles.known }
      : { graded: 0, learning: 0, known: 0 }

  const remaining = useMemo<RemainingTally>(() => {
    const tally: RemainingTally = { new: 0, learning: 0, known: 0 }
    if (state.status !== 'review') return tally
    for (const queuedId of state.queue) {
      const queued = byId.get(queuedId)
      if (queued) tally[srsStatus(queued.card.srs)] += 1
    }
    return tally
  }, [state, byId])

  const quick: QuickActionsModel = {
    flagged: Boolean(card?.card.flagged),
    canEdit,
    canSpeak,
    canUndo: canUndo(state),
    onUndo: handleUndo,
    onFlag: handleFlag,
    onEdit: () => setEditing(true),
    onSpeak: speakFace,
    onSkip: applySkip,
    onRestart: () => rebuild(filter),
  }

  return (
    <>
      <SessionHeader
        title={title}
        subtitle={subtitle}
        progress={{ done: state.graded, total: state.total }}
        backLabel={t('study.goBack')}
        onBack={onBack}
        action={
          card ? (
            <IconButton
              variant="glass"
              aria-label={t('study.options')}
              onClick={() => setGearOpen(true)}
            >
              <MoreVertical className="size-5" aria-hidden />
            </IconButton>
          ) : undefined
        }
      />

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-3">
        {card ? (
          <StudyDeck
            key={mode}
            card={card}
            cardStyle={prefs.cardStyle}
            upcoming={upcoming}
            mode={mode}
            direction={prefs.direction}
            wordSpaces={wordSpaces}
            typeInitialsOnly={settings.value.typeInitialsOnly}
            flipped={flipped}
            swipeConfig={activeSwipe}
            canSpeak={canSpeak}
            onFlip={() => dispatch({ type: 'flip' })}
            onReveal={() => dispatch({ type: 'reveal' })}
            onUnflip={() => dispatch({ type: 'unflip' })}
            onCommit={handleCommit}
            onSpeak={(text) => speak(text)}
            onChangeMode={() => setModeOpen(true)}
            onOpenGear={() => setGearOpen(true)}
            onLongPress={() => setQuickOpen(true)}
          />
        ) : !completed ? (
          <EmptyQueue
            filtered={filter.kind !== 'all'}
            onChangeSelection={() => setGearOpen(true)}
            onStudyAll={() => settings.set('filter', { kind: 'all' })}
            onDone={onBack}
          />
        ) : null}
      </div>

      {card ? (
        <SessionFooter
          flipped={flipped}
          mode={state.mode}
          srs={card.card.srs}
          now={now}
          remaining={remaining}
          buckets={state.buckets}
          onGrade={applyGrade}
          onAnswer={applyAnswer}
        />
      ) : null}

      {canEdit && onEditCard && card ? (
        <CardDraftSheet
          card={editing ? card.card : null}
          title={t('study.editTitle')}
          saveLabel={t('study.saveCard')}
          saveIcon={<Check className="size-4.5" aria-hidden />}
          onClose={() => setEditing(false)}
          onSave={(_id, changes) => onEditCard(card.card.id, changes)}
        />
      ) : null}

      {card ? (
        <GearSheet
          open={gearOpen}
          onClose={() => setGearOpen(false)}
          mode={mode}
          algorithm={algorithm}
          canSpeak={canSpeak}
          quick={quick}
          settings={settings}
          onFinish={() => dispatch({ type: 'finish' })}
        />
      ) : null}

      <ModeSheet
        open={modeOpen}
        onClose={() => setModeOpen(false)}
        mode={mode}
        onMode={changeMode}
      />

      {card ? (
        <QuickActionsSheet open={quickOpen} onClose={() => setQuickOpen(false)} {...quick} />
      ) : null}

      <AnimatePresence>
        {completed ? <CompletionOverlay summary={summaryNow} onDone={handoff} /> : null}
      </AnimatePresence>
    </>
  )
}
