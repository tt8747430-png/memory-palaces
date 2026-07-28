import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { deleteDeck, setDeckArchived } from '@/features/deck'
import { cardsInSubtree, selectIsReady } from '@/shared/lib'
import {
  AppScreen,
  Button,
  ConfirmDialog,
  Empty,
  OverflowMenuButton,
  ScreenHeader,
  Skeleton,
} from '@/shared/ui'

export interface ArchivedDecksPageProps {
  onBack: () => void
}

export function ArchivedDecksPage({ onBack }: ArchivedDecksPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()

  const decks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const decksReady = useDeckStore(selectIsReady)
  const cardsReady = useCardStore(selectIsReady)
  const ready = decksReady && cardsReady

  const archived = useMemo(() => {
    const archivedIds = new Set(decks.filter((d) => d.archived).map((d) => d.id))
    return decks
      .filter(
        (deck) => deck.archived && (deck.parentId === null || !archivedIds.has(deck.parentId)),
      )
      .sort((a, b) => a.order - b.order)
  }, [decks])

  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const pendingDeck = archived.find((deck) => deck.id === pendingDelete)

  const restore = (id: string, name: string) => {
    void setDeckArchived(deckStore, id, false)
    toast.success(t('archived.restored', { name }))
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
          <Skeleton className="size-8 bg-secondary" />
        </div>
      ) : archived.length === 0 ? (
        <Empty
          icon={<Archive className="size-7" aria-hidden />}
          title={t('archived.empty')}
          description={t('archived.emptyBody')}
        />
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
                  {deck.icon || '🗂️'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[length:var(--p-text-sub)] font-semibold text-heading">
                    {deck.name}
                  </span>
                  <span className="block truncate text-[length:var(--p-text-label)] text-muted-foreground">
                    {count > 0 ? t('archived.cardCount', { count }) : t('archived.noCards')}
                  </span>
                </span>
                <Button variant="secondary" size="sm" onClick={() => restore(deck.id, deck.name)}>
                  <ArchiveRestore className="size-4" aria-hidden />
                  {t('archived.restore')}
                </Button>
                <OverflowMenuButton
                  label={`${deck.name} ${t('common.moreOptions')}`}
                  size="sm"
                  actions={[
                    {
                      id: 'delete',
                      label: t('common.delete'),
                      icon: <Trash2 className="size-5" aria-hidden />,
                      destructive: true,
                      onSelect: () => setPendingDelete(deck.id),
                    },
                  ]}
                />
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('common.delete')}
        description={pendingDeck?.name}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          if (pendingDelete) void deleteDeck(deckStore, cardStore, pendingDelete)
          setPendingDelete(null)
        }}
      />
    </AppScreen>
  )
}
