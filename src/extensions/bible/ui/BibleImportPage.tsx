import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BookOpen, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { ROUTES } from '@/shared/config/routes'
import { nowIso, useDevMode } from '@/shared/lib'
import { selectCards, useCardStore } from '@/entities/card'
import { selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { selectFolders, useFolderStore } from '@/entities/folder'
import { AppScreen, Button, FooterBar, ScreenHeader, ToggleRow, PromptSheet } from '@/shared/ui'
import { useImportDraft } from '@/widgets/content-editor'
import { MoveSheet } from '@/widgets/deck-tree'
import { useBibleT } from '../i18n/use-bible-t'
import { formatPartial } from '../model/reference'
import { usePassagePicker } from '../model/use-passage-picker'
import { createStoredVerseSource, type StoredVerse } from '../model/verse-text'
import { useBibleVerseStore, useBibleVerseStoreApi } from '../model/context'
import { DEFAULT_TRANSLATION } from '../model/verse'
import { addVerseCards, type VerseTarget } from '../features/add-verse-cards'
import { buildVerseCards, canSplit, findDuplicates } from '../model/verse-cards'
import { publishVerses } from '../features/publish-verses'
import { versesFromCards } from '../model/verse-sources'
import { validateBibleImportSearch } from '../manifest'
import { BookPicker } from './BookPicker'
import { NumberGrid } from './NumberGrid'
import { TargetPicker } from './TargetPicker'
import { VerseTextPanel } from './VerseTextPanel'

export interface BibleImportPageProps {
  /** The deck the reader was already in, if they came from one. */
  deckId?: string
  onBack?: () => void
  onReview?: (deckId: string) => void
  onShowDeck?: (deckId: string) => void
}

/** The picker offers every deck: nothing here is being moved, so nothing is excluded. */
const EXCLUDE_NOTHING: ReadonlySet<string> = new Set()

/** Markers, not a plain join: a plain one would round-trip into a single card for the whole range. */
const prefillFrom = (verses: readonly StoredVerse[]): string =>
  verses.map((held) => `${held.verse}) ${held.text}`).join(' ')

export function BibleImportPage({ deckId, onBack, onReview, onShowDeck }: BibleImportPageProps) {
  const t = useBibleT()
  // The back label is core copy, not the extension's — one word, one place.
  const { t: core } = useTranslation()
  const picker = usePassagePicker()
  const deckStore = useDeckStoreApi()
  const decks = useDeckStore(selectDecks)
  const folders = useFolderStore(selectFolders)
  const cards = useCardStore(selectCards)
  const verses = useBibleVerseStore((state) => state.verses)
  const verseStore = useBibleVerseStoreApi()
  const devMode = useDevMode()
  const setDraft = useImportDraft((state) => state.setDraft)

  const [text, setText] = useState('')
  const [prefilled, setPrefilled] = useState(false)
  const [split, setSplit] = useState(true)
  const [keepDuplicates, setKeepDuplicates] = useState(false)
  const [auto, setAuto] = useState(!deckId)
  const [target, setTarget] = useState<VerseTarget>(
    deckId ? { kind: 'deck', deckId } : { kind: 'automatic' },
  )
  const [sheet, setSheet] = useState<'deck' | 'name' | null>(null)

  const { book, chapter, from, to, step, ref } = picker
  const breadcrumb = formatPartial({ book, chapter, from, to })
  const source = useMemo(() => createStoredVerseSource(verses), [verses])

  // Prefill only what the reader has not typed: their own text always wins.
  const untouched = text.trim().length === 0
  useEffect(() => {
    if (!ref || !untouched) return
    let live = true
    void source.read(ref).then((held) => {
      if (!live || held.length === 0) return
      setText(prefillFrom(held))
      setPrefilled(true)
    })
    return () => {
      live = false
    }
  }, [ref, source, untouched])

  const built = buildVerseCards(ref, text, { split })
  const held = useMemo(
    () => cards.map((card) => ({ front: card.front, deckId: card.deckId })),
    [cards],
  )
  const duplicates = findDuplicates(built, held)
  const addable = keepDuplicates
    ? built
    : built.filter((card) => !duplicates.some((entry) => entry.front === card.front))

  const spansRange = Boolean(from && to && to > from)
  const splitAvailable = canSplit(text)
  const chapterName = book && chapter ? `${book} ${chapter}` : ''
  const destination =
    target.kind === 'deck'
      ? (decks.find((deck) => deck.id === target.deckId)?.name ?? null)
      : target.kind === 'newDeck'
        ? target.name
        : null

  /** Dev-mode only: this is how the verse library is filled before a bundled translation exists. */
  const keep = async () => {
    const kept = await publishVerses(verseStore, versesFromCards(built, nowIso()))
    toast.success(t('kept', { count: kept }))
  }

  const add = async () => {
    const reviewIn = await addVerseCards(
      { deckStore, setDraft },
      { ref, text, split, target, held, keepDuplicates },
    )
    onReview?.(reviewIn)
  }

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('importTitle')} onBack={onBack} backLabel={core('common.back')} />
      }
      footer={
        <FooterBar>
          <Button
            size="lg"
            className="w-full"
            disabled={addable.length === 0}
            onClick={() => void add()}
          >
            <Sparkles className="size-4.5" aria-hidden />
            {t('addCount', { count: addable.length })}
          </Button>
        </FooterBar>
      }
    >
      <div className="mt-4 flex flex-col gap-5 pb-6">
        {breadcrumb ? (
          <p className="text-center text-title font-semibold tabular-nums text-heading">
            {breadcrumb}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={picker.startOver}>
            {t('startOver')}
          </Button>
          {step === 'done' ? (
            <Button variant="secondary" size="sm" onClick={picker.changeVerses}>
              {t('changeVerses')}
            </Button>
          ) : null}
        </div>

        {step === 'book' ? <BookPicker onPick={picker.pickBook} /> : null}
        {step === 'chapter' ? (
          <NumberGrid
            label={t('pickChapter')}
            values={picker.chapterOptions}
            onPick={picker.pickChapter}
          />
        ) : null}
        {step === 'from' ? (
          <NumberGrid
            label={t('pickStart')}
            values={picker.startOptions}
            onPick={picker.pickFrom}
          />
        ) : null}
        {step === 'to' && from ? (
          <NumberGrid
            label={t('pickEnd')}
            values={picker.endOptions}
            onPick={picker.pickTo}
            lead={{ label: t('justVerse', { verse: from }), onPick: () => picker.pickTo(from) }}
          />
        ) : null}

        <VerseTextPanel
          value={text}
          onChange={(next) => {
            setText(next)
            setPrefilled(false)
          }}
          prefilled={prefilled}
          note={step === 'done'}
          translation={DEFAULT_TRANSLATION}
          action={
            devMode && built.length > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => void keep()}>
                {t('keepText')}
              </Button>
            ) : null
          }
        />

        {spansRange ? (
          <ToggleRow
            label={t('split', { count: built.length || 2 })}
            description={splitAvailable ? undefined : t('splitUnavailable')}
            checked={split && splitAvailable}
            disabled={!splitAvailable}
            onChange={setSplit}
          />
        ) : null}

        {duplicates.length > 0 ? (
          <section className="flex flex-col gap-2 rounded-card bg-info-surface p-4">
            <p className="text-body font-semibold text-info-foreground">
              {t('duplicates', { refs: duplicates.map((entry) => entry.front).join(', ') })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onShowDeck?.(duplicates[0]!.deckId)}
              >
                <BookOpen className="size-4" aria-hidden />
                {t('showMe')}
              </Button>
              <ToggleRow
                surface="plain"
                label={t('duplicatesSkip')}
                checked={keepDuplicates}
                onChange={setKeepDuplicates}
              />
            </div>
          </section>
        ) : null}

        <TargetPicker
          auto={auto}
          onAutoChange={(next) => {
            setAuto(next)
            setTarget(next ? { kind: 'automatic' } : { kind: 'newDeck', name: chapterName })
          }}
          suggestedName={chapterName}
          destination={auto ? null : destination}
          onPickDeck={() => setSheet('deck')}
          onNameDeck={() => setSheet('name')}
        />
      </div>

      <MoveSheet
        open={sheet === 'deck'}
        onOpenChange={(open) => setSheet(open ? 'deck' : null)}
        title={t('pickDeck')}
        subtitle={t('targetHint')}
        targets="deck"
        decks={decks}
        folders={folders}
        excludeIds={EXCLUDE_NOTHING}
        onPick={(dest) => {
          if (dest.kind === 'deck') setTarget({ kind: 'deck', deckId: dest.deckId })
          setSheet(null)
        }}
      />

      <PromptSheet
        open={sheet === 'name'}
        onOpenChange={(open) => setSheet(open ? 'name' : null)}
        title={t('newDeckTitle')}
        fieldLabel={t('newDeckTitle')}
        initialValue={chapterName}
        confirmLabel={t('targetNew')}
        onSubmit={(name) => {
          setTarget({ kind: 'newDeck', name })
          setSheet(null)
        }}
      />
    </AppScreen>
  )
}

export function BibleImportScreen() {
  // Read through the manifest's own validator, so the route and the reader cannot drift. The
  // core `useRouteSearch` lives in `app`, which an extension may not import.
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const { deckId } = validateBibleImportSearch(search)
  const navigate = useNavigate()
  return (
    <BibleImportPage
      deckId={deckId}
      onBack={() => void navigate({ to: ROUTES.home })}
      onReview={(reviewIn) =>
        void navigate({ to: ROUTES.deckImport, params: { deckId: reviewIn }, replace: true })
      }
      onShowDeck={(held) => void navigate({ to: ROUTES.deckDetail, params: { deckId: held } })}
    />
  )
}
