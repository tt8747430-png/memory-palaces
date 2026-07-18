import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { DEFAULT_DECK_ICON, deleteDeck, setDeckArchived } from '@/decks'
import { cardsInSubtree } from '@/shared/domain'
import {
  AppScreen,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  FlyoutMenu,
  openConfirmDialog,
  ScreenHeader,
} from '@/shared/ui'
import { useStore } from '@/shared/data/use-store'
import { useServices } from '@/shell/services-provider'

export interface ArchivedDecksPageProps {
  onBack: () => void
}

/**
 * The archive. Plain component (A.7): one derived list and two command dispatches.
 *
 * `main` wrapped its row menu in an `OverflowMenuButton` that only forwarded to `FlyoutMenu` —
 * a Middle Man, so this calls `FlyoutMenu` directly.
 */
export function ArchivedDecksPage({ onBack }: ArchivedDecksPageProps) {
  const { t } = useTranslation()
  const { deckStore, cardStore } = useServices()

  const decks = useStore(deckStore.decks)
  const cards = useStore(cardStore.cards)
  const decksReady = useStore(deckStore.status) === 'ready'
  const cardsReady = useStore(cardStore.status) === 'ready'
  const ready = decksReady && cardsReady

  // The top of each archived branch: an archived deck whose parent isn't also archived (a whole
  // subtree archives together, so only its root shows here).
  const archived = useMemo(() => {
    const archivedIds = new Set(decks.filter((d) => d.archived).map((d) => d.id))
    return decks
      .filter(
        (deck) => deck.archived && (deck.parentId === null || !archivedIds.has(deck.parentId)),
      )
      .sort((a, b) => a.order - b.order)
  }, [decks])

  const restore = (id: string, name: string) => {
    void setDeckArchived(deckStore, id, false)
    toast.success(t('archived.restored', { name }))
  }

  const remove = async (id: string, name: string) => {
    const confirmed = await openConfirmDialog({
      tone: 'danger',
      title: t('common.delete'),
      description: name,
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    })
    if (!confirmed) return
    await deleteDeck(deckStore, cardStore, id)
  }

  return (
    <AppScreen
      className="pb-nav"
      header={
        <ScreenHeader title={t('archived.title')} onBack={onBack} backLabel={t('common.back')} />
      }
    >
      {!ready ? (
        <div className="grid flex-1 place-items-center py-16">
          <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
        </div>
      ) : archived.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Archive className="size-7" aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{t('archived.empty')}</EmptyTitle>
            <EmptyDescription>{t('archived.emptyBody')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2 py-4">
          {archived.map((deck) => {
            const count = cardsInSubtree(decks, cards, deck.id).length
            return (
              <li
                key={deck.id}
                className="flex items-center gap-3 rounded-card bg-card p-3 shadow-rest"
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-card bg-info-surface text-2xl"
                  aria-hidden
                >
                  {deck.icon || DEFAULT_DECK_ICON}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[length:var(--ms-text-sub)] font-semibold text-heading">
                    {deck.name}
                  </span>
                  <span className="block truncate text-[length:var(--ms-text-label)] text-muted-foreground">
                    {count > 0 ? t('archived.cardCount', { count }) : t('archived.noCards')}
                  </span>
                </span>
                <Button variant="secondary" size="sm" onClick={() => restore(deck.id, deck.name)}>
                  <ArchiveRestore className="size-4" aria-hidden />
                  {t('archived.restore')}
                </Button>
                <FlyoutMenu
                  label={`${deck.name} ${t('common.moreOptions')}`}
                  variant="ghost"
                  actions={[
                    {
                      id: 'delete',
                      label: t('common.delete'),
                      icon: <Trash2 className="size-5" aria-hidden />,
                      destructive: true,
                      onSelect: () => void remove(deck.id, deck.name),
                    },
                  ]}
                />
              </li>
            )
          })}
        </ul>
      )}
    </AppScreen>
  )
}
