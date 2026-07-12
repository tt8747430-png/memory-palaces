import { type ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/shared/lib'
import { Button } from './button'

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
  const handleConfirm = () => {
    onOpenChange(false)
    onConfirm()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal="trap-focus">
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            'fixed inset-0 z-[400] bg-[color-mix(in_oklch,var(--primary)_28%,transparent)]',
            'backdrop-blur-[2px] transition-opacity duration-200 ease-out',
            'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          )}
        />
        <div className="pointer-events-none fixed inset-0 z-[500] grid place-items-center p-6">
          <Dialog.Popup
            className={cn(
              'pointer-events-auto w-full max-w-[340px] origin-center',
              'rounded-card-featured bg-card p-6 text-center shadow-elevated outline-none',
              'transition-[transform,opacity] duration-200 ease-out',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            )}
          >
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

            <Dialog.Title className="text-[length:var(--p-text-headline)] font-bold text-balance text-heading">
              {title}
            </Dialog.Title>
            {description ? (
              <Dialog.Description className="mx-auto mt-2 max-w-[30ch] text-[length:var(--p-text-body)] leading-relaxed text-muted-foreground">
                {description}
              </Dialog.Description>
            ) : null}

            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                variant={destructive ? 'destructive' : 'primary'}
                size="lg"
                className="w-full"
                onClick={handleConfirm}
              >
                {confirmLabel}
              </Button>
              <Dialog.Close
                className={cn(
                  'flex h-12 w-full items-center justify-center rounded-control',
                  'text-[length:var(--p-text-sub)] font-semibold text-heading',
                  'transition-[transform,background-color] duration-150 ease-out',
                  'hover:bg-info-surface active:scale-[0.98]',
                )}
              >
                {cancelLabel}
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
