import { useTranslation } from 'react-i18next'
import { Download, FileText, Upload } from 'lucide-react'
import { TransferSheet, useFilePicker } from '@/shared/ui'

export interface QuestionTransferSheetsProps {
  importOpen: boolean
  onImportOpenChange: (open: boolean) => void
  onPickFile: (file: File) => void
  exportOpen: boolean
  onExportOpenChange: (open: boolean) => void
  canExport: boolean
  onExportCsv: () => void
}

export function QuestionTransferSheets({
  importOpen,
  onImportOpenChange,
  onPickFile,
  exportOpen,
  onExportOpenChange,
  canExport,
  onExportCsv,
}: QuestionTransferSheetsProps) {
  const { t } = useTranslation()
  const file = useFilePicker('.csv', onPickFile)

  return (
    <>
      <TransferSheet
        open={importOpen}
        onOpenChange={onImportOpenChange}
        title={t('questions.transfer.importTitle')}
        description={t('questions.transfer.importSubtitle')}
        options={[
          {
            id: 'file',
            icon: <Upload className="size-5" aria-hidden />,
            tone: 'accent',
            badge: 'CSV',
            title: t('questions.transfer.importFile'),
            subtitle: t('questions.transfer.importFileSub'),
            onSelect: file.open,
          },
        ]}
      />

      <TransferSheet
        open={exportOpen}
        onOpenChange={onExportOpenChange}
        title={t('questions.transfer.exportTitle')}
        description={t('questions.transfer.exportSubtitle')}
        options={[
          {
            id: 'csv',
            icon: <FileText className="size-5" aria-hidden />,
            tone: 'positive',
            badge: 'CSV',
            trailing: <Download className="size-5 shrink-0 text-faint" aria-hidden />,
            title: t('questions.transfer.exportCsv'),
            subtitle: t('questions.transfer.exportCsvSub'),
            disabled: !canExport,
            onSelect: onExportCsv,
          },
        ]}
      />
      {file.input}
    </>
  )
}
