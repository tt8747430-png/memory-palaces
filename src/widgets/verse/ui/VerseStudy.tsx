import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lightbulb,
  Pencil,
  RotateCcw,
  Settings2,
  Shuffle,
  Sparkles,
  Type as TypeIcon,
  Volume2,
} from 'lucide-react'
import type { VerseMode } from '@/entities/preferences'
import {
  cancelSpeech,
  cn,
  isVerseMarker,
  scramble,
  speak,
  speechAvailable,
  tokenizeWords,
  typedVerseStatus,
  wordInitial,
} from '@/shared/lib'
import { Button, Chip, IconButton, Sheet, Switch, Textarea, TextField } from '@/shared/ui'

export interface VerseCard {
  id: string
  reference: string
  text: string
  memorized: boolean
}

export interface VerseStudyPrefs {
  mode: VerseMode
  shuffle: boolean
  wordSpaces: boolean
}

export interface VerseStudyProps {
  verses: VerseCard[]
  title: string
  subtitle?: string
  prefs: VerseStudyPrefs
  onPrefsChange: (changes: Partial<VerseStudyPrefs>) => void
  onBack: () => void
  onToggleMemorized: (id: string) => void
  onEditVerse: (id: string, data: { front: string; back: string }) => void
}

const MODES: { value: VerseMode; key: 'modeBlur' | 'modeWords' | 'modeInitials' | 'modeType' }[] = [
  { value: 'blur', key: 'modeBlur' },
  { value: 'words', key: 'modeWords' },
  { value: 'initials', key: 'modeInitials' },
  { value: 'type', key: 'modeType' },
]

/** Verse memorization: four recall modes (Blur / Words / Initials / Type) over a scope's
 * verses, with prev/next navigation, a memorized marker, read-aloud, inline editing, and a
 * settings sheet (shuffle order, word spaces). Each mode owns its own attempt state, reset
 * when the verse or mode changes (via the panel key). Prefs are owned by the host. */
