import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Check, MoreVertical } from 'lucide-react'
import { type FastOutcome, type PriorAnswer, priorAnswer } from '@/entities/card'
import type { LearningAlgorithm } from '@/entities/deck'
import type { StudyMode } from '@/entities/preferences'
import { speak, speechAvailable, srsStatus, success, tick, useShake } from '@/shared/lib'
import {
  applyStudyFilter,
  buildStudyQueue,
  canUndo,
  currentId,
  initStudySession,
  studySessionReducer,
  type StudyFilter,
  studyFilterCounts as computeFilterCounts,
  upcomingIds,
} from '@/features/review'
import { isFastAction, isGradeAction, type TapZone } from '@/shared/config/flashcard-swipe'
import { CardScene, IconButton, StudySessionHeader } from '@/shared/ui'
import { CardDraftSheet } from '@/widgets/content-editor'
import { studyFaces } from '../model/study-faces'
import { useStudySettings } from '../model/use-study-settings'
import { StudyDeck } from './StudyDeck'
import { EmptyQueue } from './EmptyQueue'
import { type RemainingTally, StudySessionFooter } from './StudySessionFooter'
import { GearSheet } from './GearSheet'
import { ModeSheet } from './ModeSheet'
import { StudySessionSettingsSheet } from './StudySessionSettingsSheet'
import { QuickActionsSheet } from './QuickActionsSheet'
import type { QuickActionsModel } from './QuickActionRows'
import { CompletionOverlay } from './CompletionOverlay'
import type {
  CardChanges,
  DeckStudyPrefs,
  EditableDeckPref,
  Grade,
  LearnerStudyPrefs,
  SessionSummary,
  StudyCard,
} from '../model/types'

export interface FlashcardsPanelProps {
  cards: StudyCard[]
  deckPrefs: DeckStudyPrefs
  lockedPrefs?: readonly EditableDeckPref[]
  algorithm: LearningAlgorithm
  mode: StudyMode
  learnerPrefs: LearnerStudyPrefs
  onDeckPrefsChange?: (prefs: DeckStudyPrefs) => void
  onLearnerPrefsChange?: (changes: Partial<LearnerStudyPrefs>) => void
  onModeChange?: (mode: StudyMode) => void
  title: string
  subtitle?: string
  /** Starts the session on this card, wherever the daily limits would have put it. */
  startCardId?: string
  /** Opens the session on a narrower set — the flagged cards, say. */
  initialFilter?: StudyFilter
  onGrade: (cardId: string, grade: Grade) => void
  onAnswer?: (cardId: string, outcome: FastOutcome) => void
  onRestoreCard?: (cardId: string, prior: PriorAnswer) => void
  onToggleFlag?: (cardId: string) => void
  onEditCard?: (cardId: string, changes: CardChanges) => void
  onBack: () => void
  onComplete: (summary: SessionSummary) => void
  now?: number
}

const COMPLETE_DELAY_MS = 2200

type UndoEntry = { cardId: string; prior: PriorAnswer } | null

