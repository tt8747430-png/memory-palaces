import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import { cn, speak, speechAvailable, srsStatus, success, tick, useShake } from '@/shared/lib'
import type { SrsState } from '@/shared/lib'
import { Button, GradeButtons } from '@/shared/ui'
import {
  applyScope,
  canUndo,
  currentId,
  initSession,
  nextId,
  type Scope,
  scopeCounts as computeScopeCounts,
  sessionReducer,
  shuffleFirstDue,
} from '@/features/review'
import {
  type FlashcardSwipeByMode,
  type FlashcardSwipeConfig,
  isGradeAction,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { StudyDeck } from './StudyDeck'
import { GearSheet } from './GearSheet'
import { ModeSheet } from './ModeSheet'
import { QuickActionsSheet } from './QuickActionsSheet'
import type { QuickActionsModel } from './QuickActionRows'
import { InStudyEditor } from './InStudyEditor'
import { CompletionOverlay } from './CompletionOverlay'
import type { Grade, CardChanges, SessionSummary, StudyCard, StudyPrefs } from '../model/types'

export interface FlashcardsPanelProps {
  cards: StudyCard[]
  prefs: StudyPrefs
  mode: StudyMode
  wordSpaces: boolean
  shakeToUndo: boolean
  swipeByMode: FlashcardSwipeByMode
  onPrefsChange?: (prefs: StudyPrefs) => void
  onSwipeByModeChange?: (config: FlashcardSwipeByMode) => void
  onModeChange?: (mode: StudyMode) => void
  onWordSpacesChange?: (value: boolean) => void
  onShakeToUndoChange?: (value: boolean) => void
  onGrade: (cardId: string, grade: Grade) => void
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
  mode,
  wordSpaces,
  shakeToUndo,
  swipeByMode,
  onPrefsChange,
  onSwipeByModeChange,
  onModeChange,
  onWordSpacesChange,
  onShakeToUndoChange,
  onGrade,
  onRestoreCard,
  onToggleFlag,
  onEditCard,
  onBack,
  onComplete,
  now = Date.now(),
}: FlashcardsPanelProps) {
  const canSpeak = speechAvailable()
  const reduce = useReducedMotion()
  const crossfade = { duration: reduce ? 0 : 0.12 }

  const [scope, setScope] = useState<Scope>({ kind: 'all' })
  const [gearOpen, setGearOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [typeInitialsOnly, setTypeInitialsOnly] = useState(false)

  const activeSwipe: FlashcardSwipeConfig = swipeByMode[mode]

  const cardEntities = useMemo(() => cards.map((card) => card.card), [cards])
  const byId = useMemo(() => new Map(cards.map((card) => [card.card.id, card])), [cards])
  const counts = useMemo(() => computeScopeCounts(cardEntities, now), [cardEntities, now])

  const buildIds = (activeScope: Scope): string[] =>
    shuffleFirstDue(applyScope(cardEntities, activeScope, now), now, prefs.shuffle)

  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    initSession({ ids: buildIds({ kind: 'all' }) }),
  )

  const undoTrail = useRef<UndoEntry[]>([])

  const rebuild = (activeScope: Scope) => {
    undoTrail.current = []
    dispatch({ type: 'reset', state: initSession({ ids: buildIds(activeScope) }) })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed])

  const id = currentId(state)
  const card = id ? byId.get(id) : undefined
  const next = nextId(state)
  const nextCard = next ? byId.get(next) : undefined
  const flipped = state.status !== 'complete' && state.flipped

  const canEdit = Boolean(onEditCard || onToggleFlag)

  const prompt = card ? (prefs.direction === 'front' ? card.card.front : card.card.back) : ''
  const answer = card ? (prefs.direction === 'front' ? card.card.back : card.card.front) : ''

  useEffect(() => {
    if (prefs.textToSpeech && card && !flipped) speak(prompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, prefs.textToSpeech])
  useEffect(() => {
    if (prefs.textToSpeech && card && flipped) speak(answer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped])

  // Every mode presents the card on its own front face, so a flip inherited from the mode you
  // left would land Type or Rebuild on the answer. Clearing it whenever the effective mode
  // changes holds even across the persisted-preference round-trip — not only the sheet handler.
  useEffect(() => {
    dispatch({ type: 'unflip' })
  }, [mode])

  const applyGrade = (grade: Grade) => {
    if (!id || !card) return
    undoTrail.current.push({ cardId: id, prevSrs: card.card.srs })
    onGrade(id, grade)
    dispatch({ type: 'grade', grade })
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

  const updatePrefs = (partial: Partial<StudyPrefs>) => {
    onPrefsChange?.({ ...prefs, ...partial })
  }

  const changeScope = (nextScope: Scope) => {
    setScope(nextScope)
    rebuild(nextScope)
  }

  // Each mode presents the card its own way, so it opens on its own face — a flip carried over
  // from the mode you left would land Type or Rebuild on the answer.
  const changeMode = (nextMode: StudyMode) => {
    dispatch({ type: 'unflip' })
    onModeChange?.(nextMode)
  }

  const setSwipe = (dir: SwipeDirection, action: FlashcardSwipeConfig[SwipeDirection]) => {
    onSwipeByModeChange?.({ ...swipeByMode, [mode]: { ...activeSwipe, [dir]: action } })
  }

  const summaryNow: SessionSummary =
    state.status === 'complete'
      ? { graded: state.graded, learning: state.piles.learning, known: state.piles.known }
      : { graded: 0, learning: 0, known: 0 }

  const remaining = useMemo(() => {
    const tally = { new: 0, learning: 0, known: 0 }
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
    onRestart: () => rebuild(scope),
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-3">
        {card ? (
          <StudyDeck
            key={`${mode}-${card.card.id}`}
            card={card}
            nextCard={nextCard}
            mode={mode}
            direction={prefs.direction}
            wordSpaces={wordSpaces}
            typeInitialsOnly={typeInitialsOnly}
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
          <EmptyScope
            emptyScope={scope.kind !== 'all'}
            onChangeSelection={() => setGearOpen(true)}
            onStudyAll={() => changeScope({ kind: 'all' })}
            onDone={onBack}
          />
        ) : null}
      </div>

      {card ? (
        <div className="shrink-0 border-t border-border/60 bg-card-glass px-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2.5">
          <div className="h-14">
            <AnimatePresence initial={false} mode="wait">
              {flipped ? (
                <motion.div
                  key="grade"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={crossfade}
                  className="h-full"
                >
                  <GradeButtons
                    className="h-full"
                    srs={card.card.srs}
                    now={now}
                    onGrade={applyGrade}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={crossfade}
                  className="flex h-full items-center justify-center"
                >
                  <RemainingCounts remaining={remaining} current={srsStatus(card.card.srs)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : null}

      {canEdit && onEditCard && card ? (
        <InStudyEditor
          open={editing}
          card={card.card}
          onClose={() => setEditing(false)}
          onSave={(changes) => onEditCard(card.card.id, changes)}
        />
      ) : null}

      {card ? (
        <GearSheet
          open={gearOpen}
          onClose={() => setGearOpen(false)}
          mode={mode}
          canSpeak={canSpeak}
          quick={quick}
          typeInitialsOnly={typeInitialsOnly}
          onTypeInitialsOnly={setTypeInitialsOnly}
          wordSpaces={wordSpaces}
          onWordSpaces={(value) => onWordSpacesChange?.(value)}
          swipeConfig={activeSwipe}
          onSwipe={setSwipe}
          scope={scope}
          scopeCounts={counts}
          onScope={changeScope}
          shuffle={prefs.shuffle}
          onShuffle={(value) => updatePrefs({ shuffle: value })}
          textToSpeech={prefs.textToSpeech}
          onTextToSpeech={(value) => updatePrefs({ textToSpeech: value })}
          shakeToUndo={shakeToUndo}
          onShakeToUndo={(value) => onShakeToUndoChange?.(value)}
          direction={prefs.direction}
          onDirection={(direction) => updatePrefs({ direction })}
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

function EmptyScope({
  emptyScope,
  onChangeSelection,
  onStudyAll,
  onDone,
}: {
  emptyScope: boolean
  onChangeSelection: () => void
  onStudyAll: () => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-5 px-1 text-center">
      <div className="grid size-16 place-items-center rounded-card-featured bg-info-surface">
        <Sparkles className="size-8 text-[var(--rating)]" aria-hidden />
      </div>
      <div>
        <h2 className="mb-1 text-[length:var(--p-text-headline)] font-bold text-heading">
          {emptyScope ? t('study.nothingSelected') : t('study.allCaughtUp')}
        </h2>
        <p className="mx-auto max-w-[34ch] text-[length:var(--p-text-body)]">
          {emptyScope ? t('study.nothingSelectedHint') : t('study.allCaughtUpHint')}
        </p>
      </div>
      {emptyScope ? (
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onChangeSelection}>
            {t('study.changeSelection')}
          </Button>
          <Button onClick={onStudyAll}>{t('study.studyAllCards')}</Button>
        </div>
      ) : (
        <Button onClick={onDone}>{t('study.done')}</Button>
      )}
    </div>
  )
}

const COUNT_CHIP: Record<'new' | 'learning' | 'known', string> = {
  new: 'bg-info-surface text-info-foreground',
  learning: 'bg-secondary text-secondary-foreground',
  known: 'bg-[var(--success-surface)] text-[var(--success-on-surface)]',
}

function RemainingCounts({
  remaining,
  current,
}: {
  remaining: Record<'new' | 'learning' | 'known', number>
  current?: 'new' | 'learning' | 'known'
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center gap-2">
      {(['new', 'learning', 'known'] as const).map((key) => (
        <span
          key={key}
          className={cn(
            'inline-flex items-baseline gap-1.5 rounded-pill px-3 py-1.5 text-(length:--p-text-label) font-bold tabular-nums',
            COUNT_CHIP[key],
            current === key && 'ring-2 ring-(--ring)/30',
          )}
        >
          {remaining[key]}
          <span className="font-medium">{t(`srs.${key}` as never)}</span>
        </span>
      ))}
    </div>
  )
}
