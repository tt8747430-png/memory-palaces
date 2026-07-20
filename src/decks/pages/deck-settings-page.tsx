import { useMemo } from 'react'
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
  DEFAULT_DECK_ICON,
  DEFAULT_DECK_SETTINGS,
  deleteDeck,
  duplicateDeck,
  editDeck,
  resetDeckSrs,
  setDeckArchived,
} from '@/decks'
import { openDeckAppearanceDrawer } from '@/decks/ui'
import { exportCardsAnki, exportCardsCsv } from '@/import'
import { cardsInSubtree, resolveDeckSettings } from '@/shared/domain'
import {
  AppScreen,
  DeckCover,
  openActionDrawer,
  openConfirmDialog,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'
import { useStore } from '@/shared/data/use-store'
import { useServices } from '@/shell/services-provider'

export interface DeckSettingsPageProps {
  deckId: string
  onBack?: () => void
  onDeleted?: () => void
}

/**
 * Deck configuration. Plain component by design (A.7): the study toggles delegate to the tested
 * `resolveDeckSettings`, and every other row is a single command dispatch behind a confirm — a
 * ViewModel would hold nothing but the `useMemo`s already here.
 */
export function DeckSettingsPage({ deckId, onBack, onDeleted }: DeckSettingsPageProps) {
  const { t } = useTranslation()
  const { deckStore, cardStore } = useServices()

  const decks = useStore(deckStore.decks)
  const allCards = useStore(cardStore.cards)
  const ready = useStore(deckStore.status) === 'ready'

  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId])
  const settings = useMemo(
    () => resolveDeckSettings(decks, deckId, DEFAULT_DECK_SETTINGS),
    [decks, deckId],
  )
  const cards = useMemo(() => cardsInSubtree(decks, allCards, deckId), [decks, allCards, deckId])

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

  const editAppearance = async () => {
    const draft = await openDeckAppearanceDrawer(deck)
    if (!draft) return
    await editDeck(deckStore, deckId, draft)
  }

  const exportDeck = async () => {
    const format = await openActionDrawer({
      title: t('deckSettings.exportSheetTitle'),
      description: t('deckSettings.exportSheetDescription'),
      actions: [
        { id: 'csv', label: t('deckSettings.exportCsv'), icon: <MapPin className="size-5" /> },
        { id: 'anki', label: t('deckSettings.exportAnki'), icon: <FileText className="size-5" /> },
      ],
    })
    if (!format) return
    if (format === 'csv') exportCardsCsv(deck.name, cards)
    else exportCardsAnki(deck.name, cards)
    toast.success(t('deckSettings.toast.exported'))
  }

  const resetProgress = async () => {
    const confirmed = await openConfirmDialog({
      title: t('deckSettings.resetConfirm.title'),
      description: t('deckSettings.resetConfirm.body'),
      confirmLabel: t('deckSettings.resetConfirm.confirm'),
      cancelLabel: t('common.cancel'),
    })
    if (!confirmed) return
    await resetDeckSrs(deckStore, cardStore, deckId)
    toast.success(t('deckSettings.toast.reset'))
  }

  const removeDeck = async () => {
    const confirmed = await openConfirmDialog({
      tone: 'danger',
      title: t('deckSettings.deleteConfirm.title', { name: deck.name }),
      description: t('deckSettings.deleteConfirm.body'),
      confirmLabel: t('deckSettings.deleteConfirm.confirm'),
      cancelLabel: t('common.cancel'),
    })
    if (!confirmed) return
    await deleteDeck(deckStore, cardStore, deckId)
    onDeleted?.()
  }

  const toggleArchived = () => {
    const archiving = !deck.archived
    void setDeckArchived(deckStore, deckId, archiving)
    toast.success(archiving ? t('deckSettings.toast.archived') : t('deckSettings.toast.unarchived'))
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
          onClick={() => void editAppearance()}
          aria-label={t('deckSettings.editAppearance')}
          className="flex items-center gap-3.5 rounded-card bg-card p-4 text-left shadow-rest transition-transform active:scale-[0.99]"
        >
          <DeckCover
            icon={deck.icon || DEFAULT_DECK_ICON}
            color={deck.color}
            image={deck.image}
            className="size-16 shrink-0 rounded-card shadow-rest"
            iconClassName="text-3xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[length:var(--ms-text-title)] font-bold tracking-tight text-heading">
              {deck.name}
            </p>
            <p className="mt-0.5 text-[length:var(--ms-text-label)] text-muted-foreground">
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
            onCheckedChange={(value) => override({ shuffleCards: value })}
          />
          <SettingsRow
            kind="toggle"
            icon={<FileText />}
            label={t('deckSettings.textToSpeech')}
            checked={settings.textToSpeech}
            onCheckedChange={(value) => override({ textToSpeech: value })}
          />
          <SettingsRow
            kind="toggle"
            icon={<Copy />}
            label={t('deckSettings.studyBack')}
            checked={settings.studyDirection === 'back'}
            onCheckedChange={(value) => override({ studyDirection: value ? 'back' : 'front' })}
          />
        </SettingsSection>

        <SettingsSection title={t('deckSettings.manage')}>
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
            icon={<Download />}
            label={t('deckSettings.export')}
            description={t('deckSettings.exportHint')}
            disabled={cards.length === 0}
            onClick={() => void exportDeck()}
          />
          <SettingsRow
            kind="nav"
            icon={<RotateCcw />}
            label={t('deckSettings.reset')}
            description={t('deckSettings.resetHint')}
            onClick={() => void resetProgress()}
          />
          <SettingsRow
            kind="nav"
            icon={deck.archived ? <ArchiveRestore /> : <Archive />}
            label={deck.archived ? t('deckSettings.unarchive') : t('deckSettings.archive')}
            description={t('deckSettings.archiveHint')}
            onClick={toggleArchived}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            kind="nav"
            tone="danger"
            icon={<Trash2 />}
            label={t('deckSettings.delete')}
            description={t('deckSettings.deleteHint')}
            onClick={() => void removeDeck()}
          />
        </SettingsSection>
      </div>
    </AppScreen>
  )
}