export function FlashcardsPanel({
  cards,
  deckPrefs,
  lockedPrefs,
  algorithm,
  mode,
  learnerPrefs,
  onDeckPrefsChange,
  onLearnerPrefsChange,
  onModeChange,
  title,
  subtitle,
  startCardId,
  initialFilter,
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

  const [filter, setStudyFilter] = useState<StudyFilter>(initialFilter ?? { kind: 'all' })
  const [gearOpen, setGearOpen] = useState(false)
  const [studySessionSettingsOpen, setStudySessionSettingsOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [editing, setEditing] = useState(false)

  const cardEntities = useMemo(() => cards.map((card) => card.card), [cards])
  const byId = useMemo(() => new Map(cards.map((card) => [card.card.id, card])), [cards])
  const filterCounts = useMemo(() => computeFilterCounts(cardEntities, now), [cardEntities, now])

  const settings = useStudySettings({
    mode,
    algorithm,
    deckPrefs,
    onDeckPrefsChange,
    lockedPrefs,
    learnerPrefs,
    onLearnerPrefsChange,
    filter,
    filterCounts,
    onFilterChange: (next) => {
      setStudyFilter(next)
      rebuild(next)
    },
  })
  const activeSwipe = settings.value.swipe

  /**
   * `seed` honours the card the session was opened on. Restarting keeps it —
   * the session is still "from that card" — but narrowing the filter mid-way
   * must not yank the learner back to it.
   */
  const buildIds = (activeFilter: StudyFilter, seed = false): string[] =>
    buildStudyQueue(applyStudyFilter(cardEntities, activeFilter, now), {
      now,
      algorithm,
      shuffle: deckPrefs.shuffle,
      newCardsPerDay: deckPrefs.newCardsPerDay,
      maxCardsPerDay: deckPrefs.maxCardsPerDay,
      startAt: seed ? startCardId : undefined,
    })

  const [state, dispatch] = useReducer(studySessionReducer, undefined, () =>
    initStudySession({ ids: buildIds(initialFilter ?? { kind: 'all' }, true), mode: algorithm }),
  )

  const undoTrail = useRef<UndoEntry[]>([])

  const rebuild = (activeFilter: StudyFilter, seed = false) => {
    undoTrail.current = []
    dispatch({
      type: 'reset',
      state: initStudySession({ ids: buildIds(activeFilter, seed), mode: algorithm }),
    })
  }

  const completed = state.status === 'complete'
  const handedOff = useRef(false)
  const tally = (): SessionSummary => ({
    graded: state.graded,
    learning: state.piles.learning,
    known: state.piles.known,
  })
  const handoff = () => {
    if (handedOff.current || state.status !== 'complete') return
    handedOff.current = true
    onComplete(tally())
  }
  /**
   * Leaving is not losing: every grade was saved as it was given, so a session the learner
   * walks out of after grading hands its tally over like a finished one. One that graded
   * nothing has nothing to hand over and just goes back.
   */
  const leave = () => {
    if (handedOff.current) return
    if (state.graded === 0) {
      onBack()
      return
    }
    handedOff.current = true
    onComplete(tally())
  }
  useEffect(() => {
    if (!completed) {
      handedOff.current = false
      return
    }
    success()
    const handle = window.setTimeout(handoff, COMPLETE_DELAY_MS)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed])

  const id = currentId(state)
  const card = id ? byId.get(id) : undefined
  const upcoming = upcomingIds(state, 2)
    .map((cardId) => byId.get(cardId))
    .filter((c): c is StudyCard => c !== undefined)
  const flipped = state.status !== 'complete' && state.flipped

  const canEdit = Boolean(onEditCard || onToggleFlag)

  const faces = card ? studyFaces(card.card, deckPrefs.direction) : undefined
  const prompt = faces?.prompt ?? ''
  const answer = faces?.answer ?? ''

  useEffect(() => {
    if (deckPrefs.textToSpeech && card && !flipped) speak(prompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, deckPrefs.textToSpeech])
  useEffect(() => {
    if (deckPrefs.textToSpeech && card && flipped) speak(answer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped])

  useEffect(() => {
    dispatch({ type: 'unflip' })
  }, [mode])

  const applyGrade = (grade: Grade) => {
    if (!id || !card) return
    undoTrail.current.push({ cardId: id, prior: priorAnswer(card.card) })
    onGrade(id, grade)
    dispatch({ type: 'grade', grade })
  }

  const applyAnswer = (outcome: FastOutcome) => {
    if (!id || !card) return
    undoTrail.current.push({ cardId: id, prior: priorAnswer(card.card) })
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
    if (entry) onRestoreCard?.(entry.cardId, entry.prior)
    tick()
  }

  const handleFlag = () => {
    if (id && canEdit) onToggleFlag?.(id)
  }

  /**
   * A swipe means what the Deck's algorithm can honour. The config is keyed by that algorithm, so
   * a Grade cannot reach a Fast review session, nor a Fast review answer a Spaced repetition one.
   */
  const handleCommit = (zone: TapZone) => {
    const action = activeSwipe[zone]
    if (action === 'flag') handleFlag()
    else if (action === 'skip') applySkip()
    else if (isGradeAction(action)) applyGrade(action)
    else if (isFastAction(action)) applyAnswer(action)
  }

  useShake(settings.value.shakeToUndo && canUndo(state), handleUndo)

  const speakFace = () => {
    if (card) speak(flipped ? answer : prompt)
  }

  const changeMode = (nextMode: StudyMode) => {
    dispatch({ type: 'unflip' })
    onModeChange?.(nextMode)
  }

  const summaryNow: SessionSummary =
    state.status === 'complete' ? tally() : { graded: 0, learning: 0, known: 0 }

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
    onRestart: () => rebuild(filter, true),
  }

  return (
    <>
      <CardScene style={deckPrefs.cardStyle} className="flex min-h-0 flex-1 flex-col">
        <StudySessionHeader
          title={title}
          subtitle={subtitle}
          progress={{ done: state.graded, total: state.total }}
          backLabel={t('study.goBack')}
          onBack={leave}
          action={
            card ? (
              <IconButton
                variant="glass"
                aria-label={t('study.studySessionSettingsTitle')}
                onClick={() => setStudySessionSettingsOpen(true)}
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
              cardStyle={deckPrefs.cardStyle}
              upcoming={upcoming}
              mode={mode}
              direction={deckPrefs.direction}
              wordSpaces={settings.value.wordSpaces}
              typeInitialsOnly={settings.value.typeInitialsOnly}
              flipped={flipped}
              swipeConfig={activeSwipe}
              input={settings.value.flashcardInput}
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
              onChangeSelection={() => setStudySessionSettingsOpen(true)}
              onStudyAll={() => settings.set('filter', { kind: 'all' })}
              onDone={leave}
            />
          ) : null}
        </div>

        {card ? (
          <StudySessionFooter
            flipped={flipped}
            mode={state.mode}
            srs={card.card.srs}
            now={now}
            remaining={remaining}
            buckets={state.buckets}
            onGrade={applyGrade}
            onAnswer={applyAnswer}
            onReveal={() => dispatch({ type: 'flip' })}
            onUndo={handleUndo}
            canUndo={canUndo(state)}
          />
        ) : null}
      </CardScene>

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
          quick={quick}
          settings={settings}
        />
      ) : null}

      <StudySessionSettingsSheet
        open={studySessionSettingsOpen}
        onClose={() => setStudySessionSettingsOpen(false)}
        algorithm={algorithm}
        canSpeak={canSpeak}
        settings={settings}
        onFinish={() => dispatch({ type: 'finish' })}
      />

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
