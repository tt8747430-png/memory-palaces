import { useTranslation } from 'react-i18next'
import { Download, FileText, Upload } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  ImportRow,
  openOverlay,
  type OverlayResolver,
  useOverlayController,
} from '@/shared/ui'

/**
 * The questions transfer drawers. Cards get a chooser with two routes; questions only travel as
 * CSV today, so each drawer lists a single row — the shape stays a drawer (not a bare file input)
 * because it is where the second format lands, and because the export row has to be able to
 * present itself as disabled when the deck has nothing to export.
 */

/** Resolves `'csv'` when the learner picked the file route, `null` on dismiss. */
export function openQuestionImportDrawer(): Promise<'csv' | null> {
  return openOverlay<'csv' | null>((resolve) => <ImportBody resolve={resolve} />)
}

/** Resolves `'csv'` when the learner picked an export format, `null` on dismiss. */
export function openQuestionExportDrawer(options: { disabled?: boolean }): Promise<'csv' | null> {
  return openOverlay<'csv' | null>((resolve) => (
    <ExportBody disabled={options.disabled ?? false} resolve={resolve} />
  ))
}

function ImportBody({ resolve }: { resolve: OverlayResolver<'csv' | null> }) {
  const { t } = useTranslation()
  const { open, close, onOpenChangeComplete } = useOverlayController(resolve)

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close(null)
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('questions.transfer.importTitle')}</DrawerTitle>
          <DrawerDescription>{t('questions.transfer.importSubtitle')}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2.5 px-4 pb-2 pt-1.5">
          <ImportRow
            icon={<Upload className="size-5" aria-hidden />}
            tone="accent"
            badge="CSV"
            title={t('questions.transfer.importFile')}
            subtitle={t('questions.transfer.importFileSub')}
            onClick={() => close('csv')}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function ExportBody({
  disabled,
  resolve,
}: {
  disabled: boolean
  resolve: OverlayResolver<'csv' | null>
}) {
  const { t } = useTranslation()
  const { open, close, onOpenChangeComplete } = useOverlayController(resolve)

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close(null)
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('questions.transfer.exportTitle')}</DrawerTitle>
          <DrawerDescription>{t('questions.transfer.exportSubtitle')}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2.5 px-4 pb-2 pt-1.5">
          <ImportRow
            icon={<FileText className="size-5" aria-hidden />}
            tone="positive"
            badge="CSV"
            trailing={<Download className="size-5 shrink-0 text-faint" aria-hidden />}
            title={t('questions.transfer.exportCsv')}
            subtitle={t('questions.transfer.exportCsvSub')}
            disabled={disabled}
            onClick={() => close('csv')}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
