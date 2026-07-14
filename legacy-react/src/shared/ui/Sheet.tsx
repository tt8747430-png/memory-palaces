import type { ReactNode } from 'react'
import { Drawer } from 'vaul'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Bottom sheet built on Vaul. Vaul's `repositionInputs` lifts the drawer above the on-screen
 * keyboard from the visual viewport, which is the only thing that works on iOS — there Safari
 * demotes `position: fixed` to static once the keyboard is up, so hand-rolled `bottom` offsets
 * fight the browser and lose. `handleOnly` keeps the drag affordance on the grab handle so the
 * sheet's own controls (sliders, drag-and-drop trees, inputs) never get hijacked by a dismiss
 * drag. `noBodyStyles` leaves scroll-locking to the app shell, which already pins the page.
 */
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
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs handleOnly noBodyStyles>
      <Drawer.Portal>
        <Drawer.Overlay
          className={cn(
            'fixed inset-0 z-[300] bg-[color-mix(in_oklch,var(--primary)_28%,transparent)]',
          )}
        />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-[310] mx-auto flex max-h-[88dvh] w-full max-w-[430px] flex-col',
            'rounded-t-card-featured bg-card pb-safe shadow-elevated outline-none',
            className,
          )}
        >
          <div className="shrink-0">
            <Drawer.Handle className="mx-auto! mt-3! mb-1! h-1.5! w-10! rounded-full! bg-border!" />
            <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-3">
              <div className="min-w-0">
                <Drawer.Title className="text-(length:--p-text-sub) font-semibold text-heading">
                  {title}
                </Drawer.Title>
                {description ? (
                  <Drawer.Description className="mt-0.5 text-(length:--p-text-label) text-muted-foreground">
                    {description}
                  </Drawer.Description>
                ) : null}
              </div>
              <Drawer.Close
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-control text-heading hover:bg-info-surface"
              >
                <X className="size-5" aria-hidden />
              </Drawer.Close>
            </div>
          </div>
          {/* `min-h-0` lets this flex child shrink below its content so `overflow-y-auto` scrolls. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-1.5">{children}</div>
          {footer ? (
            <div className="shrink-0 border-t border-border px-5 pt-3 pb-2">{footer}</div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
