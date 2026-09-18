import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BookOpen, Eraser, Trash2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cardsInSubtree, nowIso, selectIsReady, useDevMode } from '@/shared/lib'
import {
  AppScreen,
  Button,
  ConfirmDialog,
  MissingScreen,
  ScreenHeader,
  ScreenLoading,
  SettingsSection,
} from '@/shared/ui'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import { selectFolders, useFolderStore } from '@/entities/folder'
import { editCard } from '@/features/card'
import { MoveSheet } from '@/widgets/deck-tree'
import { ROUTES } from '@/shared/config/routes'
import { useBibleT } from '../i18n/use-bible-t'
import { useBibleVerseStore, useBibleVerseStoreApi } from '../model/context'
import { cleanReferenceBacks } from '../features/clean-reference-backs'
import { type CleanableCard, countReferenceBacks } from '../model/reference-backs'
import { forgetBook } from '../features/forget-book'
import { publishVerses } from '../features/publish-verses'
import { versesFromCards } from '../model/verse-sources'

export interface BibleLibraryPageProps {
  onBack?: () => void
}

/**
 * Dev-mode admin. This is how the verse library is filled before a bundled translation exists;
 * with dev mode off there is nothing here a learner should act on, so the screen is empty.
 */
export function BibleLibraryPage({ onBack }: BibleLibraryPageProps) {
  const t = useBibleT()
  const { t: core } = useTranslation()
  const devMode = useDevMode()
  const verses = useBibleVerseStore((state) => state.verses)
  const verseStore = useBibleVerseStoreApi()
  const decks = useDeckStore(selectDecks)
  const folders = useFolderStore(selectFolders)
  const cards = useCardStore(selectCards)
  const cardStore = useCardStoreApi()
  // "Nothing here yet" is only true once the stores have mirrored; before that it is a guess.
  const ready = useBibleVerseStore(selectIsReady)
  const cardsReady = useCardStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)
  const [sheet, setSheet] = useState<'publish' | 'clean' | null>(null)
  const [pendingClean, setPendingClean] = useState<CleanableCard[] | null>(null)

  const books = useMemo(() => {
    const counts = new Map<string, number>()
    for (const verse of verses) counts.set(verse.book, (counts.get(verse.book) ?? 0) + 1)
    return [...counts].sort(([a], [b]) => a.localeCompare(b))
  }, [verses])

  if (!devMode) {
    return (
      <MissingScreen title={t('libraryTitle')} onBack={onBack} backLabel={core('common.back')} />
    )
  }

  if (!ready || !cardsReady || !decksReady) {
    return (
      <AppScreen
        gutter="end"
        header={
          <ScreenHeader
            title={t('libraryTitle')}
            onBack={onBack}
            backLabel={core('common.back')}
            subtitle={t('librarySubtitle')}
          />
        }
      >
        <ScreenLoading />
      </AppScreen>
    )
  }

  const deckCards = (deckId: string) => cardsInSubtree(decks, cards, deckId)

  const publish = (deckId: string) => {
    void publishVerses(verseStore, versesFromCards(deckCards(deckId), nowIso())).then(
      (published) => toast.success(t('kept', { count: published })),
      () => toast.error(t('keepFailed')),
    )
  }

  const forget = (book: string) => {
    void forgetBook(verseStore, book).then(
      (forgotten) => toast.success(t('forgotten', { count: forgotten })),
      () => toast.error(t('forgetFailed')),
    )
  }

  const clean = (targets: readonly CleanableCard[]) => {
    void cleanReferenceBacks(targets, async (id, back) => {
      await editCard(cardStore, id, { back })
    }).then(
      (changed) => toast.success(t('cleanBacksCount', { count: changed })),
      () => toast.error(t('cleanFailed')),
    )
  }

  return (
    <AppScreen
      gutter="end"
      header={
        <ScreenHeader
          title={t('libraryTitle')}
          onBack={onBack}
          backLabel={core('common.back')}
          subtitle={t('librarySubtitle')}
        />
      }
    >
      <div className="mt-4 flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setSheet('publish')}>
            <BookOpen className="size-4" aria-hidden />
            {t('publishFromDeck')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSheet('clean')}>
            <Eraser className="size-4" aria-hidden />
            {t('cleanBacks')}
          </Button>
        </div>

        {books.length === 0 ? (
          <p className="rounded-card bg-card p-6 text-center text-body text-muted-foreground shadow-rest">
            {t('empty')}
          </p>
        ) : (
          <SettingsSection title={t('librarySubtitle')}>
            {books.map(([book, count]) => (
              <div key={book} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-heading">
                    {book}
                  </span>
                  <span className="block text-label text-muted-foreground">
                    {t('published', { count })}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`${book} — ${core('common.delete')}`}
                  onClick={() => forget(book)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            ))}
          </SettingsSection>
        )}

        <p className="text-label leading-snug text-muted-foreground">{t('offline')}</p>
      </div>

      <MoveSheet
        open={sheet !== null}
        onOpenChange={(open) => setSheet(open ? sheet : null)}
        title={sheet === 'clean' ? t('cleanBacks') : t('publishFromDeck')}
        subtitle={t('librarySubtitle')}
        targets="deck"
        decks={decks}
        folders={folders}
        onPick={(dest) => {
          if (dest.kind !== 'deck') return
          const picked = sheet
          setSheet(null)
          if (picked === 'publish') publish(dest.deckId)
          else setPendingClean(deckCards(dest.deckId))
        }}
      />

      <ConfirmDialog
        open={pendingClean !== null}
        onOpenChange={(open) => setPendingClean(open ? pendingClean : null)}
        icon={<Eraser className="size-6" aria-hidden />}
        title={t('cleanBacks')}
        description={t('cleanBacksCount', { count: countReferenceBacks(pendingClean ?? []) })}
        confirmLabel={t('cleanBacks')}
        cancelLabel={core('common.cancel')}
        onConfirm={() => {
          const targets = pendingClean ?? []
          setPendingClean(null)
          clean(targets)
        }}
      />
    </AppScreen>
  )
}

export function BibleLibraryScreen() {
  const navigate = useNavigate()
  return <BibleLibraryPage onBack={() => void navigate({ to: ROUTES.settingsExtensions })} />
}
