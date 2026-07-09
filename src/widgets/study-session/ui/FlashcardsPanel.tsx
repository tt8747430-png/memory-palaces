import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
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
  type FlashcardSwipeConfig,
  isGradeAction,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { StudyDeck } from './StudyDeck'
import { StudyOptionsSheet } from './StudyOptionsSheet'
import { ModeSheet } from './ModeSheet'
import { QuickActionsSheet } from './QuickActionsSheet'
import { InStudyEditor } from './InStudyEditor'
import { CompletionOverlay } from './CompletionOverlay'
import type { Grade, LocusChanges, SessionSummary, StudyCard, StudyPrefs } from '../model/types'

export interface FlashcardsPanelProps {
  cards: StudyCard[]
  prefs: StudyPrefs
  /** How each card's answer is recalled. Global preference, resumed across sessions. */
  mode: StudyMode
  /** Mark blanks for each hidden letter in Initials mode. Global preference. */
  wordSpaces: boolean
  /** Shake the device to undo the last graded card. Global preference. */
  shakeToUndo: boolean
  swipeConfig: FlashcardSwipeConfig
  /** Persist study-preference changes (the host mirrors them to palace settings). */
  onPrefsChange?: (prefs: StudyPrefs) => void
  /** Persist the swipe map (the host mirrors it to global preferences). */
  onSwipeConfigChange?: (config: FlashcardSwipeConfig) => void
  /** Persist the recall mode (global preference). */
  onModeChange?: (mode: StudyMode) => void
  /** Persist the Initials word-spaces toggle (global preference). */
  onWordSpacesChange?: (value: boolean) => void
  /** Persist the shake-to-undo toggle (global preference). */
  onShakeToUndoChange?: (value: boolean) => void
  onGrade: (locusId: string, grade: Grade) => void
  /** Reverse a grade's SRS write on undo, restoring the card's prior schedule. */
  onRestoreCard?: (locusId: string, srs: SrsState | undefined) => void
  onToggleFlag?: (locusId: string) => void
  onEditCard?: (locusId: string, changes: LocusChanges) => void
  onBack: () => void
  onComplete: (summary: SessionSummary) => void
  /** The header's options button; the panel owns the sheet, the page owns the trigger. */
  optionsOpen: boolean
  onOptionsOpenChange: (open: boolean) => void
  /** The header's mode button; same split — the panel owns the mode sheet. */
  modeSheetOpen: boolean
  onModeSheetOpenChange: (open: boolean) => void
  now?: number
}

/** Linger on the completion overlay before handing back to the host. */
const COMPLETE_DELAY_MS = 2200

/** The undo trail parallel to the session machine's history — one entry per grade/skip. A
 * grade remembers the card's prior schedule so undo can reverse the SRS write; a skip has
 * nothing to reverse. Popped in lockstep with the machine's `undo`. */
type UndoEntry = { locusId: string; prevSrs: SrsState | undefined } | null

/** The study surface (ADR-0005): a spaced-review session over a scope's cards. Opens in review
 * (due cards lead); grading runs through the four-grade SM-2 control and the host's `gradeCard`
 * command so schedules survive offline. Every mode is the same two-faced `StudyDeck` — tap to
 * flip, swipe to grade — differing only in how its back tests the answer. Headerless: the page
 * owns the title, mode, and options triggers. */
