import { type ReactNode, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Eye, Flag, Pencil, SkipForward, Sparkles, Volume2 } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import { cn, speak, speechAvailable, success } from '@/shared/lib'
import { Button, GradeButtons } from '@/shared/ui'
import {
  applyScope,
  currentId,
  initSession,
  nextId,
  type Scope,
  scopeCounts as computeScopeCounts,
  sessionProgress,
  sessionReducer,
  shuffleFirstDue,
} from '@/features/review'
import {
  type FlashcardSwipeConfig,
  isGradeAction,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { StudyCardDeck } from './StudyCardDeck'
import { RecallCard } from './RecallCard'
import { StudyOptionsSheet } from './StudyOptionsSheet'
import { ModeSheet } from './ModeSheet'
import { STUDY_MODE_META } from './mode-meta'
import { QuickActionsSheet } from './QuickActionsSheet'
import { InStudyEditor } from './InStudyEditor'
import { CompletionOverlay } from './CompletionOverlay'
import type { Grade, LocusChanges, SessionSummary, StudyCard, StudyPrefs } from '../model/types'

export interface FlashcardsPanelProps {
  cards: StudyCard[]
  prefs: StudyPrefs
  /** How each card's answer is recalled. Global preference; `flip` uses the swipeable deck. */
  mode: StudyMode
  /** Mark blanks for each hidden letter in Initials mode. Global preference. */
  wordSpaces: boolean
  swipeConfig: FlashcardSwipeConfig
  /** Persist study-preference changes (the host mirrors them to palace settings). */
  onPrefsChange?: (prefs: StudyPrefs) => void
  /** Persist the swipe map (the host mirrors it to global preferences). */
  onSwipeConfigChange?: (config: FlashcardSwipeConfig) => void
  /** Persist the recall mode (global preference). */
  onModeChange?: (mode: StudyMode) => void
  /** Persist the Initials word-spaces toggle (global preference). */
  onWordSpacesChange?: (value: boolean) => void
  onGrade: (locusId: string, grade: Grade) => void
  onToggleFlag?: (locusId: string) => void
  onEditCard?: (locusId: string, changes: LocusChanges) => void
  onBack: () => void
  onComplete: (summary: SessionSummary) => void
  /** The header's options button; the panel owns the sheet, the page owns the trigger. */
  optionsOpen: boolean
  onOptionsOpenChange: (open: boolean) => void
  now?: number
}

/** Linger on the completion overlay before handing back to the host. */
const COMPLETE_DELAY_MS = 2200

/** The study surface (ADR-0005): a spaced-review session over a scope's cards. Opens in review
 * (due cards lead); grading runs through the four-grade SM-2 control and the host's `gradeCard`
 * command so schedules survive offline. The recall `mode` decides how each card's answer is
 * worked — `flip` is the swipeable tap-to-reveal deck, the rest test the answer text first — but
 * every mode ends in the same grade. Headerless: the page owns the title and options trigger. */
export function FlashcardsPanel({
  cards,
  prefs,
  mode,
  wordSpaces,
  swipeConfig,
  onPrefsChange,
  onSwipeConfigChange,
  onModeChange,
  onWordSpacesChange,
  onGrade,
  onToggleFlag,
  onEditCard,
  onBack,
  onComplete,
  optionsOpen,
  onOptionsOpenChange,
  now = Date.now(),
}: FlashcardsPanelProps) {
  const { t } = useTranslation()
  const canSpeak = speechAvailable()
  const isFlip = mode === 'flip'

  const [scope, setScope] = useState<Scope>({ kind: 'all' })
  const [quickOpen, setQuickOpen] = useState(false)
  const [modeSheetOpen, setModeSheetOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  // Type mode's textarea is focused → the keyboard is up; collapse the tools row and progress
  // so the input, feedback, and grade control all fit above it.
  const [typing, setTyping] = useState(false)

  const loci = useMemo(() => cards.map((card) => card.locus), [cards])
  const byId = useMemo(() => new Map(cards.map((card) => [card.locus.id, card])), [cards])
  const counts = useMemo(() => computeScopeCounts(loci, now), [loci, now])

  // Build the review id list for a scope — due cards lead, optionally shuffled.
  const buildIds = (activeScope: Scope): string[] =>
    shuffleFirstDue(applyScope(loci, activeScope, now), now, prefs.shuffle)

  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    initSession({ ids: buildIds({ kind: 'all' }) }),
  )

  const rebuild = (activeScope: Scope) => {
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

  // The keyboard can't survive a card or mode change, so neither should the collapsed layout.
  useEffect(() => setTyping(false), [id, mode])

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

  const handleGrade = (grade: Grade) => {
    if (!id) return
    onGrade(id, grade)
    dispatch({ type: 'grade', grade })
  }

  const handleFlag = () => {
    if (id && canEdit) onToggleFlag?.(id)
  }

  // Map a committed swipe direction through the active config. `none` never reaches here — the
  // deck springs it back — so every direction here is a grade, a flag, or a skip.
  const handleCommit = (dir: SwipeDirection) => {
    const action = swipeConfig[dir]
    if (action === 'flag') handleFlag()
    else if (action === 'skip') dispatch({ type: 'skip' })
    else if (isGradeAction(action)) handleGrade(action)
  }

  const speakFace = () => {
    if (card) speak(flipped ? answer : prompt)
  }

  const updatePrefs = (partial: Partial<StudyPrefs>) => {
    const nextPrefs = { ...prefs, ...partial }
    onPrefsChange?.(nextPrefs)
  }

  const changeScope = (nextScope: Scope) => {
    setScope(nextScope)
    rebuild(nextScope)
  }

  const summaryNow: SessionSummary =
    state.status === 'complete'
      ? { graded: state.graded, learning: state.piles.learning, known: state.piles.known }
      : { graded: 0, learning: 0, known: 0 }

  const revealAnswer = () => dispatch({ type: isFlip ? 'flip' : 'reveal' })

  const optionsSheet = (
    <StudyOptionsSheet
      open={optionsOpen}
      onClose={() => onOptionsOpenChange(false)}
      scope={scope}
      scopeCounts={counts}
      mode={mode}
      direction={prefs.direction}
      shuffle={prefs.shuffle}
      textToSpeech={prefs.textToSpeech}
      canSpeak={canSpeak}
      swipeConfig={swipeConfig}
      onScope={changeScope}
      onDirection={(direction) => updatePrefs({ direction })}
      onShuffle={(value) => updatePrefs({ shuffle: value })}
      onTextToSpeech={(value) => updatePrefs({ textToSpeech: value })}
      onSwipe={(dir, action) => onSwipeConfigChange?.({ ...swipeConfig, [dir]: action })}
      onRestart={() => rebuild(scope)}
      onFinish={() => dispatch({ type: 'finish' })}
    />
  )

  const ModeIcon = STUDY_MODE_META[mode].Icon

  return (
    <>
      {/* The mode button: names the session's current mode and opens the mode sheet — the
          one always-visible way to switch how answers are recalled. Hidden while typing. */}
      {card && !typing ? (
        <div className="flex justify-center px-5 pt-1.5">
          <button
            type="button"
            onClick={() => setModeSheetOpen(true)}
            aria-label={t('study.changeMode')}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card-glass px-3.5 py-2 text-(length:--p-text-label) font-semibold text-heading transition-transform active:scale-[0.94]"
          >
            <ModeIcon className="size-4 text-primary" aria-hidden />
            {t(STUDY_MODE_META[mode].labelKey as never)}
            <ChevronDown className="size-3.5 text-faint" aria-hidden />
          </button>
        </div>
      ) : null}

      {/* Progress — hidden while typing to give the keyboard room. */}
      {card && !typing ? (
        <div className="space-y-2 px-5 pt-1">
          <p className="text-right text-[length:var(--p-text-label)] font-medium text-muted-foreground">
            {state.status === 'review'
              ? t('study.reviewedCount', { graded: state.graded, total: state.total })
              : null}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-secondary/30">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              animate={{ width: `${sessionProgress(state) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      ) : null}

      {/* Tools — hidden while typing to give the keyboard room. */}
      {card && !typing ? (
        <div className="flex items-center justify-center gap-2 px-5 pt-3">
          {canEdit ? (
            <ToolButton
              onClick={handleFlag}
              active={card.locus.flagged}
              icon={
                <Flag
                  className={cn(
                    'size-4',
                    card.locus.flagged && 'fill-[var(--rating)] text-[var(--rating-edge)]',
                  )}
                  aria-hidden
                />
              }
              label={card.locus.flagged ? t('study.flagged') : t('study.flag')}
            />
          ) : null}
          {canEdit && onEditCard ? (
            <ToolButton
              onClick={() => setEditing(true)}
              icon={<Pencil className="size-4" aria-hidden />}
              label={t('study.edit')}
            />
          ) : null}
          {canSpeak ? (
            <ToolButton
              onClick={speakFace}
              icon={<Volume2 className="size-4" aria-hidden />}
              label={t('study.listen')}
            />
          ) : null}
          <ToolButton
            onClick={() => dispatch({ type: 'skip' })}
            icon={<SkipForward className="size-4" aria-hidden />}
            label={t('study.skip')}
          />
        </div>
      ) : null}

      {/* Deck (flip) or recall card, or empty-scope state */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-3">
        {card ? (
          isFlip ? (
            <StudyCardDeck
              card={card}
              nextCard={nextCard}
              direction={prefs.direction}
              flipped={flipped}
              swipeConfig={swipeConfig}
              canSpeak={canSpeak}
              onFlip={() => dispatch({ type: 'flip' })}
              onCommit={handleCommit}
              onSpeak={(text) => speak(text)}
              onLongPress={() => setQuickOpen(true)}
            />
          ) : (
            <RecallCard
              key={`${mode}-${card.locus.id}`}
              card={card}
              mode={mode}
              direction={prefs.direction}
              wordSpaces={wordSpaces}
              revealed={flipped}
              canSpeak={canSpeak}
              onReveal={() => dispatch({ type: 'reveal' })}
              onSpeak={(text) => speak(text)}
              onInputFocusChange={setTyping}
            />
          )
        ) : !completed ? (
          <EmptyScope
            emptyScope={scope.kind !== 'all'}
            onChangeSelection={() => onOptionsOpenChange(true)}
            onStudyAll={() => changeScope({ kind: 'all' })}
            onDone={onBack}
          />
        ) : null}
      </div>

      {/* Footer */}
      {card ? (
        <div className="px-5 pb-7 pt-2">
          {flipped ? (
            <GradeButtons srs={card.locus.srs} now={now} onGrade={handleGrade} />
          ) : (
            <Button size="lg" className="w-full" onClick={revealAnswer}>
              <Eye className="size-5" aria-hidden />
              {t('study.showAnswer')}
            </Button>
          )}
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
        onClose={() => setModeSheetOpen(false)}
        mode={mode}
        wordSpaces={wordSpaces}
        onMode={(next) => onModeChange?.(next)}
        onWordSpaces={(value) => onWordSpacesChange?.(value)}
      />

      {card ? (
        <QuickActionsSheet
          open={quickOpen}
          onClose={() => setQuickOpen(false)}
          flagged={card.locus.flagged}
          canEdit={canEdit}
          canSpeak={canSpeak}
          onFlag={handleFlag}
          onEdit={() => setEditing(true)}
          onSpeak={speakFace}
          onSkip={() => dispatch({ type: 'skip' })}
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

function ToolButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[length:var(--p-text-label)] font-semibold transition-transform active:scale-[0.94]',
        active
          ? 'border-[var(--rating)] bg-[var(--warning-surface)] text-[var(--warning-foreground)]'
          : 'border-border bg-card-glass text-heading',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
