import { useTranslation } from 'react-i18next'
import { BookOpen, Layers, Library, Trash2 } from 'lucide-react'
import {
  AppScreen,
  ConfirmDialog,
  EmptyNotice,
  ScreenHeader,
  ScreenLoading,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'
import { selectDevMode, usePreferencesStore } from '@/entities/preferences'
import { DestinationSheet } from '@/widgets/deck-tree'
import { useBibleT } from '../i18n/use-bible-t'
import { bookName } from '../model/book-names'
import { useBibleDeveloper } from '../model/use-bible-developer'
import { CoverageList } from './settings/CoverageList'

export interface BibleDeveloperPageProps {
  onBack?: () => void
}

/**
 * The extension's developer tools, reached from its overview and only while Developer mode is on.
 * Everything here is editorial: what the shared corpus holds, filling it from cards, and
 * forgetting a book. A learner manages their own study on the overview.
 */
export function BibleDeveloperPage({ onBack }: BibleDeveloperPageProps) {
  const t = useBibleT()
  const { t: core } = useTranslation()
  const page = useBibleDeveloper()
  const devMode = usePreferencesStore(selectDevMode)

  const header = (
    <ScreenHeader title={t('developerTitle')} onBack={onBack} backLabel={core('common.back')} />
  )

  if (!page.ready) {
    return (
      <AppScreen gutter="end" header={header}>
        <ScreenLoading />
      </AppScreen>
    )
  }

  // Reachable by a link as well as from the overview, so the screen answers for itself rather than
  // trusting the row that leads to it.
  if (!devMode) {
    return (
      <AppScreen gutter="end" header={header}>
        <div className="mt-4">
          <EmptyNotice>{t('developerOff')}</EmptyNotice>
        </div>
      </AppScreen>
    )
  }

  return (
    <AppScreen gutter="end" header={header}>
      <div className="mt-4 flex flex-col gap-5">
        <p className="text-label leading-snug text-muted-foreground">{t('developerHint')}</p>

        <SettingsSection title={t('libraryTitle')}>
          <SettingsRow
            kind="info"
            icon={<BookOpen />}
            label={page.translation.name}
            description={t('translationLanguage')}
          />
          <SettingsRow
            kind="value"
            icon={<Library />}
            label={t('overviewHolding')}
            value={
              page.empty
                ? t('overviewHoldingNone')
                : t('overviewHoldingCount', {
                    books: page.totals.books,
                    count: page.totals.verses,
                  })
            }
          />
        </SettingsSection>

        <SettingsSection title={t('publishTitle')}>
          <SettingsRow
            kind="action"
            icon={<Library />}
            label={t('addFromCards')}
            description={t('addFromCardsHint')}
            onClick={page.addFromAllCards}
          />
          <SettingsRow
            kind="action"
            icon={<Layers />}
            label={t('addFromDeck')}
            description={t('addFromDeckHint')}
            onClick={page.requestDeckPick}
          />
        </SettingsSection>

        {/* The list frames each testament itself; a frame around both would be a box in a box. */}
        {page.empty ? (
          <EmptyNotice>{t('libraryEmpty')}</EmptyNotice>
        ) : (
          <CoverageList coverage={page.coverage} onForget={page.requestForget} />
        )}
      </div>

      <DestinationSheet
        open={page.pending?.kind === 'pick-deck'}
        onOpenChange={(open) => {
          if (!open) page.dismiss()
        }}
        title={t('addFromDeck')}
        subtitle={t('addFromDeckHint')}
        action={{ prompt: t('pickDeckPrompt'), confirm: (name) => t('addDeck', { name }) }}
        targets="deck"
        decks={page.decks}
        folders={page.folders}
        onPick={(dest) => {
          if (dest.kind === 'deck') page.addFromDeck(dest.deckId)
        }}
      />

      {page.pending?.kind === 'add' ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) page.dismiss()
          }}
          icon={<Library className="size-6" aria-hidden />}
          title={t('addFromCards')}
          description={t('addPreview', {
            fresh: page.pending.text.fresh.length,
            cards: page.pending.text.cards,
            held: page.pending.text.held,
          })}
          confirmLabel={t('addVerses', { count: page.pending.text.fresh.length })}
          cancelLabel={core('common.cancel')}
          onConfirm={page.confirm}
        />
      ) : null}

      {page.pending?.kind === 'forget' ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) page.dismiss()
          }}
          icon={<Trash2 className="size-6" aria-hidden />}
          title={t('forgetBook', { name: bookName(page.pending.book) })}
          description={t('forgetPreview', { count: page.pending.verses })}
          confirmLabel={t('forget')}
          cancelLabel={core('common.cancel')}
          destructive
          onConfirm={page.confirm}
        />
      ) : null}
    </AppScreen>
  )
}