export function FlashcardsPanel({
  cards,
  prefs,
  mode,
  wordSpaces,
  shakeToUndo,
  swipeConfig,
  onPrefsChange,
  onSwipeConfigChange,
  onModeChange,
  onWordSpacesChange,
  onShakeToUndoChange,
  onGrade,
  onRestoreCard,
  onToggleFlag,
  onEditCard,
  onBack,
  onComplete,
  optionsOpen,
  onOptionsOpenChange,
  modeSheetOpen,
  onModeSheetOpenChange,
  now = Date.now(),
}: FlashcardsPanelProps) {
  const canSpeak = speechAvailable()

  const [scope, setScope] = useState<Scope>({ kind: 'all' })
  const [quickOpen, setQuickOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  // Type mode's aid (full text vs first letters). Session-scoped on purpose: it's a way of
  // working a card, not a lasting preference.
  const [typeInitialsOnly, setTypeInitialsOnly] = useState(false)

  const loci = useMemo(() => cards.map((card) => card.locus), [cards])
  const byId = useMemo(() => new Map(cards.map((card) => [card.locus.id, card])), [cards])
  const counts = useMemo(() => computeScopeCounts(loci, now), [loci, now])

  // Build the review id list for a scope — due cards lead, optionally shuffled.
  const buildIds = (activeScope: Scope): string[] =>
    shuffleFirstDue(applyScope(loci, activeScope, now), now, prefs.shuffle)

  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    initSession({ ids: buildIds({ kind: 'all' }) }),
  )

  // The undo trail (card + prior schedule per grade), reset whenever the queue is rebuilt.
  const undoTrail = useRef<UndoEntry[]>([])

  // A mode switch resets the card to its front face — e.g. a revealed Blur card must not
  // land in Rebuild already flipped. Render-phase adjustment, so the old face never paints.
  const [prevMode, setPrevMode] = useState(mode)
  if (prevMode !== mode) {
    setPrevMode(mode)
    dispatch({ type: 'unflip' })
  }

  const rebuild = (activeScope: Scope) => {
    undoTrail.current = []
    dispatch({ type: 'reset', state: initSession({ ids: buildIds(activeScope) }) })
  }

  // Hand back to the host exactly once — whether the overlay auto-advances or the user taps
  // Done — so navigation can't fire twice.
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

  const prompt = card ? (prefs.direction === 'front' ? card.locus.front : card.locus.back) : ''
  const answer = card ? (prefs.direction === 'front' ? card.locus.back : card.locus.front) : ''

  // Auto-speak the visible face when text-to-speech is on: the prompt as the card arrives, the
  // answer when it flips. Deliberately keyed on `id`/`flipped` only.
  useEffect(() => {
    if (prefs.textToSpeech && card && !flipped) speak(prompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, prefs.textToSpeech])
  useEffect(() => {
    if (prefs.textToSpeech && card && flipped) speak(answer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped])

  const applyGrade = (grade: Grade) => {
    if (!id || !card) return
    undoTrail.current.push({ locusId: id, prevSrs: card.locus.srs })
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
    if (entry) onRestoreCard?.(entry.locusId, entry.prevSrs)
    tick()
  }

  const handleFlag = () => {
    if (id && canEdit) onToggleFlag?.(id)
  }

  // Map a committed swipe direction through the active config. `none` never reaches here — the
  // deck springs it back — so every direction here is a grade, a flag, or a skip.
  const handleCommit = (dir: SwipeDirection) => {
    const action = swipeConfig[dir]
    if (action === 'flag') handleFlag()
    else if (action === 'skip') applySkip()
    else if (isGradeAction(action)) applyGrade(action)
  }

  // Shake to undo — only while it's on and there's history to reverse (and never on desktop,
  // where the hook is inert). The visible Undo in quick actions is always the reliable path.
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

  const summaryNow: SessionSummary =
    state.status === 'complete'
      ? { graded: state.graded, learning: state.piles.learning, known: state.piles.known }
      : { graded: 0, learning: 0, known: 0 }

  // How many new / learning / known cards are still ahead in this session (the head of the
  // queue is the active card) — the footer's at-a-glance overview before a reveal.
  const remaining = useMemo(() => {
    const tally = { new: 0, learning: 0, known: 0 }
    if (state.status !== 'review') return tally
    for (const queuedId of state.queue) {
      const queued = byId.get(queuedId)
      if (queued) tally[srsStatus(queued.locus.srs)] += 1
    }
    return tally
  }, [state, byId])

  const optionsSheet = (
    <StudyOptionsSheet
      open={optionsOpen}
      onClose={() => onOptionsOpenChange(false)}
      scope={scope}
      scopeCounts={counts}
      direction={prefs.direction}
      shuffle={prefs.shuffle}
      textToSpeech={prefs.textToSpeech}
      shakeToUndo={shakeToUndo}
      canSpeak={canSpeak}
      swipeConfig={swipeConfig}
      onScope={changeScope}
      onDirection={(direction) => updatePrefs({ direction })}
      onShuffle={(value) => updatePrefs({ shuffle: value })}
      onTextToSpeech={(value) => updatePrefs({ textToSpeech: value })}
      onShakeToUndo={(value) => onShakeToUndoChange?.(value)}
      onSwipe={(dir, action) => onSwipeConfigChange?.({ ...swipeConfig, [dir]: action })}
      onRestart={() => rebuild(scope)}
      onFinish={() => dispatch({ type: 'finish' })}
      onEditCard={canEdit && onEditCard && card ? () => setEditing(true) : undefined}
    />
  )

  return (
    <>
      {/* The study deck, or the empty-scope state */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-3">
        {card ? (
          <StudyDeck
            key={`${mode}-${card.locus.id}`}
            card={card}
            nextCard={nextCard}
            mode={mode}
            direction={prefs.direction}
            wordSpaces={wordSpaces}
            typeInitialsOnly={typeInitialsOnly}
            flipped={flipped}
            swipeConfig={swipeConfig}
            canSpeak={canSpeak}
            onFlip={() => dispatch({ type: 'flip' })}
            onReveal={() => dispatch({ type: 'reveal' })}
            onCommit={handleCommit}
            onSpeak={(text) => speak(text)}
            onWordSpaces={(value) => onWordSpacesChange?.(value)}
            onTypeInitialsOnly={setTypeInitialsOnly}
            onLongPress={() => setQuickOpen(true)}
          />
        ) : !completed ? (
          <EmptyScope
            emptyScope={scope.kind !== 'all'}
            onChangeSelection={() => onOptionsOpenChange(true)}
            onStudyAll={() => changeScope({ kind: 'all' })}
            onDone={onBack}
          />
        ) : null}
      </div>

      {/* The controls bar. Fixed-height by design: before the reveal it stacks the
          remaining-queue overview over the current status; after it, the grade control takes
          the whole slot. The two states crossfade in place — the bar never grows or jumps. */}
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
                  transition={{ duration: 0.12 }}
                  className="h-full"
                >
                  <GradeButtons
                    className="h-full"
                    srs={card.locus.srs}
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
                  transition={{ duration: 0.12 }}
                  className="flex h-full items-center justify-center"
                >
                  <RemainingCounts remaining={remaining} current={srsStatus(card.locus.srs)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : null}

      {/* In-study editor */}
      {canEdit && onEditCard && card ? (
        <InStudyEditor
          open={editing}
          locus={card.locus}
          onClose={() => setEditing(false)}
          onSave={(changes) => onEditCard(card.locus.id, changes)}
        />
      ) : null}

      {optionsSheet}

      <ModeSheet
        open={modeSheetOpen}
        onClose={() => onModeSheetOpenChange(false)}
        mode={mode}
        onMode={(nextMode) => onModeChange?.(nextMode)}
      />

      {card ? (
        <QuickActionsSheet
          open={quickOpen}
          onClose={() => setQuickOpen(false)}
          flagged={card.locus.flagged}
          canEdit={canEdit}
          canSpeak={canSpeak}
          canUndo={canUndo(state)}
          onUndo={handleUndo}
          onFlag={handleFlag}
          onEdit={() => setEditing(true)}
          onSpeak={speakFace}
          onSkip={applySkip}
          onRestart={() => rebuild(scope)}
        />
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

/** The remaining-queue overview shown before a reveal: how many new / learning / known
 * cards are still ahead in this session, the current card's bucket ringed. Uses the same
 * tint vocabulary as the SRS status chips so color never means two things. */
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
