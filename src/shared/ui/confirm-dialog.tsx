import type { ReactNode } from 'react'
import { openOverlay, useOverlayController, type OverlayResolver } from './overlay-host'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog'

export interface ConfirmDialogOptions {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
}

/**
 * Opens a controlled shadcn AlertDialog that starts open and resolves `true` on confirm,
 * `false` on cancel or any dismiss (backdrop click, Escape). The overlay entry unmounts only
 * after Base UI's close transition finishes (see `useOverlayController`), so dismissals animate
 * instead of cutting instantly.
 */
export function openConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return openOverlay<boolean>((resolve) => <ConfirmDialogBody {...options} resolve={resolve} />)
}

function ConfirmDialogBody({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  resolve,
}: ConfirmDialogOptions & { resolve: OverlayResolver<boolean> }) {
  const { open, close, onOpenChangeComplete } = useOverlayController(resolve)

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close(false)
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={tone === 'danger' ? 'destructive' : 'default'}
            onClick={() => close(true)}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
