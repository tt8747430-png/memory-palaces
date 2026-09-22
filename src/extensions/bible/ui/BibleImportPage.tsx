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
import { type BibleT, useBibleT } from '../i18n/use-bible-t'
import { type BibleImport, useBibleImport } from '../model/use-bible-import'
import { DuplicatesBanner } from './DuplicatesBanner'
import { PassagePicker } from './picker/PassagePicker'
import { PassageSummary } from './picker/PassageSummary'
import { TargetPicker } from './TargetPicker'
import { VerseTextPanel } from './VerseTextPanel'

export interface BibleImportPageProps {
  /** The deck the learner was already in, if they came from one. */
  deckId?: string
  onBack?: () => void
  onReview?: (deckId: string) => void
  onShowDeck?: (deckId: string) => void
}

/** What the line above the text box says: where the text came from, or what is still missing. */
function textNote(t: BibleT, page: BibleImport): string | null {
  if (page.missing.length) {
    return t('missingNote', { verses: page.missing.join(', '), count: page.missing.length })
  }
  if (page.prefilled) return t('textImported')
  if (!page.text.trim()) return t(page.picker.ref ? 'textMissing' : 'textPaste')
  return null
}

export function BibleImportPage({ deckId, onBack, onReview, onShowDeck }: BibleImportPageProps) {
  const t = useBibleT()
  // The back label is core copy, not the extension's — one word, one place.
  const { t: core } = useTranslation()
  const page = useBibleImport(deckId, (reviewIn) => onReview?.(reviewIn))
  const { picker } = page

  const header = (
    <ScreenHeader title={t('importTitle')} onBack={onBack} backLabel={core('common.back')} />
  )

  // Until every store has mirrored, "not in your Bible library" and "0 duplicates" would both be
  // guesses dressed as facts, so the screen waits instead of saying them.
  if (!page.ready) {
    return (
      <AppScreen header={header}>
        <ScreenLoading />
      </AppScreen>
    )
  }

  const choosing = picker.step === 'passage'

  return (
    <AppScreen
      fill
      header={header}
      footer={
        choosing ? null : (
          <FooterBar>
            <Button size="lg" className="w-full" disabled={!page.canAdd} onClick={page.add}>
              <Sparkles className="size-4.5" aria-hidden />
              {t('addCount', { count: page.addable.length })}
            </Button>
          </FooterBar>
        )
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-6">
        {picker.ref && page.passage ? (
          <PassageSummary passage={picker.ref} text={page.passage} onChange={picker.edit} />
        ) : (
          <PassagePicker picker={picker} index={page.index} recents={page.recents} />
        )}

        {choosing ? null : (
          <VerseTextPanel
            value={page.text}
            onChange={page.setText}
            note={textNote(t, page)}
            translation={page.translation}
          />
        )}

        {!choosing && page.hasCards ? (
          <div className="flex flex-col gap-4">
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
              autoAvailable={page.chapterDecksAvailable}
              destination={page.destination}
              onPickDeck={() => page.showSheet('deck')}
              onNameDeck={() => page.showSheet('name')}
            />
          </div>
        ) : null}
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
