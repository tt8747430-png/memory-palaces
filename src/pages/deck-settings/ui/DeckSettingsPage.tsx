import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  FileText,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  DEFAULT_DECK_SETTINGS,
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { cardsInSubtree, resolveDeckSettings } from '@/shared/lib'
import { deleteDeck, duplicateDeck, editDeck, setDeckArchived } from '@/features/deck'
import { resetDeckSrs } from '@/features/card'
import { exportCardsAnki, exportCardsCsv } from '@/features/content'
import {
  ActionSheet,
  AppScreen,
  ConfirmDialog,
  DeckCover,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'
import { DeckAppearanceSheet } from './DeckAppearanceSheet'

export interface DeckSettingsPageProps {
  deckId: string
  onBack?: () => void
  onDeleted?: () => void
}

export function DeckSettingsPage({ deckId, onBack, onDeleted }: DeckSettingsPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()

  useEffect(() => {
    deckStore.getState().start()
    cardStore.getState().start()
  }, [deckStore, cardStore])

  const decks = useDeckStore(selectDecks)
  const allCards = useCardStore(selectCards)
  const ready = useDeckStore(selectDecksReady)
  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId])
  const settings = useMemo(
    () => resolveDeckSettings(decks, deckId, DEFAULT_DECK_SETTINGS),
    [decks, deckId],
  )
  const cards = useMemo(() => cardsInSubtree(decks, allCards, deckId), [decks, allCards, deckId])

  const [appearanceOpen, setAppearanceOpen] = useState(false)
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

  const override = (patch: Partial<typeof settings>) =>
    void editDeck(deckStore, deckId, { settings: { ...deck.settings, ...patch } })

  const runExport = (run: () => void) => {
    setExportOpen(false)
    run()
    toast.success(t('deckSettings.toast.exported'))
  }

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
          onClick={() => setAppearanceOpen(true)}
          aria-label={t('deckSettings.editAppearance')}
          className="flex items-center gap-3.5 rounded-card bg-card p-4 text-left shadow-rest transition-transform active:scale-[0.99]"
        >
          <DeckCover
            icon={deck.icon || '🗂️'}
            color={deck.color}
            image={deck.image}
            className="size-16 shrink-0 rounded-card shadow-rest"
            iconClassName="text-3xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[length:var(--p-text-title)] font-bold tracking-tight text-heading">
              {deck.name}
            </p>
            <p className="mt-0.5 text-[length:var(--p-text-label)] text-muted-foreground">
              {t('deckSettings.editAppearanceHint')}
            </p>
          </div>
          <Pencil className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>

        <SettingsSection title={t('deckSettings.study')}>
          <SettingsRow
            kind="toggle"
            icon={<RotateCcw />}
            label={t('deckSettings.shuffle')}
            checked={settings.shuffleCards}
            onCheckedChange={(v) => override({ shuffleCards: v })}
          />
          <SettingsRow
            kind="toggle"
            icon={<FileText />}
            label={t('deckSettings.textToSpeech')}
            checked={settings.textToSpeech}
            onCheckedChange={(v) => override({ textToSpeech: v })}
          />
          <SettingsRow
            kind="toggle"
            icon={<Copy />}
            label={t('deckSettings.studyBack')}
            checked={settings.studyDirection === 'back'}
            onCheckedChange={(v) => override({ studyDirection: v ? 'back' : 'front' })}
          />
        </SettingsSection>

        <SettingsSection title={t('deckSettings.manage')}>
          <SettingsRow
            kind="nav"
            icon={<Copy />}
            label={t('deckSettings.duplicate')}
            description={t('deckSettings.duplicateHint')}
            onClick={() => {
              void duplicateDeck(deckStore, deckId)
              toast.success(t('deckSettings.toast.duplicated'))
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
