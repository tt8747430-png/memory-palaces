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
import { DestinationSheet } from '@/widgets/deck-tree'
import { type BibleT, useBibleT } from '../i18n/use-bible-t'
import { bookName } from '../model/book-names'
import { type BibleSettingsPending, useBibleSettings } from '../model/use-bible-settings'
import { CoverageList } from './settings/CoverageList'

export interface BibleSettingsPageProps {
  onBack?: () => void
}

/** The confirm dialog's words for whatever is pending — derived, so closing never shows "0 verses". */
function pendingCopy(t: BibleT, pending: BibleSettingsPending) {
  if (pending.kind === 'add') {
    const { fresh, held, cards } = pending.text
    return {
      title: t('addFromCards'),
      description: t('addPreview', { fresh: fresh.length, cards, held }),
      confirm: t('addVerses', { count: fresh.length }),
      icon: <Library className="size-6" aria-hidden />,
      destructive: false,
    }
  }
  return {
    title: t('forgetBook', { name: bookName(pending.book) }),
    description: t('forgetPreview', { count: pending.verses }),
    confirm: t('forget'),
    icon: <Trash2 className="size-6" aria-hidden />,
    destructive: true,
  }
}

export function BibleSettingsPage({ onBack }: BibleSettingsPageProps) {
  const t = useBibleT()
  const { t: core } = useTranslation()
  const page = useBibleSettings()

  const header = (
    <ScreenHeader title={t('settingsTitle')} onBack={onBack} backLabel={core('common.back')} />
  )

  if (!page.ready) {
    return (
      <AppScreen gutter="end" header={header}>
        <ScreenLoading />
      </AppScreen>
    )
  }

  const copy = page.pending ? pendingCopy(t, page.pending) : null

  return (
    <AppScreen gutter="end" header={header}>
      <div className="mt-4 flex flex-col gap-5">
        <SettingsSection title={t('translation')}>
          <SettingsRow
            kind="value"
            icon={<BookOpen />}
            label={page.translation.name}
            description={t('translationLanguage')}
            value=""
          />
        </SettingsSection>

        <SettingsSection title={t('libraryTitle')}>
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
            onClick={() => page.showDeckSheet(true)}
          />
        </SettingsSection>

        {page.empty ? (
          <EmptyNotice>{t('libraryEmpty')}</EmptyNotice>
        ) : (
          <CoverageList
            coverage={page.coverage}
            onForget={page.devMode ? page.requestForget : undefined}
          />
        )}

        <p className="text-label leading-snug text-muted-foreground">{t('offline')}</p>
      </div>

      <DestinationSheet
        open={page.deckSheet}
        onOpenChange={page.showDeckSheet}
        title={t('addFromDeck')}
        subtitle={t('addFromDeckHint')}
        action={{ prompt: t('pickDeckPrompt'), confirm: (name) => t('addDeck', { name }) }}
        targets="deck"
        decks={page.decks}
        folders={page.folders}
        onPick={(dest) => {
          if (dest.kind !== 'deck') return
          page.showDeckSheet(false)
          page.addFromDeck(dest.deckId)
        }}
      />

      {copy ? (
        <ConfirmDialog
          open={page.pending !== null}
          onOpenChange={(open) => {
            if (!open) page.dismiss()
          }}
          icon={copy.icon}
          title={copy.title}
          description={copy.description}
          confirmLabel={copy.confirm}
          cancelLabel={core('common.cancel')}
          destructive={copy.destructive}
          onConfirm={page.confirm}
        />
      ) : null}
    </AppScreen>
  )
}
