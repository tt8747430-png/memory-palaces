import { useTranslation } from 'react-i18next'
import { ClipboardPaste, Layers } from 'lucide-react'
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

/** Which way the learner chose to bring cards in. */
export type ImportChoice = 'anki' | 'paste'

/**
 * Opens the "how do you want to import?" chooser, resolving the chosen route or `null`
 * on dismiss. Both options ship: the Anki half reads a file through `@/import`'s
 * `readAnkiFile`, the paste half hands off to the caller's paste screen.
 */
export function openImportChooserDrawer(): Promise<ImportChoice | null> {
  return openOverlay<ImportChoice | null>((resolve) => <ImportChooserBody resolve={resolve} />)
}

function ImportChooserBody({ resolve }: { resolve: OverlayResolver<ImportChoice | null> }) {
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
          <DrawerTitle>{t('cards.transfer.importTitle')}</DrawerTitle>
          <DrawerDescription>{t('cards.transfer.importSubtitle')}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2.5 px-4 pb-2 pt-1.5">
          <ImportRow
            icon={<Layers className="size-5" aria-hidden />}
            tone="warning"
            badge="CSV · TSV · TXT"
            title={t('cards.transfer.importAnki')}
            subtitle={t('cards.transfer.importAnkiSub')}
            onClick={() => close('anki')}
          />
          <ImportRow
            icon={<ClipboardPaste className="size-5" aria-hidden />}
            tone="accent"
            title={t('cards.transfer.pasteNotes')}
            subtitle={t('cards.transfer.pasteNotesSub')}
            onClick={() => close('paste')}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
