import { useTranslation } from 'react-i18next'
import { ClipboardPaste, FileText } from 'lucide-react'
import type { ImportOptionContribution } from '@/shared/lib'
import { TransferSheet } from './TransferSheet'
import { useFilePicker } from './use-file-picker'

export interface ImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onPasteNotes: () => void
  onPickFile: (file: File) => void
  /** Rows the enabled extensions contributed. Keys, not copy — resolved here, where `t` already is. */
  extraOptions?: ImportOptionContribution[]
  onSelectExtra?: (to: string) => void
}

const ACCEPT = '.csv,.tsv,.txt'

export function ImportSheet({
  open,
  onOpenChange,
  title,
  description,
  onPasteNotes,
  onPickFile,
  extraOptions,
  onSelectExtra,
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
          ...(extraOptions ?? []).map(({ titleKey, subtitleKey, to, ...row }) => ({
            ...row,
            tone: row.tone ?? ('brand' as const),
            title: t(titleKey as never),
            subtitle: t(subtitleKey as never),
            onSelect: () => onSelectExtra?.(to),
          })),
        ]}
      />
      {file.input}
    </>
  )
}
