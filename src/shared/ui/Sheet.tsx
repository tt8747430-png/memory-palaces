import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useDragToDismiss } from './use-drag-to-dismiss'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className,
}: SheetProps) {
  const { y, controls, startDrag, onDragEnd } = useDragToDismiss({
    open,
    onDismiss: () => onOpenChange(false),
  })
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal="trap-focus">
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            'fixed inset-0 z-[300] bg-[color-mix(in_oklch,var(--primary)_28%,transparent)]',
            'transition-opacity duration-300 ease-out',
            'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          )}
        />
        <Dialog.Popup
          className={cn(
            'fixed inset-x-0 bottom-0 z-[310] mx-auto w-full max-w-[430px] outline-none',
            'transition-transform duration-300 ease-out',
            'data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
          )}
        >
          <motion.div
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.18 }}
            style={{ y }}
            onDragEnd={onDragEnd}
            className={cn(
              'flex max-h-[88dvh] flex-col rounded-t-card-featured bg-card pb-safe shadow-elevated',
              className,
            )}
          >
            <div
              onPointerDown={startDrag}
              className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
            >
              <div aria-hidden className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border" />
              <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-3">
                <div className="min-w-0">
                  <Dialog.Title className="text-[length:var(--p-text-sub)] font-semibold text-heading">
                    {title}
                  </Dialog.Title>
                  {description ? (
                    <Dialog.Description className="mt-0.5 text-[length:var(--p-text-label)]">
                      {description}
                    </Dialog.Description>
                  ) : null}
                </div>
                <Dialog.Close
                  aria-label="Close"
                  onPointerDown={(event) => event.stopPropagation()}
                  className="grid size-9 shrink-0 place-items-center rounded-control text-heading hover:bg-info-surface"
                >
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
              </div>
            </div>
            {/* `min-h-0` lets this flex child shrink below its content so
                `overflow-y-auto` actually scrolls (e.g. a long move-target tree). */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-1.5">{children}</div>
            {footer ? (
              <div className="shrink-0 border-t border-border px-5 pt-3 pb-2">{footer}</div>
            ) : null}
          </motion.div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
