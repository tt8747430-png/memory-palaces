import { type ChangeEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardPaste, FileText } from 'lucide-react'
import { ImportRow, Sheet } from '@/shared/ui'

export interface LibraryImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPasteNotes: () => void
  onPickFile: (file: File) => void
}

/**
 * How cards get in from the library: paste them, or hand over a file. The hidden `<input>` lives
 * with the row that opens it so the page never has to hold a ref for someone else's control.
 */
export function LibraryImportSheet({
  open,
  onOpenChange,
  onPasteNotes,
  onPickFile,
}: LibraryImportSheetProps) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onPickFile(file)
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('deck.importTitle')}
        description={t('deck.importSheetHint')}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <ImportRow
            icon={<ClipboardPaste className="size-5" aria-hidden />}
            tone="accent"
            title={t('cards.transfer.pasteNotes')}
            subtitle={t('cards.transfer.pasteNotesSub')}
            onClick={() => {
              onOpenChange(false)
              onPasteNotes()
            }}
          />
          <ImportRow
            icon={<FileText className="size-5" aria-hidden />}
            tone="warning"
            badge="CSV · TSV · TXT"
            title={t('cards.transfer.importAnki')}
            subtitle={t('cards.transfer.importAnkiSub')}
            onClick={() => {
              onOpenChange(false)
              fileRef.current?.click()
            }}
          />
        </div>
      </Sheet>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.tsv,.txt"
        className="hidden"
        onChange={onChange}
        aria-hidden
        tabIndex={-1}
      />
    </>
  )
}
