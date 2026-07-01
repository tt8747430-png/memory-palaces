import { type ChangeEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, ChevronLeft, FileText, Landmark } from 'lucide-react'
import { toast } from 'sonner'
import type { RoomStore } from '@/entities/room'
import type { LocusStore } from '@/entities/locus'
import type { QuestionStore } from '@/entities/question'
import { ContentImportError, type ImportedRoom, parseVerseChapters } from '@/shared/lib'
import { Button, ImportRow, Sheet, Textarea } from '@/shared/ui'
import { readAnkiFile, readContentFile, readPalaceFile } from '../import-content'
import { importRooms, type ImportRoomsResult } from '../import-rooms'

type DeckKind = 'deck' | 'palace'

export interface ImportRoomsSheetProps {
  palaceId: string
  roomStore: RoomStore
  locusStore: LocusStore
  questionStore: QuestionStore
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful import (e.g. to scroll to / open the new rooms). */
  onImported?: (result: ImportRoomsResult) => void
}

/** Tidy a file name into a room title: drop the extension, soften separators. */
function roomTitleFromFile(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim() || 'Imported'
  )
}

/**
 * Palace-level import: bring in a whole chapter or deck as its own room(s), not just
 * cards into one room. Pasted verses become one room per chapter; an Anki/CSV deck
 * becomes a room named after the file; a Mindscape palace file contributes all its
 * rooms. Every path funnels through the `importRooms` command.
 */
export function ImportRoomsSheet({
  palaceId,
  roomStore,
  locusStore,
  questionStore,
  open,
  onOpenChange,
  onImported,
}: ImportRoomsSheetProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'menu' | 'verses'>('menu')
  const [verseText, setVerseText] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileKind = useRef<DeckKind>('deck')

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

  const run = async (rooms: ImportedRoom[]) => {
    if (busy) return
    if (rooms.length === 0) {
      toast.warning(t('importRooms.toast.empty'))
      return
    }
    setBusy(true)
    try {
      const result = await importRooms(roomStore, locusStore, questionStore, palaceId, rooms)
      toast.success(
        t(result.rooms === 1 ? 'importRooms.toast.addedOne' : 'importRooms.toast.addedOther', {
          count: result.rooms,
          cards: result.loci,
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

  const pickFile = (accept: string, kind: DeckKind) => {
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
      if (fileKind.current === 'palace') {
        const data = await readPalaceFile(file)
        await run(data.rooms)
      } else {
        const lower = file.name.toLowerCase()
        const content = lower.endsWith('.csv')
          ? await readContentFile(file)
          : await readAnkiFile(file)
        await run([{ title: roomTitleFromFile(file.name), ...content }])
      }
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('importRooms.toast.error'),
      )
    }
  }

  const createVerseRooms = () =>
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
              onClick={createVerseRooms}
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
              onClick={() => pickFile('.txt,.tsv,.csv', 'deck')}
            />
            <ImportRow
              icon={<Landmark className="size-5" aria-hidden />}
              tone="positive"
              badge="JSON"
              title={t('importRooms.palaceFile')}
              subtitle={t('importRooms.palaceFileSub')}
              onClick={() => pickFile('.json', 'palace')}
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
