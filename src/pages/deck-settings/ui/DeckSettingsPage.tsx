import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Archive,
  ArchiveRestore,
  ChevronRight,
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
import { useDeck, useDeckStoreApi } from '@/entities/deck'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { selectFolders, useFolderStore } from '@/entities/folder'
import { cardsInSubtree, subtreeDeckIds } from '@/shared/lib'
import { deleteDeck, duplicateDeck, moveDeck, setDeckArchived } from '@/features/deck'
import { resetDeckSrs } from '@/features/card'
import { exportCardsAnki, exportCardsCsv } from '@/features/content'
import { ALGORITHM_META } from '@/widgets/algorithm'
import { MoveSheet } from '@/widgets/deck-tree'
import {
  ActionSheet,
  AppScreen,
  ConfirmDialog,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'
import { DeckAppearanceSheet } from './DeckAppearanceSheet'

export interface DeckSettingsPageProps {
  deckId: string
  onBack?: () => void
  onDeleted?: () => void
  onOpenAlgorithm?: () => void
  onOpenCardStyle?: () => void
  onOpenTts?: () => void
  onImportCards?: () => void
}

export function DeckSettingsPage({
  deckId,
  onBack,
  onDeleted,
  onOpenAlgorithm,
  onOpenCardStyle,
  onOpenTts,
  onImportCards,
}: DeckSettingsPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()

  const { decks, deck, settings, ready } = useDeck(deckId)
  const folders = useFolderStore(selectFolders)
  const allCards = useCardStore(selectCards)
  const cards = useMemo(() => cardsInSubtree(decks, allCards, deckId), [decks, allCards, deckId])
  // A deck cannot be moved inside its own subtree, so every deck under it is off the table.
  const moveExcludeIds = useMemo(() => new Set(subtreeDeckIds(decks, deckId)), [decks, deckId])

  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!ready || !deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('deck.settings')} onBack={onBack} backLabel={t('common.back')} />
        }
      />
    )
  }

  const runExport = (run: () => void) => {
    setExportOpen(false)
    run()
    toast.success(t('deckSettings.toast.exported'))
  }

  const algorithm = ALGORITHM_META[settings.algorithm]

  return (
    <AppScreen
      fill
      className="pb-nav"
      header={
        <ScreenHeader
          title={t('deck.settings')}
          subtitle={deck.name}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-8">
        <button
          type="button"
          onClick={onOpenAlgorithm}
          className="flex items-center gap-3.5 rounded-card bg-info-surface p-4 text-left transition-transform active:scale-[0.99]"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-card bg-card">
            {algorithm.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-(length:--p-text-title) font-bold tracking-tight text-heading">
              {t(algorithm.nameKey as never)}
            </span>
            <span className="mt-0.5 block text-(length:--p-text-label) text-muted-foreground">
              {t('deckSettings.algorithmRow')}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>

        <SettingsSection title={t('deckSettings.study')}>
          <SettingsRow
            kind="nav"
            icon={<Speech />}
            label={t('deckSettings.ttsRow')}
            onClick={() => onOpenTts?.()}
          />
          <SettingsRow
            kind="nav"
            icon={<Palette />}
            label={t('deckSettings.cardStyle')}
            onClick={() => onOpenCardStyle?.()}
          />
        </SettingsSection>

        <SettingsSection title={t('deckSettings.manage')}>
          <SettingsRow
            kind="nav"
            icon={<Upload />}
            label={t('deckSettings.importCards')}
            onClick={() => onImportCards?.()}
          />
          <SettingsRow
            kind="nav"
            icon={<Pencil />}
            label={t('deckSettings.rename')}
            description={t('deckSettings.editAppearanceHint')}
            onClick={() => setAppearanceOpen(true)}
          />
          <SettingsRow
            kind="nav"
            icon={<FolderInput />}
            label={t('deckSettings.move')}
            onClick={() => setMoveOpen(true)}
          />
          <SettingsRow
            kind="nav"
            icon={<Copy />}
            label={t('deckSettings.duplicate')}
            description={t('deckSettings.duplicateHint')}
            onClick={() => {
              void duplicateDeck(deckStore, cardStore, deckId)
              toast.success(t('deckSettings.toast.duplicated'))
            }}
          />
          <SettingsRow
            kind="nav"
            icon={<RotateCcw />}
            label={t('deckSettings.reset')}
            description={t('deckSettings.resetHint')}
            onClick={() => setResetOpen(true)}
          />
          <SettingsRow
            kind="nav"
            icon={deck.archived ? <ArchiveRestore /> : <Archive />}
            label={deck.archived ? t('deckSettings.unarchive') : t('deckSettings.archive')}
            description={t('deckSettings.archiveHint')}
            onClick={() => {
              const archiving = !deck.archived
              void setDeckArchived(deckStore, deckId, archiving)
              toast.success(
                archiving ? t('deckSettings.toast.archived') : t('deckSettings.toast.unarchived'),
              )
            }}
          />
          <SettingsRow
            kind="nav"
            icon={<Download />}
            label={t('deckSettings.export')}
            description={t('deckSettings.exportHint')}
            disabled={cards.length === 0}
            onClick={() => setExportOpen(true)}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            kind="nav"
            tone="danger"
            icon={<Trash2 />}
            label={t('deckSettings.delete')}
            description={t('deckSettings.deleteHint')}
            onClick={() => setDeleteOpen(true)}
          />
        </SettingsSection>
      </div>

      <MoveSheet
        open={moveOpen}
        onOpenChange={setMoveOpen}
        subtitle={deck.name}
        decks={decks}
        folders={folders}
        excludeIds={moveExcludeIds}
        onPick={(dest) => {
          setMoveOpen(false)
          if (dest.kind === 'archive') {
            void setDeckArchived(deckStore, deckId, true)
            toast.success(t('deckSettings.toast.archived'))
            return
          }
          const parentId = dest.kind === 'deck' ? dest.deckId : null
          const folderId = dest.kind === 'folder' ? dest.folderId : null
          void moveDeck(deckStore, deckId, parentId, folderId)
        }}
      />

      <DeckAppearanceSheet open={appearanceOpen} onOpenChange={setAppearanceOpen} deck={deck} />

      <ActionSheet
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={t('deckSettings.exportSheetTitle')}
        description={t('deckSettings.exportSheetDescription')}
        cancelLabel={t('common.cancel')}
        actions={[
          {
            id: 'csv',
            label: t('deckSettings.exportCsv'),
            icon: <MapPin className="size-5" aria-hidden />,
            onSelect: () => runExport(() => exportCardsCsv(deck.name, cards)),
          },
          {
            id: 'anki',
            label: t('deckSettings.exportAnki'),
            icon: <FileText className="size-5" aria-hidden />,
            onSelect: () => runExport(() => exportCardsAnki(deck.name, cards)),
          },
        ]}
      />

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        icon={<RotateCcw className="size-6" aria-hidden />}
        title={t('deckSettings.resetConfirm.title')}
        description={t('deckSettings.resetConfirm.body')}
        confirmLabel={t('deckSettings.resetConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          void resetDeckSrs(deckStore, cardStore, deckId)
          toast.success(t('deckSettings.toast.reset'))
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('deckSettings.deleteConfirm.title', { name: deck.name })}
        description={t('deckSettings.deleteConfirm.body')}
        confirmLabel={t('deckSettings.deleteConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          void deleteDeck(deckStore, cardStore, deckId)
          onDeleted?.()
        }}
      />
    </AppScreen>
  )
}
