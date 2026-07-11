import { type ChangeEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, ChevronLeft, FileText, Landmark } from 'lucide-react'
import { toast } from 'sonner'
import type { DeckStore } from '@/entities/deck'
import type { CardStore } from '@/entities/card'
import type { QuestionStore } from '@/entities/question'
import { ContentImportError, type ImportedRoom, parseVerseChapters } from '@/shared/lib'
import { Button, ImportRow, Sheet, Textarea } from '@/shared/ui'
import { readAnkiFile, readContentFile, readPalaceFile } from '../import-content'
import { importDecks, type ImportDecksResult } from '../import-decks'

type FileKind = 'cards' | 'mindscape'

export interface ImportDecksSheetProps {
  /** The deck the imports become subdecks of, or `null` to create top-level decks. */
  parentId: string | null
  deckStore: DeckStore
  cardStore: CardStore
  questionStore: QuestionStore
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful import (e.g. to scroll to / open the new decks). */
  onImported?: (result: ImportDecksResult) => void
}

/** Tidy a file name into a deck name: drop the extension, soften separators. */
function deckNameFromFile(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim() || 'Imported'
  )
}

/**
 * Deck-level import: bring in a whole chapter or exported deck as its own subdeck(s), not
 * just cards into one deck. Pasted verses become one subdeck per chapter; an Anki/CSV file
 * becomes a subdeck named after the file; a Mindscape export contributes all its decks.
 * Every path funnels through the `importDecks` command.
 */
export function ImportDecksSheet({
  parentId,
  deckStore,
  cardStore,
  questionStore,
  open,
  onOpenChange,
  onImported,
}: ImportDecksSheetProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'menu' | 'verses'>('menu')
  const [verseText, setVerseText] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileKind = useRef<FileKind>('cards')

  const chapters = parseVerseChapters(verseText)
  const verseCount = chapters.reduce((sum, chapter) => sum + chapter.loci.length, 0)

  const reset = () => {
    setStep('menu')
    setVerseText('')
    setBusy(false)
  }

  const close = () => {
    onOpenChange(false)
    // Defer the reset so the closing sheet doesn't flash back to the menu mid-transition.
    setTimeout(reset, 200)
  }

  const run = async (decks: ImportedRoom[]) => {
    if (busy) return
    if (decks.length === 0) {
      toast.warning(t('importRooms.toast.empty'))
      return
    }
    setBusy(true)
    try {
      const result = await importDecks(deckStore, cardStore, questionStore, parentId, decks)
      toast.success(
        t(result.decks === 1 ? 'importRooms.toast.addedOne' : 'importRooms.toast.addedOther', {
          count: result.decks,
          cards: result.cards,
        }),
      )
      onImported?.(result)
      close()
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('importRooms.toast.error'),
      )
      setBusy(false)
    }
  }

  const pickFile = (accept: string, kind: FileKind) => {
    fileKind.current = kind
    const input = fileRef.current
    if (input) {
      input.accept = accept
      input.click()
    }
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      if (fileKind.current === 'mindscape') {
        const data = await readPalaceFile(file)
        await run(data.rooms)
      } else {
        const lower = file.name.toLowerCase()
        const content = lower.endsWith('.csv')
          ? await readContentFile(file)
          : await readAnkiFile(file)
        await run([{ title: deckNameFromFile(file.name), ...content }])
      }
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('importRooms.toast.error'),
      )
    }
  }

  const createVerseDecks = () =>
    void run(
      chapters.map((chapter) => ({ title: chapter.title, loci: chapter.loci, questions: [] })),
    )

  return (
    <>
      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
      <Sheet
        open={open}
        onOpenChange={(next) => (next ? onOpenChange(true) : close())}
        title={step === 'verses' ? t('importRooms.versesTitle') : t('importRooms.title')}
        description={step === 'menu' ? t('importRooms.intro') : undefined}
        footer={
          step === 'verses' ? (
            <Button
              size="lg"
              className="w-full"
              disabled={verseCount === 0 || busy}
              onClick={createVerseDecks}
            >
              <BookOpen className="size-[18px]" aria-hidden />
              {verseCount > 0
                ? t(
                    chapters.length === 1
                      ? 'importRooms.versesCtaOne'
                      : 'importRooms.versesCtaOther',
                    { count: chapters.length, verses: verseCount },
                  )
                : t('importRooms.versesEmptyCta')}
            </Button>
          ) : undefined
        }
      >
        {step === 'menu' ? (
          <div className="flex flex-col gap-2.5 pb-2">
            <ImportRow
              icon={<BookOpen className="size-5" aria-hidden />}
              tone="brand"
              title={t('importRooms.verses')}
              subtitle={t('importRooms.versesSub')}
              onClick={() => setStep('verses')}
            />
            <ImportRow
              icon={<FileText className="size-5" aria-hidden />}
              tone="accent"
              badge="CSV · TSV"
              title={t('importRooms.deck')}
              subtitle={t('importRooms.deckSub')}
              onClick={() => pickFile('.txt,.tsv,.csv', 'cards')}
            />
            <ImportRow
              icon={<Landmark className="size-5" aria-hidden />}
              tone="positive"
              badge="JSON"
              title={t('importRooms.palaceFile')}
              subtitle={t('importRooms.palaceFileSub')}
              onClick={() => pickFile('.json', 'mindscape')}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            <button
              type="button"
              onClick={() => setStep('menu')}
              className="inline-flex w-fit items-center gap-1 text-[length:var(--p-text-label)] font-semibold text-primary"
            >
              <ChevronLeft className="size-4" aria-hidden />
              {t('importRooms.back')}
            </button>
            <Textarea
              value={verseText}
              onChange={(event) => setVerseText(event.target.value)}
              placeholder={t('importRooms.versesPlaceholder')}
              rows={7}
              aria-label={t('importRooms.versesTitle')}
              className="font-mono"
            />
          </div>
        )}
      </Sheet>
    </>
  )
}
