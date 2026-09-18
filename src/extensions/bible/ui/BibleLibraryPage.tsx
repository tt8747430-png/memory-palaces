import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BookOpen, Eraser, Trash2 } from 'lucide-react'
import { cardsInSubtree, nowIso, selectIsReady } from '@/shared/lib'
import {
  AppScreen,
  Button,
  ConfirmDialog,
  EmptyNotice,
  ScreenHeader,
  ScreenLoading,
  SettingsSection,
} from '@/shared/ui'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import { selectFolders, useFolderStore } from '@/entities/folder'
import { editCard } from '@/features/card'
import { DestinationSheet } from '@/widgets/deck-tree'
import { type BibleKey, useBibleT } from '../i18n/use-bible-t'
import { useBibleVerseStore, useBibleVerseStoreApi } from '../model/context'
import { cleanReferenceBacks } from '../features/clean-reference-backs'
import { type CleanableCard, countReferenceBacks } from '../model/reference-backs'
import { forgetBook } from '../features/forget-book'
import { publishVerses } from '../features/publish-verses'
import { DEFAULT_TRANSLATION } from '../model/verse'
import { versesFromCards } from '../model/verse-sources'

export interface BibleLibraryPageProps {
  onBack?: () => void
}

type DeckSheet = 'publish' | 'clean'

/** Each sheet's words, looked up once — the sheet says what picking a deck will do. */
const DECK_SHEETS: Record<DeckSheet, { title: BibleKey; hint: BibleKey; confirm: BibleKey }> = {
  publish: { title: 'publishFromDeck', hint: 'publishHint', confirm: 'publishDeck' },
  clean: { title: 'cleanBacks', hint: 'cleanHint', confirm: 'cleanDeck' },
}

/**
 * What an overlay shows, held apart from whether it is open: closing animates, and a sheet whose
 * words were derived from `open` would read as the other sheet — or as "0 cards" — on its way out.
 */
interface Overlay<Subject> {
  subject: Subject
  open: boolean
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
  const cardStore = useCardStoreApi()
  // "Nothing here yet" is only true once the stores have mirrored; before that it is a guess.
  const ready = useBibleVerseStore(selectIsReady)
  const cardsReady = useCardStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)
  const [sheet, setSheet] = useState<Overlay<DeckSheet>>({ subject: 'publish', open: false })
  const [cleaning, setCleaning] = useState<Overlay<CleanableCard[]>>({ subject: [], open: false })
  const sheetCopy = DECK_SHEETS[sheet.subject]

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

  const clean = (targets: readonly CleanableCard[]) => {
    void cleanReferenceBacks(targets, async (id, back) => {
      await editCard(cardStore, id, { back })
    }).then(
      (changed) => toast.success(t('cleanedBacks', { count: changed })),
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSheet({ subject: 'publish', open: true })}
          >
            <BookOpen className="size-4" aria-hidden />
            {t('publishFromDeck')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSheet({ subject: 'clean', open: true })}
          >
            <Eraser className="size-4" aria-hidden />
            {t('cleanBacks')}
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

      <DestinationSheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((held) => ({ ...held, open }))}
        title={t(sheetCopy.title)}
        subtitle={t(sheetCopy.hint)}
        action={{
          prompt: t('pickDeckPrompt'),
          confirm: (name) => t(sheetCopy.confirm, { name }),
        }}
        targets="deck"
        decks={decks}
        folders={folders}
        onPick={(dest) => {
          if (dest.kind !== 'deck') return
          setSheet((held) => ({ ...held, open: false }))
          if (sheet.subject === 'publish') publish(dest.deckId)
          else setCleaning({ subject: deckCards(dest.deckId), open: true })
        }}
      />

      <ConfirmDialog
        open={cleaning.open}
        onOpenChange={(open) => setCleaning((held) => ({ ...held, open }))}
        icon={<Eraser className="size-6" aria-hidden />}
        title={t('cleanBacks')}
        description={t('cleanBacksCount', { count: countReferenceBacks(cleaning.subject) })}
        confirmLabel={t('cleanBacks')}
        cancelLabel={core('common.cancel')}
        onConfirm={() => {
          setCleaning((held) => ({ ...held, open: false }))
          clean(cleaning.subject)
        }}
      />
    </AppScreen>
  )
}
