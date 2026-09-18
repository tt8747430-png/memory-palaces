import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BookOpen, Trash2 } from 'lucide-react'
import { cardsInSubtree, nowIso, selectIsReady } from '@/shared/lib'
import {
  AppScreen,
  Button,
  EmptyNotice,
  ScreenHeader,
  ScreenLoading,
  SettingsSection,
} from '@/shared/ui'
import { selectCards, useCardStore } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import { selectFolders, useFolderStore } from '@/entities/folder'
import { DestinationSheet } from '@/widgets/deck-tree'
import { useBibleT } from '../i18n/use-bible-t'
import { useBibleVerseStore, useBibleVerseStoreApi } from '../model/context'
import { forgetBook } from '../features/forget-book'
import { publishVerses } from '../features/publish-verses'
import { isBookCode } from '../model/canon'
import { bookName } from '../model/book-names'
import { DEFAULT_TRANSLATION } from '../model/translations'
import { versesFromCards } from '../model/verse-sources'

export interface BibleLibraryPageProps {
  onBack?: () => void
}

/**
 * Admin. This is how the verse library is filled before a bundled translation exists; there is
 * nothing here a learner should act on, so its route is `devOnly` and the guard keeps everyone
 * else out — the page itself does not ask again.
 */
export function BibleLibraryPage({ onBack }: BibleLibraryPageProps) {
  const t = useBibleT()
  const { t: core } = useTranslation()
  const verses = useBibleVerseStore((state) => state.verses)
  const verseStore = useBibleVerseStoreApi()
  const decks = useDeckStore(selectDecks)
  const folders = useFolderStore(selectFolders)
  const cards = useCardStore(selectCards)
  // "Nothing here yet" is only true once the stores have mirrored; before that it is a guess.
  const ready = useBibleVerseStore(selectIsReady)
  const cardsReady = useCardStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)
  const [publishing, setPublishing] = useState(false)

  const books = useMemo(() => {
    const counts = new Map<string, number>()
    for (const verse of verses) counts.set(verse.book, (counts.get(verse.book) ?? 0) + 1)
    return [...counts].sort(([a], [b]) => a.localeCompare(b))
  }, [verses])

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
    void publishVerses(
      verseStore,
      versesFromCards(deckCards(deckId), DEFAULT_TRANSLATION, nowIso()),
    ).then(
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
          <Button variant="secondary" size="sm" onClick={() => setPublishing(true)}>
            <BookOpen className="size-4" aria-hidden />
            {t('publishFromDeck')}
          </Button>
        </div>

        {books.length === 0 ? (
          <EmptyNotice>{t('libraryEmpty')}</EmptyNotice>
        ) : (
          <SettingsSection title={t('librarySubtitle')}>
            {books.map(([book, count]) => (
              <div key={book} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-heading">
                    {isBookCode(book) ? bookName(book) : book}
                  </span>
                  <span className="block text-label text-muted-foreground">
                    {t('published', { count })}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`${isBookCode(book) ? bookName(book) : book} — ${core('common.delete')}`}
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

      <DestinationSheet
        open={publishing}
        onOpenChange={setPublishing}
        title={t('publishFromDeck')}
        subtitle={t('publishHint')}
        action={{ prompt: t('pickDeckPrompt'), confirm: (name) => t('publishDeck', { name }) }}
        targets="deck"
        decks={decks}
        folders={folders}
        onPick={(dest) => {
          if (dest.kind !== 'deck') return
          setPublishing(false)
          publish(dest.deckId)
        }}
      />
    </AppScreen>
  )
}
