import { type ChangeEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FileText, Upload } from 'lucide-react'
import { ImportRow, Sheet } from '@/shared/ui'

export interface QuestionTransferSheetsProps {
  importOpen: boolean
  onImportOpenChange: (open: boolean) => void
  onPickFile: (file: File) => void
  exportOpen: boolean
  onExportOpenChange: (open: boolean) => void
  canExport: boolean
  onExportCsv: () => void
}

/** Questions in and out of a deck: the import picker and the export row, both CSV. */
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
  const fileRef = useRef<HTMLInputElement>(null)

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onPickFile(file)
  }

  return (
    <>
      <Sheet
        open={importOpen}
        onOpenChange={onImportOpenChange}
        title={t('questions.transfer.importTitle')}
        description={t('questions.transfer.importSubtitle')}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <ImportRow
            icon={<Upload className="size-5" aria-hidden />}
            tone="accent"
            badge="CSV"
            title={t('questions.transfer.importFile')}
            subtitle={t('questions.transfer.importFileSub')}
            onClick={() => {
              onImportOpenChange(false)
              fileRef.current?.click()
            }}
          />
        </div>
      </Sheet>

      <Sheet
        open={exportOpen}
        onOpenChange={onExportOpenChange}
        title={t('questions.transfer.exportTitle')}
        description={t('questions.transfer.exportSubtitle')}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <ImportRow
            icon={<FileText className="size-5" aria-hidden />}
            tone="positive"
            badge="CSV"
            trailing={<Download className="size-5 shrink-0 text-faint" aria-hidden />}
            title={t('questions.transfer.exportCsv')}
            subtitle={t('questions.transfer.exportCsvSub')}
            disabled={!canExport}
            onClick={() => {
              onExportOpenChange(false)
              onExportCsv()
            }}
          />
        </div>
      </Sheet>

      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onChange}
        aria-hidden
        tabIndex={-1}
      />
    </>
  )
}
