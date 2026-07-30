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
  initialFocus?: RefObject<HTMLElement | null> | boolean
}

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
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-control text-heading hover:bg-info-surface"
            >
              <X className="size-4.5" aria-hidden />
            </DrawerClose>
          </DrawerHeader>
          <div className="min-h-0 flex-1 touch-auto overflow-y-auto overscroll-contain px-5 pb-2 pt-1">
            {children}
          </div>
          {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  )
}
