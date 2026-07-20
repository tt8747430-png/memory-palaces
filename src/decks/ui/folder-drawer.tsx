import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, FolderPlus } from 'lucide-react'
import { DECK_COLOR_OPTIONS, DEFAULT_FOLDER_ICON, type Folder } from '@/decks'
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  openOverlay,
  useOverlayController,
  type OverlayResolver,
} from '@/shared/ui'
import { FolderForm } from './folder-form'

export interface FolderDraft {
  name: string
  color: string
  icon: string
}

export interface OpenFolderDrawerOptions {
  /** Edit this folder; omit to create a new one. */
  folder?: Folder
  /** Suggested color for a new folder (e.g. the next unused color in the palette rotation). */
  defaultColor?: string
  /** Suggested name for a new folder. */
  defaultName?: string
}

/**
 * Opens a controlled Drawer wrapping `FolderForm` that starts open and resolves the trimmed
 * `{ name, color, icon }` draft on save, or `null` on cancel/dismiss (backdrop, swipe, Escape).
 * The overlay entry unmounts only after Base UI's close transition finishes (see
 * `useOverlayController`), so dismissals animate instead of cutting instantly.
 *
 * Mirrors `openPromptDrawer`'s shape: `main`'s `FolderSheet` was a render-prop component driven by
 * `DeckLibraryPage`'s `folderSheetTarget` state; here the caller just awaits the promise —
 * `const draft = await openFolderDrawer({ folder })`.
 */
export function openFolderDrawer(
  options: OpenFolderDrawerOptions = {},
): Promise<FolderDraft | null> {
  return openOverlay<FolderDraft | null>((resolve) => (
    <FolderDrawerBody {...options} resolve={resolve} />
  ))
}

function FolderDrawerBody({
  folder,
  defaultColor,
  defaultName = '',
  resolve,
}: OpenFolderDrawerOptions & { resolve: OverlayResolver<FolderDraft | null> }) {
  const { t } = useTranslation()
  const isEdit = folder != null
  const [name, setName] = useState(folder?.name ?? defaultName)
  const [color, setColor] = useState(folder?.color || defaultColor || DECK_COLOR_OPTIONS[0]!.value)
  const [icon, setIcon] = useState(folder?.icon || DEFAULT_FOLDER_ICON)
  const { open, close, onOpenChangeComplete } = useOverlayController(resolve)

  const valid = name.trim().length > 0
  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!valid) return
    close({ name: name.trim(), color, icon })
  }

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
          <DrawerTitle>{isEdit ? t('folder.settingsTitle') : t('folder.newTitle')}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={submit} className="px-4 pt-1.5 pb-2">
          <FolderForm
            name={name}
            color={color}
            icon={icon}
            onNameChange={setName}
            onColorChange={setColor}
            onIconChange={setIcon}
            autoFocusName={!isEdit}
          />
        </form>
        <DrawerFooter>
          <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
            {isEdit ? (
              <Check className="size-[18px]" aria-hidden />
            ) : (
              <FolderPlus className="size-[18px]" aria-hidden />
            )}
            {isEdit ? t('folder.save') : t('folder.create')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
