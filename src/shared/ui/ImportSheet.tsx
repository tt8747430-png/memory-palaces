import { useTranslation } from 'react-i18next'
import { ClipboardPaste, FileText } from 'lucide-react'
import { TransferSheet } from './TransferSheet'
import { useFilePicker } from './use-file-picker'

export interface ImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onPasteNotes: () => void
  onPickFile: (file: File) => void
}

const ACCEPT = '.csv,.tsv,.txt'

/**
 * The one way content gets in: paste it, or hand over a delimited file. Every importing surface
 * offers the same two doors under its own heading.
 */
export function ImportSheet({
  open,
  onOpenChange,
  title,
  description,
  onPasteNotes,
  onPickFile,
}: ImportSheetProps) {
  const { t } = useTranslation()
  const file = useFilePicker(ACCEPT, onPickFile)

  return (
    <>
      <TransferSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
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
