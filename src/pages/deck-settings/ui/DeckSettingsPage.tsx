import { useTranslation } from 'react-i18next'
import {
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  FileText,
  FolderInput,
  MapPin,
  Palette,
  Pencil,
  RotateCcw,
  Speech,
  Trash2,
  Upload,
} from 'lucide-react'
import { AlgorithmCard } from '@/widgets/algorithm'
import { MoveSheet } from '@/widgets/deck-tree'
import {
  ActionSheet,
  AppScreen,
  ImportSheet,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'
import { type DeckSettingsNav, useDeckSettings } from '../model/use-deck-settings'
import { DeckAppearanceSheet } from './DeckAppearanceSheet'
import { DeckSettingsDialogs } from './DeckSettingsDialogs'

export interface DeckSettingsPageProps extends DeckSettingsNav {
  deckId: string
}

export function DeckSettingsPage({ deckId, ...nav }: DeckSettingsPageProps) {
  const { t } = useTranslation()
  const page = useDeckSettings(deckId, nav)
  const { deck, act } = page

  if (!page.ready || !deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader
            title={t('deck.settings')}
            onBack={nav.onBack}
            backLabel={t('common.back')}
          />
        }
      />
    )
  }

  return (
    <AppScreen
      fill
      gutter="end"
      header={
        <ScreenHeader
          title={t('deck.settings')}
          subtitle={deck.name}
          onBack={nav.onBack}
          backLabel={t('common.back')}
        />
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-8">
        <AlgorithmCard algorithm={page.settings.algorithm} onClick={nav.onOpenAlgorithm} />

        <SettingsSection title={t('deckSettings.study')}>
          <SettingsRow
            kind="nav"
            icon={<Speech />}
            label={t('deckSettings.ttsRow')}
            onClick={() => nav.onOpenTts?.()}
          />
          <SettingsRow
            kind="nav"
            icon={<Palette />}
            label={t('deckSettings.cardStyle')}
            onClick={() => nav.onOpenCardStyle?.()}
          />
        </SettingsSection>

        <SettingsSection title={t('deckSettings.manage')}>
          <SettingsRow
            kind="nav"
            icon={<Upload />}
            label={t('deckSettings.importCards')}
            onClick={() => page.open('import')}
          />
          <SettingsRow
            kind="nav"
            icon={<Pencil />}
            label={t('deckSettings.rename')}
            description={t('deckSettings.editAppearanceHint')}
            onClick={() => page.open('appearance')}
          />
          <SettingsRow
            kind="nav"
            icon={<FolderInput />}
            label={t('deckSettings.move')}
            onClick={() => page.open('move')}
          />
          <SettingsRow
            kind="nav"
            icon={<Copy />}
            label={t('deckSettings.duplicate')}
            description={t('deckSettings.duplicateHint')}
            onClick={() => page.ask('duplicate')}
          />
          <SettingsRow
            kind="nav"
            icon={<RotateCcw />}
            label={t('deckSettings.reset')}
            description={t('deckSettings.resetHint')}
            onClick={() => page.ask('reset')}
          />
          <SettingsRow
            kind="nav"
            icon={deck.archived ? <ArchiveRestore /> : <Archive />}
            label={deck.archived ? t('deckSettings.unarchive') : t('deckSettings.archive')}
            description={t('deckSettings.archiveHint')}
            onClick={() => (page.archiving ? page.ask('archive') : act.toggleArchived())}
          />
          <SettingsRow
            kind="nav"
            icon={<Download />}
            label={t('deckSettings.export')}
            description={t('deckSettings.exportHint')}
            disabled={page.cards.length === 0}
            onClick={() => page.open('export')}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            kind="nav"
            tone="danger"
            icon={<Trash2 />}
            label={t('deckSettings.delete')}
            description={t('deckSettings.deleteHint')}
            onClick={() => page.ask('delete')}
          />
        </SettingsSection>
      </div>

      <MoveSheet
        open={page.sheet === 'move'}
        onOpenChange={page.onSheetOpenChange('move')}
        subtitle={deck.name}
        decks={page.decks}
        folders={page.folders}
        excludeIds={page.moveExcludeIds}
        onPick={act.move}
      />

      <DeckAppearanceSheet
        open={page.sheet === 'appearance'}
        onOpenChange={page.onSheetOpenChange('appearance')}
        deck={deck}
      />

      <ImportSheet
        open={page.sheet === 'import'}
        onOpenChange={page.onSheetOpenChange('import')}
        title={t('cards.transfer.importTitle')}
        description={t('cards.transfer.importSubtitle')}
        onPasteNotes={act.pasteNotes}
        onPickFile={act.importFile}
      />

      <ActionSheet
        open={page.sheet === 'export'}
        onOpenChange={page.onSheetOpenChange('export')}
        title={t('deckSettings.exportSheetTitle')}
        description={t('deckSettings.exportSheetDescription')}
        cancelLabel={t('common.cancel')}
        actions={[
          {
            id: 'csv',
            label: t('deckSettings.exportCsv'),
            icon: <MapPin className="size-5" aria-hidden />,
            onSelect: act.exportCsv,
          },
          {
            id: 'anki',
            label: t('deckSettings.exportAnki'),
            icon: <FileText className="size-5" aria-hidden />,
            onSelect: act.exportAnki,
          },
        ]}
      />

      <DeckSettingsDialogs page={page} deckName={deck.name} />
    </AppScreen>
  )
}
