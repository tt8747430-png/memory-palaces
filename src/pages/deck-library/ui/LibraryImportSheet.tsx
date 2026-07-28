import { useTranslation } from 'react-i18next'
import { ClipboardPaste, FileText } from 'lucide-react'
import { TransferSheet, useFilePicker } from '@/shared/ui'

export interface LibraryImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPasteNotes: () => void
  onPickFile: (file: File) => void
}

export function LibraryImportSheet({
  open,
  onOpenChange,
  onPasteNotes,
  onPickFile,
}: LibraryImportSheetProps) {
  const { t } = useTranslation()
  const file = useFilePicker('.csv,.tsv,.txt', onPickFile)

  return (
    <>
      <TransferSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('deck.importTitle')}
        description={t('deck.importSheetHint')}
        options={[
          {
            id: 'paste',
            icon: <ClipboardPaste className="size-5" aria-hidden />,
            tone: 'accent',
            title: t('cards.transfer.pasteNotes'),
            subtitle: t('cards.transfer.pasteNotesSub'),
            onSelect: onPasteNotes,
          },
          {
            id: 'file',
            icon: <FileText className="size-5" aria-hidden />,
            tone: 'warning',
            badge: 'CSV · TSV · TXT',
            title: t('cards.transfer.importAnki'),
            subtitle: t('cards.transfer.importAnkiSub'),
            onSelect: file.open,
          },
        ]}
      />
      {file.input}
    </>
  )
}
