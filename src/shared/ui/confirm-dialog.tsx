import type { ReactNode } from 'react'
import { openOverlay } from './overlay-host'
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
 * `false` on cancel or any dismiss (backdrop click, Escape). The dialog is not itself
 * animated closed — resolving unmounts the overlay entry immediately.
 */
export function openConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  const {
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'default',
  } = options

  return openOverlay<boolean>((resolve) => (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) resolve(false)
      }}
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
            onClick={() => resolve(true)}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ))
}
