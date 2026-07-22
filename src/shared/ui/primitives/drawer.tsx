import type { ComponentProps, ReactNode } from 'react'
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'
import { cn } from '@/shared/lib'

/**
 * Bottom sheet on Base UI's Drawer. Base UI drives the slide + swipe-to-dismiss
 * natively (`swipeDirection="down"`, `--drawer-swipe-movement-y`), so we no longer
 * hand-roll drag gestures. Wrap a Drawer that hosts a text field in
 * `DrawerVirtualKeyboardProvider` so the sheet lifts above the on-screen keyboard
 * on iOS (where Safari demotes `position: fixed` once the keyboard is up).
 */
function Drawer({ swipeDirection = 'down', ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" swipeDirection={swipeDirection} {...props} />
}

const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerClose = DrawerPrimitive.Close
const DrawerVirtualKeyboardProvider = DrawerPrimitive.VirtualKeyboardProvider

interface DrawerContentProps extends Omit<ComponentProps<typeof DrawerPrimitive.Popup>, 'className'> {
  className?: string
  /** Style hook for the dimming backdrop behind the sheet. */
  backdropClassName?: string
  children: ReactNode
}

/**
 * Portal + backdrop + the sliding sheet panel. Children compose the sheet's chrome
 * (`DrawerHandle`, `DrawerHeader`, a scrollable body, `DrawerFooter`) inside the panel.
 */
function DrawerContent({ className, backdropClassName, children, ...props }: DrawerContentProps) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        className={cn(
          'fixed inset-0 z-[300] bg-[color-mix(in_oklch,var(--primary)_28%,transparent)]',
          'opacity-[calc(1-var(--drawer-swipe-progress,0))]',
          'transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[swiping]:duration-0',
          backdropClassName,
        )}
      />
      <DrawerPrimitive.Viewport className="pointer-events-none fixed inset-0 z-[310]">
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            'pointer-events-auto fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[430px] flex-col',
            'max-h-[88dvh] rounded-t-card-featured bg-card pb-safe shadow-elevated outline-none',
            'origin-bottom will-change-transform',
            '[--closed-transform:translate3d(0,calc(100%+2px),0)]',
            'transform-[translate3d(0,var(--drawer-swipe-movement-y,0px),0)]',
            'transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
            'data-[starting-style]:transform-[var(--closed-transform)]',
            'data-[ending-style]:transform-[var(--closed-transform)] data-[swiping]:duration-0',
            className,
          )}
          {...props}
        >
          <DrawerPrimitive.Content className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

/** Visual grab affordance. The whole sheet is swipeable, so this is decorative. */
function DrawerHandle({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      data-slot="drawer-handle"
      className={cn('mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-border', className)}
    />
  )
}

function DrawerHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex shrink-0 items-start justify-between gap-3 px-5 pt-2 pb-3', className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('shrink-0 border-t border-border px-5 pt-3 pb-2', className)}
      {...props}
    />
  )
}

interface DrawerTitleProps extends Omit<ComponentProps<typeof DrawerPrimitive.Title>, 'className'> {
  className?: string
}

function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-[length:var(--p-text-sub)] font-semibold text-heading', className)}
      {...props}
    />
  )
}

interface DrawerDescriptionProps
  extends Omit<ComponentProps<typeof DrawerPrimitive.Description>, 'className'> {
  className?: string
}

function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('mt-0.5 text-[length:var(--p-text-label)] text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerVirtualKeyboardProvider,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
