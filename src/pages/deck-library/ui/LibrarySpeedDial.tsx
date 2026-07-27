import { useTranslation } from 'react-i18next'
import { ClipboardPaste, FolderPlus, Layers } from 'lucide-react'
import { SpeedDial } from '@/shared/ui'

export interface LibrarySpeedDialProps {
  /** Inside a folder there is no "new folder" — a folder is not a place you nest folders. */
  inFolder: boolean
  canImport: boolean
  onNewDeck: () => void
  onImport: () => void
  onNewFolder: () => void
}

export function LibrarySpeedDial({
  inFolder,
  canImport,
  onNewDeck,
  onImport,
  onNewFolder,
}: LibrarySpeedDialProps) {
  const { t } = useTranslation()
  return (
    <SpeedDial
      label={t('deck.create')}
      actions={[
        {
          id: 'new-deck',
          label: inFolder ? t('folder.addDeck') : t('deck.newDeck'),
          icon: <Layers className="size-5" aria-hidden />,
          onSelect: onNewDeck,
        },
        ...(canImport
          ? [
              {
                id: 'import',
                label: t('deck.importCards'),
                icon: <ClipboardPaste className="size-5" aria-hidden />,
                onSelect: onImport,
              },
            ]
          : []),
        ...(inFolder
          ? []
          : [
              {
                id: 'new-folder',
                label: t('deck.newFolder'),
                icon: <FolderPlus className="size-5" aria-hidden />,
                onSelect: onNewFolder,
              },
            ]),
      ]}
    />
  )
}
