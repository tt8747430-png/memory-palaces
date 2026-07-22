import type { ReactNode, RefObject } from 'react'
import { X } from 'lucide-react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerVirtualKeyboardProvider,
} from './primitives/drawer'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  /**
   * Element to focus when the sheet opens. Defaults to Base UI's first-tabbable behaviour;
   * pass an input ref (e.g. from a prompt) to land the caret there instead.
   */
  initialFocus?: RefObject<HTMLElement | null> | boolean
}

/**
 * Bottom sheet on Base UI's Drawer. Native swipe-to-dismiss replaces the old hand-rolled drag,
 * and `VirtualKeyboardProvider` lifts the sheet above the on-screen keyboard on iOS — the job
 * vaul's `repositionInputs` used to do.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className,
  initialFocus,
}: SheetProps) {
  return (
    <Drawer open={open} onOpenChange={(next) => onOpenChange(next)}>
      {/* VirtualKeyboardProvider must sit inside Drawer.Root and wrap the Viewport (rendered by
          DrawerContent) — it reads keyboard-aware measurements from the drawer store. */}
      <DrawerVirtualKeyboardProvider>
        <DrawerContent className={className} initialFocus={initialFocus}>
          <DrawerHandle />
          <DrawerHeader>
            <div className="min-w-0">
              <DrawerTitle>{title}</DrawerTitle>
              {description ? <DrawerDescription>{description}</DrawerDescription> : null}
            </div>
            <DrawerClose
              aria-label="Close"
              className="grid size-9 shrink-0 place-items-center rounded-control text-heading hover:bg-info-surface"
            >
              <X className="size-5" aria-hidden />
            </DrawerClose>
          </DrawerHeader>
          {/* `min-h-0` lets this flex child shrink below its content so `overflow-y-auto` scrolls. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-1.5">{children}</div>
          {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  )
}
