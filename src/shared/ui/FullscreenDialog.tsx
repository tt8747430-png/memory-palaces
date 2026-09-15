import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/shared/lib'

export interface FullscreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
  children: ReactNode
}

export function FullscreenDialog({
  open,
  onOpenChange,
  className,
  children,
}: FullscreenDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal="trap-focus">
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            'fixed inset-0 z-(--z-sheet-backdrop) bg-[color-mix(in_oklch,var(--scrim)_52%,transparent)] backdrop-blur-md',
            'transition-opacity duration-300 ease-out',
            'data-starting-style:opacity-0 data-ending-style:opacity-0',
          )}
        />
        <Dialog.Popup
          className={cn(
            'fixed inset-0 z-(--z-sheet) mx-auto w-full max-w-app outline-none',
            'transition-[opacity,transform] duration-300 ease-out',
            'data-starting-style:scale-[0.98] data-starting-style:opacity-0',
            'data-ending-style:scale-[0.98] data-ending-style:opacity-0',
            className,
          )}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
