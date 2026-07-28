import { useTranslation } from 'react-i18next'
import { ClipboardPaste, Layers } from 'lucide-react'
import { TransferSheet, useFilePicker } from '@/shared/ui'

export interface CardImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPasteNotes: () => void
  onPickFile: (file: File) => void
}

export function CardImportSheet({
  open,
  onOpenChange,
  onPasteNotes,
  onPickFile,
}: CardImportSheetProps) {
  const { t } = useTranslation()
  const file = useFilePicker('.csv,.tsv,.txt', onPickFile)

  return (
    <>
      <TransferSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('cards.transfer.importTitle')}
        description={t('cards.transfer.importSubtitle')}
        options={[
          {
            id: 'file',
            icon: <Layers className="size-5" aria-hidden />,
            tone: 'warning',
            badge: 'CSV · TSV · TXT',
            title: t('cards.transfer.importAnki'),
            subtitle: t('cards.transfer.importAnkiSub'),
            onSelect: file.open,
          },
          {
            id: 'paste',
            icon: <ClipboardPaste className="size-5" aria-hidden />,
            tone: 'accent',
            title: t('cards.transfer.pasteNotes'),
            subtitle: t('cards.transfer.pasteNotesSub'),
            onSelect: onPasteNotes,
          },
        ]}
      />
      {file.input}
    </>
  )
}
