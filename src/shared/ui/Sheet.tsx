import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  /** Optional supporting line under the title. */
  description?: ReactNode
  /** Pinned action row at the foot of the sheet (e.g. Save / Finish). */
  footer?: ReactNode
  children: ReactNode
  className?: string
}

/** Bottom sheet built on Base UI's Dialog (focus-trapped, scroll-locked, escape /
 * backdrop dismissible). Slides up via Base UI's transition data-attributes — no
 * animation library needed. Reserved for transient study controls; the page chrome
 * stays in `ScreenHeader`. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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
            'fixed inset-x-0 bottom-0 z-[310] mx-auto flex max-h-[88dvh] w-full max-w-[430px] flex-col',
            'rounded-t-card-featured bg-card pb-safe shadow-elevated outline-none',
            'transition-transform duration-300 ease-out',
            'data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
            className,
          )}
        >
          <div aria-hidden className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-border" />
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
              className="grid size-9 shrink-0 place-items-center rounded-control text-heading hover:bg-info-surface"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-3">{children}</div>
          {footer ? (
            <div className="shrink-0 border-t border-border px-5 pt-3 pb-2">{footer}</div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
