import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { nowIso, selectIsReady, useDevMode } from '@/shared/lib'
import { useCardStore } from '@/entities/card'
import { selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { selectFolders, useFolderStore } from '@/entities/folder'
import {
  AppScreen,
  Button,
  FooterBar,
  PromptSheet,
  ScreenHeader,
  ScreenLoading,
  ToggleRow,
} from '@/shared/ui'
import { useImportDraft } from '@/widgets/content-editor'
import { MoveSheet } from '@/widgets/deck-tree'
import { useBibleT } from '../i18n/use-bible-t'
import { useBibleImport } from '../model/use-bible-import'
import { useBibleVerseStore, useBibleVerseStoreApi } from '../model/context'
import { DEFAULT_TRANSLATION } from '../model/verse'
import { versesFromCards } from '../model/verse-sources'
import { addVerseCards } from '../features/add-verse-cards'
import { publishVerses } from '../features/publish-verses'
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

export function BibleImportPage({ deckId, onBack, onReview, onShowDeck }: BibleImportPageProps) {
  const t = useBibleT()
  // The back label is core copy, not the extension's — one word, one place.
  const { t: core } = useTranslation()
  const state = useBibleImport(deckId)
  const { picker } = state
  // A local const, so the `to` step's lead pill narrows it instead of re-checking inside a closure.
  const from = picker.from

  const decks = useDeckStore(selectDecks)
  const folders = useFolderStore(selectFolders)
  const deckStore = useDeckStoreApi()
  const verseStore = useBibleVerseStoreApi()
  const setDraft = useImportDraft((draft) => draft.setDraft)
  const devMode = useDevMode()
  const [sheet, setSheet] = useState<'deck' | 'name' | null>(null)

  // Until all three have mirrored, "not in your library yet" and "0 duplicates" would both be
  // guesses dressed as facts, so the screen waits instead of saying them.
  const versesReady = useBibleVerseStore(selectIsReady)
  const cardsReady = useCardStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)

  /** Dev-mode only: this is how the verse library is filled before a bundled translation exists. */
  const keep = () => {
    void publishVerses(verseStore, versesFromCards(state.keepable, nowIso())).then(
      (kept) => toast.success(t('kept', { count: kept })),
      () => toast.error(t('keepFailed')),
    )
  }

  const add = () => {
    void addVerseCards(
      { deckStore, setDraft },
      {
        ref: picker.ref,
        text: state.text,
        split: state.split,
        target: state.target,
        held: state.held,
        keepDuplicates: state.keepDuplicates,
      },
    ).then(
      (reviewIn) => onReview?.(reviewIn),
      () => toast.error(t('addFailed')),
    )
  }

  if (!versesReady || !cardsReady || !decksReady) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('importTitle')} onBack={onBack} backLabel={core('common.back')} />
        }
      >
        <ScreenLoading />
      </AppScreen>
    )
  }

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('importTitle')} onBack={onBack} backLabel={core('common.back')} />
      }
      footer={
        <FooterBar>
          <Button size="lg" className="w-full" disabled={!state.canAdd} onClick={add}>
            <Sparkles className="size-4.5" aria-hidden />
            {t('addCount', { count: state.addable.length })}
          </Button>
        </FooterBar>
      }
    >
      <div className="mt-4 flex flex-col gap-5 pb-6">
        {state.breadcrumb ? (
          <p className="text-center text-title font-semibold tabular-nums text-heading">
            {state.breadcrumb}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={picker.startOver}>
            {t('startOver')}
          </Button>
          {picker.step === 'done' ? (
            <Button variant="secondary" size="sm" onClick={picker.changeVerses}>
              {t('changeVerses')}
            </Button>
          ) : null}
        </div>

        {picker.step === 'book' ? <BookPicker onPick={picker.pickBook} /> : null}
        {picker.step === 'chapter' ? (
          <NumberGrid
            label={t('pickChapter')}
            values={picker.chapterOptions}
            onPick={picker.pickChapter}
          />
        ) : null}
        {picker.step === 'from' ? (
          <NumberGrid
            label={t('pickStart')}
            values={picker.startOptions}
            onPick={picker.pickFrom}
          />
        ) : null}
        {picker.step === 'to' && from ? (
          <NumberGrid
            label={t('pickEnd')}
            values={picker.endOptions}
            onPick={picker.pickTo}
            lead={{ label: t('justVerse', { verse: from }), onPick: () => picker.pickTo(from) }}
          />
        ) : null}

        <VerseTextPanel
          value={state.text}
          onChange={state.setText}
          prefilled={state.prefilled}
          note={picker.step === 'done'}
          translation={DEFAULT_TRANSLATION}
          action={
            devMode && state.canKeep ? (
              <Button variant="secondary" size="sm" onClick={keep}>
                {t('keepText')}
              </Button>
            ) : null
          }
        />

        {state.spansRange ? (
          <ToggleRow
            label={t('split', { count: state.splitCount })}
            description={state.splitAvailable ? undefined : t('splitUnavailable')}
            checked={state.split && state.splitAvailable}
            disabled={!state.splitAvailable}
            onChange={state.setSplit}
          />
        ) : null}

        {state.duplicates.length > 0 ? (
          <section className="flex flex-col gap-2 rounded-card bg-info-surface p-4">
            <p className="text-body font-semibold text-info-foreground">
              {t('duplicates', { refs: state.duplicates.map((entry) => entry.front).join(', ') })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onShowDeck?.(state.duplicates[0]!.deckId)}
              >
                <BookOpen className="size-4" aria-hidden />
                {t('showMe')}
              </Button>
              <ToggleRow
                surface="plain"
                label={t('duplicatesSkip')}
                checked={state.keepDuplicates}
                onChange={state.setKeepDuplicates}
              />
            </div>
          </section>
        ) : null}

        <TargetPicker
          auto={state.auto}
          onAutoChange={state.setAuto}
          suggestedName={state.chapterName}
          destination={state.destination}
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
        onPick={(dest) => {
          if (dest.kind === 'deck') state.pickDeck(dest.deckId)
          setSheet(null)
        }}
      />

      <PromptSheet
        open={sheet === 'name'}
        onOpenChange={(open) => setSheet(open ? 'name' : null)}
        title={t('newDeckTitle')}
        fieldLabel={t('newDeckTitle')}
        initialValue={state.chapterName}
        confirmLabel={t('targetNew')}
        onSubmit={(name) => {
          state.nameDeck(name)
          setSheet(null)
        }}
      />
    </AppScreen>
  )
}
