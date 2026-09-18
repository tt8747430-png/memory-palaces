import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import {
  AppScreen,
  Button,
  FooterBar,
  PromptSheet,
  ScreenHeader,
  ScreenLoading,
  ToggleRow,
} from '@/shared/ui'
import { DestinationSheet } from '@/widgets/deck-tree'
import { useBibleT } from '../i18n/use-bible-t'
import { useBibleImport } from '../model/use-bible-import'
import { BookPicker } from './BookPicker'
import { DuplicatesBanner } from './DuplicatesBanner'
import { NumberGrid } from './NumberGrid'
import { TargetPicker } from './TargetPicker'
import { VerseTextPanel } from './VerseTextPanel'

export interface BibleImportPageProps {
  /** The deck the learner was already in, if they came from one. */
  deckId?: string
  onBack?: () => void
  onReview?: (deckId: string) => void
  onShowDeck?: (deckId: string) => void
}

export function BibleImportPage({ deckId, onBack, onReview, onShowDeck }: BibleImportPageProps) {
  const t = useBibleT()
  // The back label is core copy, not the extension's — one word, one place.
  const { t: core } = useTranslation()
  const page = useBibleImport(deckId, (reviewIn) => onReview?.(reviewIn))
  const { picker } = page
  // A local const, so the `to` step's lead pill narrows it instead of re-checking inside a closure.
  const from = picker.from

  const header = (
    <ScreenHeader title={t('importTitle')} onBack={onBack} backLabel={core('common.back')} />
  )

  // Until every store has mirrored, "no saved text" and "0 duplicates" would both be
  // guesses dressed as facts, so the screen waits instead of saying them.
  if (!page.ready) {
    return (
      <AppScreen header={header}>
        <ScreenLoading />
      </AppScreen>
    )
  }

  return (
    <AppScreen
      fill
      header={header}
      footer={
        <FooterBar>
          <Button size="lg" className="w-full" disabled={!page.canAdd} onClick={page.add}>
            <Sparkles className="size-4.5" aria-hidden />
            {t('addCount', { count: page.addable.length })}
          </Button>
        </FooterBar>
      }
    >
      <div className="mt-4 flex flex-col gap-5 pb-6">
        {page.breadcrumb ? (
          <p className="text-center text-title font-semibold tabular-nums text-heading">
            {page.breadcrumb}
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

        {picker.step === 'book' ? (
          <BookPicker onPick={picker.pickBook} isPickable={page.isBookPickable} />
        ) : null}
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
          value={page.text}
          onChange={page.setText}
          prefilled={page.prefilled}
          note={picker.step === 'done'}
          translation={page.translation}
          action={
            page.keepOffered ? (
              <Button variant="secondary" size="sm" onClick={page.keep}>
                {t('keepText')}
              </Button>
            ) : null
          }
        />

        {page.spansRange ? (
          <ToggleRow
            label={t('split', { count: page.splitCount })}
            description={page.splitAvailable ? undefined : t('splitUnavailable')}
            checked={page.split && page.splitAvailable}
            disabled={!page.splitAvailable}
            onChange={(on) => page.set('split', on)}
          />
        ) : null}

        <DuplicatesBanner
          duplicates={page.duplicates}
          keep={page.keepDuplicates}
          onKeepChange={(on) => page.set('keepDuplicates', on)}
          onShowDeck={(held) => onShowDeck?.(held)}
        />

        <TargetPicker
          auto={page.auto}
          onAutoChange={(on) => page.set('auto', on)}
          destination={page.destination}
          onPickDeck={() => page.showSheet('deck')}
          onNameDeck={() => page.showSheet('name')}
        />
      </div>

      <DestinationSheet
        open={page.sheet === 'deck'}
        onOpenChange={(open) => page.showSheet(open ? 'deck' : null)}
        title={t('pickDeck')}
        subtitle={t('pickDeckHint')}
        action={{ prompt: t('pickDeckPrompt'), confirm: (name) => t('useDeck', { name }) }}
        targets="deck"
        decks={page.decks}
        folders={page.folders}
        onPick={(dest) => {
          if (dest.kind === 'deck') page.pickDeck(dest.deckId)
          page.showSheet(null)
        }}
      />

      <PromptSheet
        open={page.sheet === 'name'}
        onOpenChange={(open) => page.showSheet(open ? 'name' : null)}
        title={t('newDeckTitle')}
        description={t('newDeckHint')}
        fieldLabel={t('newDeckName')}
        initialValue={page.chapterName}
        confirmLabel={t('useName')}
        onSubmit={(name) => {
          page.nameDeck(name)
          page.showSheet(null)
        }}
      />
    </AppScreen>
  )
}
