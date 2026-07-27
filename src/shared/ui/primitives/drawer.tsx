import type { ComponentProps, MouseEvent, PointerEvent, ReactNode } from 'react'
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'
import { cn } from '@/shared/lib'

/** Places a caret rather than holding a selection — a touch here is typing, not a drag. */
const TEXT_ENTRY = 'input, textarea, [contenteditable="true"], .allow-select'

/**
 * Collapse a lingering text selection so a downward drag is read as a swipe.
 *
 * Base UI declines its swipe while any text is selected inside the drawer — including the
 * whole-value selection `useAutoSelect` leaves in a freshly opened prompt — so that native
 * selection handles stay draggable. With the swipe declined the browser falls back to a native
 * scroll and the page moves instead of the sheet. Collapsing on pointer-down, before Base UI
 * evaluates the gesture, hands the drag back to the sheet.
 *
 * This runs for the whole sheet interior (not just the handle), so it must not steal a selection
 * the learner is actually holding: a touch that lands in a field or a selectable passage is left
 * alone. Everything else in the app is `user-select: none`, so nothing else can own a selection.
 */
function clearSelectionForDrag(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === 'mouse') return
  if (event.target instanceof Element && event.target.closest(TEXT_ENTRY)) return

  const active = document.activeElement
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    const caret = active.value.length
    try {
      active.setSelectionRange(caret, caret)
    } catch {
      // Inputs such as email/number don't support setSelectionRange — nothing to collapse.
    }
  }

  const selection = document.getSelection()
  if (selection && !selection.isCollapsed) selection.removeAllRanges()
}

/**
 * Keep the on-screen keyboard up while a chrome control is tapped.
 *
 * On iOS a tap on any non-input element blurs the focused field. The keyboard then collapses,
 * `--drawer-keyboard-inset` drops to zero, and the pinned footer slides down out from under the
 * finger — so the `click` lands on nothing and the first tap only appears to dismiss the
 * keyboard. Cancelling the focus shift on `mousedown` holds the geometry still through the
 * click; the keyboard goes away afterwards when the sheet closes and the field unmounts.
 */
function keepFieldFocused(event: MouseEvent<HTMLElement>) {
  const active = document.activeElement
  if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) return
  if (event.target instanceof Element && event.target.closest(TEXT_ENTRY)) return
  event.preventDefault()
}

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

interface DrawerContentProps extends Omit<
  ComponentProps<typeof DrawerPrimitive.Popup>,
  'className'
> {
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
            // `touch-none` keeps the browser from treating a drag on the sheet chrome as a native
            // page scroll (the scrollable body re-enables it with `touch-auto`); `pb-safe-keyboard`
            // lifts the pinned footer above the on-screen keyboard via `--drawer-keyboard-inset`.
            'max-h-[88dvh] touch-none rounded-t-card-featured bg-card pb-safe-keyboard shadow-elevated outline-none',
            'origin-bottom will-change-transform',
            '[--closed-transform:translate3d(0,calc(100%+2px),0)]',
            'transform-[translate3d(0,var(--drawer-swipe-movement-y,0px),0)]',
            'transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
            'data-[starting-style]:transform-[var(--closed-transform)]',
            'data-[ending-style]:transform-[var(--closed-transform)] data-[swiping]:duration-0 data-[swiping]:select-none',
            className,
          )}
          {...props}
        >
          {/* The selection guard sits on the whole interior, not just the handle: Base UI reads
              the selection when the gesture starts on the Popup, and this is the last element
              a touch bubbles through before it gets there. */}
          <DrawerPrimitive.Content
            onPointerDown={clearSelectionForDrag}
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]"
          >
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
      className={cn(
        'mx-auto mt-2 mb-0.5 h-1 w-9 shrink-0 touch-none rounded-full bg-border select-none',
        className,
      )}
    />
  )
}

/**
 * The sheet's chrome is deliberately thin: a bottom sheet is capped at 88dvh, so every pixel
 * spent on header and footer padding is a pixel the content cannot use. Both bars hold the
 * focused field so their controls survive the first tap (see `keepFieldFocused`).
 */
function DrawerHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      onMouseDown={keepFieldFocused}
      className={cn(
        'flex shrink-0 touch-none items-start justify-between gap-3 px-5 pt-1 pb-2 select-none',
        className,
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      onMouseDown={keepFieldFocused}
      className={cn('shrink-0 border-t border-border px-5 pt-2 pb-1.5', className)}
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

interface DrawerDescriptionProps extends Omit<
  ComponentProps<typeof DrawerPrimitive.Description>,
  'className'
> {
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