export function VerseStudy({
  verses,
  title,
  subtitle,
  prefs,
  onPrefsChange,
  onBack,
  onToggleMemorized,
  onEditVerse,
}: VerseStudyProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editing, setEditing] = useState(false)

  const byId = useMemo(() => new Map(verses.map((verse) => [verse.id, verse])), [verses])

  // Display order of verse ids; reshuffled when the deck changes or shuffle toggles.
  const [order, setOrder] = useState<string[]>(() => verses.map((verse) => verse.id))
  useEffect(() => {
    const ids = verses.map((verse) => verse.id)
    setOrder(prefs.shuffle ? scramble(ids) : ids)
    setIndex((i) => Math.min(i, Math.max(0, ids.length - 1)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses.length, prefs.shuffle])

  const currentId = order[Math.min(index, Math.max(0, order.length - 1))]
  const current = currentId ? byId.get(currentId) : undefined
  const canSpeak = speechAvailable()

  useEffect(() => () => cancelSpeech(), [])
  useEffect(() => cancelSpeech(), [currentId, prefs.mode])

  if (verses.length === 0 || !current) {
    return (
      <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="grid size-16 place-items-center rounded-card-featured bg-info-surface">
          <TypeIcon className="size-8 text-accent" aria-hidden />
        </div>
        <div>
          <h2 className="mb-1 text-[length:var(--p-text-headline)] font-bold text-heading">
            {t('verse.empty')}
          </h2>
          <p className="mx-auto max-w-[34ch] text-[length:var(--p-text-body)]">
            {t('verse.emptyHint', { room: title })}
          </p>
        </div>
        <Button onClick={onBack}>{t('verse.back')}</Button>
      </div>
    )
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden">
      <div className="px-5 pt-safe">
        <div className="flex items-center justify-between gap-2 pt-3">
          <IconButton variant="glass" aria-label={t('verse.goBack')} onClick={onBack}>
            <ChevronLeft className="size-5" aria-hidden />
          </IconButton>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-[length:var(--p-text-title)] font-semibold text-heading">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-[length:var(--p-text-label)]">{subtitle}</p>
            ) : null}
          </div>
          <IconButton
            variant="glass"
            aria-label={t('verse.settings')}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="size-5" aria-hidden />
          </IconButton>
        </div>

        <div className="relative mt-4 flex items-center gap-1 rounded-card bg-info-surface p-1">
          {MODES.map(({ value, key }) => {
            const active = value === prefs.mode
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => onPrefsChange({ mode: value })}
                className="relative flex-1 rounded-control px-2 py-2.5 text-[length:var(--p-text-label)] font-semibold"
              >
                {active ? (
                  <motion.span
                    layoutId="verseModePill"
                    className="absolute inset-0 rounded-control bg-card shadow-rest"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span
                  className={cn('relative z-10', active ? 'text-heading' : 'text-muted-foreground')}
                >
                  {t(`verse.${key}`)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-3">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-card-featured border border-border bg-card-glass shadow-elevated">
          <div className="flex items-center justify-between gap-2 px-5 pt-4">
            <Chip className="min-w-0">
              <span className="truncate">{current.reference || t('verse.reference')}</span>
            </Chip>
            {current.memorized ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--success-surface)] px-2 py-1 text-[length:var(--p-text-tiny)] font-bold text-[var(--success-on-surface)]">
                <Check className="size-3" strokeWidth={3} aria-hidden />
                {t('verse.memorized')}
              </span>
            ) : null}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${prefs.mode}-${current.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {prefs.mode === 'blur' ? <BlurMode text={current.text} /> : null}
              {prefs.mode === 'words' ? <WordsMode text={current.text} /> : null}
              {prefs.mode === 'initials' ? (
                <InitialsMode text={current.text} wordSpaces={prefs.wordSpaces} />
              ) : null}
              {prefs.mode === 'type' ? <TypeMode text={current.text} /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-7 pt-1">
        <div className="flex items-center justify-center gap-2">
          <ToolPill
            onClick={() => onToggleMemorized(current.id)}
            active={current.memorized}
            icon={
              current.memorized ? (
                <CheckCircle2 className="size-4" aria-hidden />
              ) : (
                <Check className="size-4" aria-hidden />
              )
            }
            label={current.memorized ? t('verse.memorized') : t('verse.markMemorized')}
          />
          {canSpeak ? (
            <ToolPill
              onClick={() => speak(current.text)}
              icon={<Volume2 className="size-4" aria-hidden />}
              label={t('verse.listen')}
            />
          ) : null}
          <ToolPill
            onClick={() => setEditing(true)}
            icon={<Pencil className="size-4" aria-hidden />}
            label={t('verse.edit')}
          />
        </div>

        <div className="flex items-center justify-center gap-4">
          <IconButton
            variant="glass"
            aria-label={t('verse.prevVerse')}
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="size-6" aria-hidden />
          </IconButton>
          <span className="min-w-[64px] text-center text-[length:var(--p-text-sub)] font-semibold tabular-nums text-heading">
            {index + 1} / {order.length}
          </span>
          <IconButton
            variant="glass"
            aria-label={t('verse.nextVerse')}
            disabled={index >= order.length - 1}
            onClick={() => setIndex((i) => Math.min(order.length - 1, i + 1))}
          >
            <ChevronRight className="size-6" aria-hidden />
          </IconButton>
        </div>
      </div>

      <VerseSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        prefs={prefs}
        onPrefsChange={onPrefsChange}
        onEditVerse={() => {
          setSettingsOpen(false)
          setEditing(true)
        }}
      />

      <VerseEditorSheet
        open={editing}
        verse={current}
        onClose={() => setEditing(false)}
        onSave={(data) => {
          onEditVerse(current.id, data)
          setEditing(false)
        }}
      />
    </div>
  )
}

const PANEL = 'flex min-h-0 flex-1 flex-col'
const SCROLL = 'min-h-0 flex-1 overflow-y-auto scrollbar-hide'

function BlurMode({ text }: { text: string }) {
  const { t } = useTranslation()
  const tokens = useMemo(() => tokenizeWords(text), [text])
  const hideable = useMemo(
    () => tokens.flatMap((token, i) => (isVerseMarker(token) ? [] : [i])),
    [tokens],
  )
  const order = useMemo(() => scramble(hideable), [hideable])
  const step = Math.max(1, Math.round(order.length * 0.25))
  const [hiddenCount, setHiddenCount] = useState(0)
  const hidden = useMemo(() => new Set(order.slice(0, hiddenCount)), [order, hiddenCount])

  return (
    <div className={PANEL}>
      <div className={SCROLL}>
        <div className="flex min-h-full items-center justify-center px-6 py-6">
          <p className="allow-select flex w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-2 text-[clamp(17px,4.6vw,22px)] font-semibold leading-relaxed text-heading">
            {tokens.map((token, i) => {
              if (isVerseMarker(token)) {
                return (
                  <span key={i} className="font-bold text-accent">
                    {token}
                  </span>
                )
              }
              if (hidden.has(i)) {
                return (
                  <span
                    key={i}
                    aria-hidden
                    className="inline-block border-b-2 border-[color-mix(in_oklch,var(--primary)_35%,transparent)] align-baseline"
                    style={{ width: `${Math.min(Math.max(token.length, 1), 18)}ch` }}
                  />
                )
              }
              return (
                <span key={i} className="whitespace-nowrap">
                  {token}
                </span>
              )
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 px-5 pb-5">
        <Button
          size="lg"
          className="flex-1"
          disabled={hiddenCount >= order.length}
          onClick={() => setHiddenCount((c) => Math.min(order.length, c + step))}
        >
          <EyeOff className="size-5" aria-hidden />
          {t('verse.blur')}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          disabled={hiddenCount <= 0}
          onClick={() => setHiddenCount((c) => Math.max(0, c - step))}
        >
          <Eye className="size-5" aria-hidden />
          {t('verse.show')}
        </Button>
      </div>
    </div>
  )
}

interface WordChip {
  pos: number
  word: string
  key: string
}

function WordsMode({ text }: { text: string }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const words = useMemo(() => tokenizeWords(text), [text])
  const chips = useMemo<WordChip[]>(
    () => scramble(words.map((word, pos) => ({ pos, word, key: `${pos}-${word}` }))),
    [words],
  )
  const [placed, setPlaced] = useState(0)
  const [wrongKey, setWrongKey] = useState<string | null>(null)
  const done = placed >= words.length

  const tapChip = (chip: WordChip) => {
    if (chip.pos === placed) {
      setPlaced((p) => p + 1)
      setWrongKey(null)
    } else {
      setWrongKey(chip.key)
      window.setTimeout(() => setWrongKey((k) => (k === chip.key ? null : k)), 450)
    }
  }

  return (
    <div className={PANEL}>
      <div className={cn(SCROLL, 'px-5 py-4')}>
        <p className="min-h-[44px] text-balance text-center text-[clamp(16px,4.6vw,21px)] font-semibold leading-relaxed text-heading">
          {placed === 0 ? (
            <span className="text-[length:var(--p-text-body)] font-medium text-muted-foreground">
              {t('verse.tapFirst')}
            </span>
          ) : (
            words.slice(0, placed).join(' ')
          )}
        </p>

        {done ? (
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <Sparkles className="size-7 text-[var(--rating)]" aria-hidden />
            <p className="text-[length:var(--p-text-sub)] font-semibold text-heading">
              {t('verse.rebuilt')}
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {chips.map((chip) => {
              const used = chip.pos < placed
              const isWrong = wrongKey === chip.key
              return (
                <motion.button
                  key={chip.key}
                  type="button"
                  disabled={used}
                  onClick={() => !used && tapChip(chip)}
                  animate={isWrong && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-[length:var(--p-text-sub)] font-semibold transition-colors',
                    used
                      ? 'bg-info-surface text-muted-foreground opacity-40'
                      : isWrong
                        ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)] ring-2 ring-[var(--danger)]'
                        : 'bg-secondary/20 text-heading',
                  )}
                >
                  {chip.word}
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 px-5 pb-5">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => {
            setPlaced(0)
            setWrongKey(null)
          }}
        >
          <RotateCcw className="size-[17px]" aria-hidden />
          {t('verse.startOver')}
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-[var(--warning-surface)] text-[var(--warning-foreground)] shadow-none"
          disabled={done}
          onClick={() => setPlaced((p) => Math.min(words.length, p + 1))}
        >
          <Lightbulb className="size-[17px]" aria-hidden />
          {t('verse.hint')}
        </Button>
      </div>
    </div>
  )
}

function InitialsMode({ text, wordSpaces }: { text: string; wordSpaces: boolean }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const tokens = useMemo(() => tokenizeWords(text), [text])
  const [revealed, setRevealed] = useState(false)
  // The single cue currently peeked open (its full word floats above it). Tapping a cue toggles
  // it; tapping another moves the peek; tapping empty space or revealing the whole text clears it.
  const [peek, setPeek] = useState<number | null>(null)

  return (
    <div className={PANEL}>
      <div className={SCROLL} onClick={() => setPeek(null)}>
        <div className="flex min-h-full items-center justify-center px-6 py-6">
          {revealed ? (
            <p className="allow-select text-balance text-center text-[clamp(16px,4.4vw,21px)] font-medium leading-relaxed text-heading">
              {text}
            </p>
          ) : (
            <p
              className={cn(
                'flex w-full flex-wrap items-baseline justify-center gap-y-2.5 text-[clamp(17px,4.6vw,22px)] font-semibold text-heading',
                wordSpaces ? 'gap-x-3' : 'gap-x-2',
              )}
            >
              {tokens.map((token, i) => {
                if (isVerseMarker(token)) {
                  return (
                    <span key={i} className="font-bold text-accent">
                      {token}
                    </span>
                  )
                }
                const { lead, initial, hidden, trail } = wordInitial(token)
                const open = peek === i
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={t('verse.revealWord', { word: token })}
                    onClick={(event) => {
                      event.stopPropagation()
                      setPeek((current) => (current === i ? null : i))
                    }}
                    className={cn(
                      'relative -mx-0.5 whitespace-nowrap rounded-control px-0.5 transition-colors',
                      open ? 'bg-primary/10' : 'active:bg-primary/5',
                    )}
                  >
                    {lead}
                    <span className="font-bold">{initial}</span>
                    {wordSpaces && hidden > 0 ? (
                      <span
                        aria-hidden
                        className="ml-0.5 inline-block border-b-2 border-[color-mix(in_oklch,var(--primary)_40%,transparent)] align-baseline"
                        style={{ width: `${Math.min(Math.max(hidden, 1), 16)}ch` }}
                      />
                    ) : null}
                    {trail}
                    <AnimatePresence>
                      {open ? (
                        <motion.span
                          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                          className="absolute bottom-full left-1/2 z-20 mb-1.5 max-w-[70vw] -translate-x-1/2 rounded-control bg-primary px-2.5 py-1 text-[length:var(--p-text-label)] font-semibold text-primary-foreground shadow-elevated"
                        >
                          {token}
                          <span
                            aria-hidden
                            className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-primary"
                          />
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </button>
                )
              })}
            </p>
          )}
        </div>
      </div>
      <div className="px-5 pb-5">
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            setPeek(null)
            setRevealed((r) => !r)
          }}
        >
          {revealed ? (
            <EyeOff className="size-5" aria-hidden />
          ) : (
            <Eye className="size-5" aria-hidden />
          )}
          {revealed ? t('verse.hideText') : t('verse.showText')}
        </Button>
      </div>
    </div>
  )
}

function TypeMode({ text }: { text: string }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [revealed, setRevealed] = useState(false)
  const result = typedVerseStatus(text, value)

  return (
    <div className={PANEL}>
      <div className={cn(SCROLL, 'space-y-3 px-5 py-4')}>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t('verse.typePlaceholder')}
          rows={4}
          aria-label={t('verse.typePlaceholder')}
          className="w-full resize-none rounded-card border border-border bg-card px-4 py-3 text-[length:var(--p-text-body)] text-foreground placeholder:text-muted-foreground"
        />

        <div className="rounded-card border border-border bg-card px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[length:var(--p-text-tiny)] font-bold uppercase tracking-wide text-muted-foreground">
              {t('verse.feedback')}
            </p>
            <span className="text-[length:var(--p-text-label)] font-bold tabular-nums text-heading">
              {result.correct} / {result.total}
            </span>
          </div>
          {result.complete ? (
            <p className="inline-flex items-center gap-1.5 text-[length:var(--p-text-body)] font-semibold text-[var(--success-foreground)]">
              <Sparkles className="size-4" aria-hidden />
              {t('verse.wordPerfect')}
            </p>
          ) : revealed ? (
            <p className="allow-select text-[length:var(--p-text-body)] font-medium leading-relaxed text-heading">
              {text}
            </p>
          ) : result.typed.length === 0 ? (
            <p className="text-[length:var(--p-text-label)] text-muted-foreground">
              {t('verse.typeHint')}
            </p>
          ) : (
            <p className="flex flex-wrap gap-x-1.5 gap-y-1 text-[length:var(--p-text-body)] font-medium leading-relaxed">
              {result.typed.map((word, i) => (
                <span
                  key={i}
                  className={
                    result.statuses[i] === 'correct'
                      ? 'text-[var(--success-foreground)]'
                      : 'text-[var(--danger-on-surface)] line-through'
                  }
                >
                  {word}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-5 pb-5">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => {
            setValue('')
            setRevealed(false)
          }}
        >
          <RotateCcw className="size-[17px]" aria-hidden />
          {t('verse.startOver')}
        </Button>
        <Button variant="ghost" size="lg" className="flex-1" onClick={() => setRevealed((r) => !r)}>
          {revealed ? (
            <EyeOff className="size-[17px]" aria-hidden />
          ) : (
            <Eye className="size-[17px]" aria-hidden />
          )}
          {revealed ? t('verse.hideVerse') : t('verse.showVerse')}
        </Button>
      </div>
    </div>
  )
}

function ToolPill({
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
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[length:var(--p-text-label)] font-semibold transition-transform active:scale-[0.96]',
        active
          ? 'border-[var(--success)] bg-[var(--success-surface)] text-[var(--success-on-surface)]'
          : 'border-border bg-card-glass text-heading',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function VerseSettingsSheet({
  open,
  onClose,
  prefs,
  onPrefsChange,
  onEditVerse,
}: {
  open: boolean
  onClose: () => void
  prefs: VerseStudyPrefs
  onPrefsChange: (changes: Partial<VerseStudyPrefs>) => void
  onEditVerse: () => void
}) {
  const { t } = useTranslation()
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()} title={t('verse.settings')}>
      <div className="flex flex-col gap-2.5 pb-2">
        <SettingToggle
          icon={<Shuffle className="size-[18px]" aria-hidden />}
          label={t('verse.shuffleLabel')}
          description={t('verse.shuffleHint')}
          checked={prefs.shuffle}
          onChange={(value) => onPrefsChange({ shuffle: value })}
        />
        <SettingToggle
          icon={<TypeIcon className="size-[18px]" aria-hidden />}
          label={t('verse.wordSpacesLabel')}
          description={t('verse.wordSpacesHint')}
          checked={prefs.wordSpaces}
          onChange={(value) => onPrefsChange({ wordSpaces: value })}
        />
        <button
          type="button"
          onClick={onEditVerse}
          className="flex w-full items-center gap-3.5 rounded-card bg-info-surface px-4 py-3.5 text-left transition-transform active:scale-[0.99]"
        >
          <span className="text-primary">
            <Pencil className="size-[18px]" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
              {t('verse.editVerse')}
            </span>
            <span className="mt-0.5 block text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
              {t('verse.editVerseHint')}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-faint" aria-hidden />
        </button>
      </div>
    </Sheet>
  )
}

function SettingToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-info-surface px-4 py-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className="text-primary">{icon}</span>
        <span className="min-w-0">
          <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
            {label}
          </span>
          <span className="mt-0.5 block text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  )
}

function VerseEditorSheet({
  open,
  verse,
  onClose,
  onSave,
}: {
  open: boolean
  verse: VerseCard
  onClose: () => void
  onSave: (data: { front: string; back: string }) => void
}) {
  const { t } = useTranslation()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  useEffect(() => {
    if (open) {
      setFront(verse.reference)
      setBack(verse.text)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, verse.id])

  const valid = front.trim().length > 0 && back.trim().length > 0

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('verse.editVerse')}
      footer={
        <Button
          size="lg"
          className="w-full"
          disabled={!valid}
          onClick={() => valid && onSave({ front: front.trim(), back: back.trim() })}
        >
          <Check className="size-[18px]" aria-hidden />
          {t('verse.saveVerse')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <label className="block">
          <span className="mb-1.5 block text-[length:var(--p-text-label)] font-semibold text-heading">
            {t('verse.referenceLabel')}
          </span>
          <TextField
            value={front}
            onChange={(event) => setFront(event.target.value)}
            placeholder={t('verse.referencePlaceholder')}
            enterKeyHint="next"
            maxLength={80}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[length:var(--p-text-label)] font-semibold text-heading">
            {t('verse.textLabel')}
          </span>
          <Textarea
            value={back}
            onChange={(event) => setBack(event.target.value)}
            placeholder={t('verse.textPlaceholder')}
            rows={5}
          />
        </label>
      </div>
    </Sheet>
  )
}
