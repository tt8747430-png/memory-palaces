import { type ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Button } from './primitives/button'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from './primitives/alert-dialog'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  /**
   * Confirm first, close second. A screen that holds its pending act in a ref —
   * `usePendingAct` — clears that ref on close, so closing first would hand
   * `onConfirm` nothing to act on and the delete would silently do nothing.
   */
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <AlertDialogContent>
        {icon ? (
          <span
            aria-hidden
            className={cn(
              'mx-auto mb-4 grid size-14 place-items-center rounded-card-featured',
              destructive
                ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
                : 'text-primary-foreground shadow-interactive',
            )}
            style={
              destructive
                ? undefined
                : { background: 'linear-gradient(135deg, var(--primary), var(--accent))' }
            }
          >
            {icon}
          </span>
        ) : null}

        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}

        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            variant={destructive ? 'destructive' : 'default'}
            size="lg"
            className="w-full"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
          <AlertDialogClose
            className={cn(
              'flex h-12 w-full items-center justify-center rounded-control',
              'text-[length:var(--p-text-sub)] font-semibold text-heading',
              'transition-[transform,background-color] duration-150 ease-out',
              'hover:bg-info-surface active:scale-[0.98]',
            )}
          >
            {cancelLabel}
          </AlertDialogClose>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
