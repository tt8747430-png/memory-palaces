import type { ComponentProps, ReactNode } from 'react'
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import { cn } from '@/shared/lib'

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogClose = AlertDialogPrimitive.Close

interface AlertDialogContentProps
  extends Omit<ComponentProps<typeof AlertDialogPrimitive.Popup>, 'className'> {
  className?: string
  /** Extra layer between backdrop and popup — e.g. a full-bleed decorative wash. */
  backdropClassName?: string
  children: ReactNode
}

/**
 * Portal + backdrop + centered popup. Alert dialogs are always modal and never
 * dismiss on outside press or Escape — resolve them through their own actions.
 */
function AlertDialogContent({ className, backdropClassName, children, ...props }: AlertDialogContentProps) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        className={cn(
          'fixed inset-0 z-[400] bg-[color-mix(in_oklch,var(--primary)_28%,transparent)]',
          'backdrop-blur-[2px] transition-opacity duration-200 ease-out',
          'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          backdropClassName,
        )}
      />
      <div className="pointer-events-none fixed inset-0 z-[500] grid place-items-center p-6">
        <AlertDialogPrimitive.Popup
          data-slot="alert-dialog-content"
          className={cn(
            'pointer-events-auto w-full max-w-[340px] origin-center',
            'rounded-card-featured bg-card p-6 text-center shadow-elevated outline-none',
            'transition-[transform,opacity] duration-200 ease-out',
            'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
        </AlertDialogPrimitive.Popup>
      </div>
    </AlertDialogPrimitive.Portal>
  )
}

interface AlertDialogTitleProps
  extends Omit<ComponentProps<typeof AlertDialogPrimitive.Title>, 'className'> {
  className?: string
}

function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        'text-balance text-[length:var(--p-text-headline)] font-bold text-heading',
        className,
      )}
      {...props}
    />
  )
}

interface AlertDialogDescriptionProps
  extends Omit<ComponentProps<typeof AlertDialogPrimitive.Description>, 'className'> {
  className?: string
}

function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        'mx-auto mt-2 max-w-[30ch] text-[length:var(--p-text-body)] leading-relaxed text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
}
