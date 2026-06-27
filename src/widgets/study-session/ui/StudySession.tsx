import { type ReactNode, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Layers,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  SkipForward,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react'
import { cn, speak, speechAvailable, success } from '@/shared/lib'
import { Button, GradeButtons, IconButton } from '@/shared/ui'
import {
  applyScope,
  currentId,
  initSession,
  nextId,
  orderIds,
  rangeBatches,
  type Scope,
  scopeCounts as computeScopeCounts,
  sessionProgress,
  sessionReducer,
  shuffleFirstDue,
} from '@/features/review'
import { StudyCardDeck, type SwipeAction } from './StudyCardDeck'
import { StudyOptionsSheet } from './StudyOptionsSheet'
import { QuickActionsSheet } from './QuickActionsSheet'
import { InStudyEditor } from './InStudyEditor'
import { CompletionOverlay } from './CompletionOverlay'
import type {
  Grade,
  LocusChanges,
  SessionSummary,
  StudyCard,
  StudyFeatures,
  StudyPrefs,
} from '../model/types'

export interface StudySessionProps {
  cards: StudyCard[]
  title: string
  subtitle?: string
  features?: Partial<StudyFeatures>
  initialPrefs?: Partial<StudyPrefs>
  /** Persist study-preference changes (the host mirrors them to palace settings). */
  onPrefsChange?: (prefs: StudyPrefs) => void
  onGrade: (locusId: string, grade: Grade) => void
  onToggleFlag?: (locusId: string) => void
  onEditCard?: (locusId: string, changes: LocusChanges) => void
  onBack: () => void
  onComplete: (summary: SessionSummary) => void
  now?: number
}

const DEFAULT_FEATURES: StudyFeatures = { browse: true, scope: true, edit: true, swipe: true }
const DEFAULT_PREFS: StudyPrefs = {
  mode: 'review',
  direction: 'front',
  order: 'inOrder',
  shuffle: false,
  textToSpeech: false,
  sortIntoPiles: false,
}
/** Linger on the completion overlay before handing back to the host. */
const COMPLETE_DELAY_MS = 2200

export function StudySession({
  cards,
  title,
  subtitle,
  features,
  initialPrefs,
  onPrefsChange,
  onGrade,
  onToggleFlag,
  onEditCard,
  onBack,
  onComplete,
  now = Date.now(),
}: StudySessionProps) {
  const { t } = useTranslation()
  const feature = { ...DEFAULT_FEATURES, ...features }
  const canSpeak = speechAvailable()

  const [prefs, setPrefs] = useState<StudyPrefs>({ ...DEFAULT_PREFS, ...initialPrefs })
  const [scope, setScope] = useState<Scope>({ kind: 'all' })
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [editing, setEditing] = useState(false)

  const loci = useMemo(() => cards.map((card) => card.locus), [cards])
  const byId = useMemo(() => new Map(cards.map((card) => [card.locus.id, card])), [cards])
  const counts = useMemo(() => computeScopeCounts(loci, now), [loci, now])
  const batches = useMemo(() => rangeBatches(loci.length), [loci.length])

  // Build the id list for a (mode, scope) pair. Review leads with due cards.
  const buildIds = (mode: 'review' | 'browse', activeScope: Scope): string[] => {
    const deck = applyScope(loci, activeScope, now)
    if (mode === 'review') return shuffleFirstDue(deck, now, prefs.shuffle)
    return orderIds(deck, prefs.shuffle ? 'shuffle' : prefs.order)
  }

  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    initSession({ mode: prefs.mode, ids: buildIds(prefs.mode, { kind: 'all' }) }),
  )

  const rebuild = (mode: 'review' | 'browse', activeScope: Scope) => {
    dispatch({ type: 'reset', state: initSession({ mode, ids: buildIds(mode, activeScope) }) })
  }

  // Hand back to the host exactly once — whether the overlay auto-advances or the
  // user taps Done — so navigation can't fire twice.
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
  const mode = state.status === 'browse' ? 'browse' : 'review'

  const canEdit = feature.edit && Boolean(onEditCard || onToggleFlag)
  const showPiles = state.status === 'review' && prefs.sortIntoPiles

  const prompt = card ? (prefs.direction === 'front' ? card.locus.front : card.locus.back) : ''
  const answer = card ? (prefs.direction === 'front' ? card.locus.back : card.locus.front) : ''

  // Auto-speak the visible face when text-to-speech is on: the prompt as the card
  // arrives, the answer when it flips. Deliberately keyed on `id`/`flipped` only.
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

  const handleCommit = (action: SwipeAction) => {
    if (action === 'up') {
      handleFlag()
      return
    }
    if (state.status === 'review') {
      if (action === 'right') handleGrade('good')
      else if (action === 'left') handleGrade('again')
      else dispatch({ type: 'skip' })
    } else if (state.status === 'browse') {
      if (action === 'right') dispatch({ type: 'browseNav', delta: -1 })
      else if (action === 'left') dispatch({ type: 'browseNav', delta: 1 })
      else dispatch({ type: 'skip' })
    }
  }

  const speakFace = () => {
    if (card) speak(flipped ? answer : prompt)
  }

  const updatePrefs = (partial: Partial<StudyPrefs>) => {
    const nextPrefs = { ...prefs, ...partial }
    setPrefs(nextPrefs)
    onPrefsChange?.(nextPrefs)
  }

  const changeScope = (nextScope: Scope) => {
    setScope(nextScope)
    rebuild(mode, nextScope)
  }

  // One options sheet, shared by the active session and the empty-scope screen.
  const optionsSheet = (
    <StudyOptionsSheet
      open={optionsOpen}
      onClose={() => setOptionsOpen(false)}
      mode={mode}
      scope={scope}
      scopeCounts={counts}
      batches={batches}
      direction={prefs.direction}
      order={prefs.order}
      shuffle={prefs.shuffle}
      textToSpeech={prefs.textToSpeech}
      sortIntoPiles={prefs.sortIntoPiles}
      canSpeak={canSpeak}
      allowBrowse={feature.browse}
      allowScope={feature.scope}
      onScope={changeScope}
      onMode={(nextMode) => {
        updatePrefs({ mode: nextMode })
        rebuild(nextMode, scope)
      }}
      onDirection={(direction) => updatePrefs({ direction })}
      onOrder={(order) => {
        updatePrefs({ order })
        if (mode === 'browse') rebuild('browse', scope)
      }}
      onShuffle={(value) => updatePrefs({ shuffle: value })}
      onTextToSpeech={(value) => updatePrefs({ textToSpeech: value })}
      onSortIntoPiles={(value) => updatePrefs({ sortIntoPiles: value })}
      onRestart={() => rebuild(mode, scope)}
      onFinish={() => dispatch({ type: 'finish' })}
    />
  )

  const summaryNow: SessionSummary =
    state.status === 'complete'
      ? { graded: state.graded, learning: state.piles.learning, known: state.piles.known }
      : { graded: 0, learning: 0, known: 0 }

  // A room with no authored cards: a real empty state, not a sample deck.
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="size-8 text-accent" aria-hidden />}
        heading={t('study.noCards')}
        body={t('study.noCardsHint', { room: title })}
        action={<Button onClick={onBack}>{t('study.backToRoom')}</Button>}
      />
    )
  }

  // The active scope matched nothing — don't dead-end.
  if (!card && !completed) {
    const emptyScope = scope.kind !== 'all'
    return (
      <EmptyState
        icon={<Sparkles className="size-8 text-[var(--rating)]" aria-hidden />}
        heading={emptyScope ? t('study.nothingSelected') : t('study.allCaughtUp')}
        body={emptyScope ? t('study.nothingSelectedHint') : t('study.allCaughtUpHint')}
        action={
          emptyScope ? (
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setOptionsOpen(true)}>
                {t('study.changeSelection')}
              </Button>
              <Button onClick={() => changeScope({ kind: 'all' })}>
                {t('study.studyAllCards')}
              </Button>
            </div>
          ) : (
            <Button onClick={onBack}>{t('study.done')}</Button>
          )
        }
      >
        {optionsSheet}
      </EmptyState>
    )
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-safe">
        <div className="mb-4 flex items-center justify-between pt-3">
          <IconButton variant="glass" aria-label={t('study.goBack')} onClick={onBack}>
            <ChevronLeft className="size-5" aria-hidden />
          </IconButton>
          <div className="mx-4 min-w-0 flex-1 text-center">
            <h1 className="truncate text-[length:var(--p-text-title)] font-semibold text-heading">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-[length:var(--p-text-label)]">{subtitle}</p>
            ) : null}
          </div>
          <IconButton
            variant="glass"
            aria-label={t('study.options')}
            onClick={() => setOptionsOpen(true)}
          >
            <MoreHorizontal className="size-5" aria-hidden />
          </IconButton>
        </div>

        {/* Mode + progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[length:var(--p-text-label)]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-heading">
              {mode === 'review' ? (
                <Zap className="size-3.5" aria-hidden />
              ) : (
                <BookOpen className="size-3.5" aria-hidden />
              )}
              {mode === 'review' ? t('study.review') : t('study.browse')}
            </span>
            <span className="font-medium text-muted-foreground">
              {state.status === 'review'
                ? t('study.reviewedCount', { graded: state.graded, total: state.total })
                : state.status === 'browse'
                  ? t('study.browseCount', { pos: state.pos + 1, total: state.ids.length })
                  : null}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary/30">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              animate={{ width: `${sessionProgress(state) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Tools or piles */}
      {card ? (
        showPiles ? (
          <div className="flex items-center justify-between px-5 pt-3">
            <PileChip
              tone="learning"
              count={state.status === 'review' ? state.piles.learning : 0}
              label={t('study.stillLearning')}
            />
            <p className="text-[length:var(--p-text-label)] font-medium text-muted-foreground">
              {t('study.swipeToSort')}
            </p>
            <PileChip
              tone="known"
              count={state.status === 'review' ? state.piles.known : 0}
              label={t('study.known')}
            />
          </div>
        ) : (
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
        )
      ) : null}

      {/* Card deck */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-3">
        {card ? (
          <StudyCardDeck
            card={card}
            nextCard={nextCard}
            direction={prefs.direction}
            flipped={flipped}
            mode={mode}
            swipeEnabled={feature.swipe}
            canSpeak={canSpeak}
            onFlip={() => dispatch({ type: 'flip' })}
            onCommit={handleCommit}
            onSpeak={(text) => speak(text)}
            onLongPress={() => setQuickOpen(true)}
          />
        ) : null}
      </div>

      {/* Footer */}
      {card ? (
        <div className="px-5 pb-7 pt-2">
          {mode === 'review' ? (
            showPiles ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  className="bg-[var(--warning-surface)] py-4 text-[var(--warning-foreground)]"
                  onClick={() => handleGrade('again')}
                >
                  <RotateCcw className="size-5" aria-hidden />
                  {t('study.stillLearning')}
                </Button>
                <Button
                  variant="secondary"
                  className="bg-[var(--success-surface)] py-4 text-[var(--success-on-surface)]"
                  onClick={() => handleGrade('good')}
                >
                  <Check className="size-5" aria-hidden />
                  {t('study.swipeGotIt')}
                </Button>
              </div>
            ) : flipped ? (
              <GradeButtons srs={card.locus.srs} now={now} onGrade={handleGrade} />
            ) : (
              <Button size="lg" className="w-full" onClick={() => dispatch({ type: 'flip' })}>
                <Eye className="size-5" aria-hidden />
                {t('study.showAnswer')}
              </Button>
            )
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4">
                <IconButton
                  variant="glass"
                  aria-label={t('study.prevCard')}
                  disabled={state.status === 'browse' && state.pos === 0}
                  onClick={() => dispatch({ type: 'browseNav', delta: -1 })}
                >
                  <ChevronLeft className="size-6" aria-hidden />
                </IconButton>
                <span className="min-w-[64px] text-center text-[length:var(--p-text-sub)] font-semibold text-heading">
                  {state.status === 'browse' ? `${state.pos + 1} / ${state.ids.length}` : ''}
                </span>
                <IconButton
                  variant="glass"
                  aria-label={t('study.nextCard')}
                  disabled={state.status === 'browse' && state.pos >= state.ids.length - 1}
                  onClick={() => dispatch({ type: 'browseNav', delta: 1 })}
                >
                  <ChevronRight className="size-6" aria-hidden />
                </IconButton>
              </div>
              <Button size="lg" className="w-full" onClick={() => dispatch({ type: 'finish' })}>
                <Check className="size-5" aria-hidden />
                {t('study.completeSession')}
              </Button>
            </div>
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
          onRestart={() => rebuild(mode, scope)}
        />
      ) : null}

      <AnimatePresence>
        {completed ? <CompletionOverlay summary={summaryNow} onDone={handoff} /> : null}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({
  icon,
  heading,
  body,
  action,
  children,
}: {
  icon: ReactNode
  heading: string
  body: string
  action: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="grid size-16 place-items-center rounded-card-featured bg-info-surface">
        {icon}
      </div>
      <div>
        <h2 className="mb-1 text-[length:var(--p-text-headline)] font-bold text-heading">
          {heading}
        </h2>
        <p className="mx-auto max-w-[34ch] text-[length:var(--p-text-body)]">{body}</p>
      </div>
      {action}
      {children}
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

function PileChip({
  tone,
  count,
  label,
}: {
  tone: 'learning' | 'known'
  count: number
  label: string
}) {
  const known = tone === 'known'
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5',
        known
          ? 'bg-[var(--success-surface)] text-[var(--success-on-surface)]'
          : 'bg-[var(--warning-surface)] text-[var(--warning-foreground)]',
      )}
    >
      <span
        className={cn(
          'flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[length:var(--p-text-label)] font-bold',
          known
            ? 'bg-[var(--success)] text-[var(--primary-foreground)]'
            : 'bg-[var(--warning)] text-[var(--warning-on-fill)]',
        )}
      >
        {count}
      </span>
      <span className="text-[length:var(--p-text-label)] font-semibold">{label}</span>
    </div>
  )
}
