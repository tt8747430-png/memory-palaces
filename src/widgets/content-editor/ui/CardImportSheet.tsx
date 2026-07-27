import { type ChangeEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardPaste, Layers } from 'lucide-react'
import { ImportRow, Sheet } from '@/shared/ui'

export interface CardImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPasteNotes: () => void
  onPickFile: (file: File) => void
}

/** How cards get into an existing deck: a file, or pasted notes. */
export function CardImportSheet({
  open,
  onOpenChange,
  onPasteNotes,
  onPickFile,
}: CardImportSheetProps) {
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
        title={t('cards.transfer.importTitle')}
        description={t('cards.transfer.importSubtitle')}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <ImportRow
            icon={<Layers className="size-5" aria-hidden />}
            tone="warning"
            badge="CSV · TSV · TXT"
            title={t('cards.transfer.importAnki')}
            subtitle={t('cards.transfer.importAnkiSub')}
            onClick={() => {
              onOpenChange(false)
              fileRef.current?.click()
            }}
          />
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
