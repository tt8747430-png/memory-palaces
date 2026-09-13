import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/shared/lib'

export interface FullscreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
  children: ReactNode
}

/**
 * A surface that takes the whole screen: the card browser, the card-style preview. One component
 * because the two are the same object — a blurred backdrop, a popup the width of the app, and the
 * scale-and-fade that says it came from the page underneath — and a second copy of that is a second
 * set of transitions to keep in step, which is how the first copy shipped without `trap-focus`.
 *
 * `Dialog.Close`, `Dialog.Title` and the rest work inside `children`: the context is this Root's.
 */
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
