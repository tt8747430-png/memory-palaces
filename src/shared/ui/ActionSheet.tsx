import { type ReactNode, useEffect, useRef } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib'
import { useDragToDismiss } from './use-drag-to-dismiss'

const OPEN_GUARD_MS = 500

export interface SheetAction {
  id: string
  label: string
  icon?: ReactNode
  destructive?: boolean
  disabled?: boolean
  selected?: boolean
  onSelect: () => void
}

export interface ActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  actions: SheetAction[]
  cancelLabel: string
}

export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
  cancelLabel,
}: ActionSheetProps) {
  const { y, controls, startDrag, onDragEnd } = useDragToDismiss({
    open,
    onDismiss: () => onOpenChange(false),
  })

  const openedAt = useRef(0)
  useEffect(() => {
    if (open) openedAt.current = Date.now()
  }, [open])

  const select = (action: SheetAction) => {
    onOpenChange(false)
    action.onSelect()
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next, details) => {
        if (
          !next &&
          (details.reason === 'outside-press' || details.reason === 'focus-out') &&
          Date.now() - openedAt.current < OPEN_GUARD_MS
        ) {
          return
        }
        onOpenChange(next)
      }}
      modal="trap-focus"
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            'fixed inset-0 z-[400] bg-[color-mix(in_oklch,var(--primary)_28%,transparent)]',
            'transition-opacity duration-300 ease-out',
            'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          )}
        />
        <Dialog.Popup
          className={cn(
            'fixed inset-x-0 bottom-0 z-[500] mx-auto w-full max-w-[430px] outline-none',
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
            className="flex flex-col rounded-t-card-featured bg-card px-4 pb-safe pt-2 shadow-elevated"
          >
            <div
              onPointerDown={startDrag}
              className="cursor-grab touch-none select-none active:cursor-grabbing"
            >
              <div aria-hidden className="mx-auto mt-1 h-1.5 w-10 rounded-full bg-border" />
              <div className="px-2 pt-3 pb-1">
                <Dialog.Title className="text-[length:var(--p-text-sub)] font-semibold text-heading">
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-0.5 text-[length:var(--p-text-label)] text-muted-foreground">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-0.5 pb-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={action.disabled}
                  onClick={() => select(action)}
                  className={cn(
                    'flex h-12 items-center gap-3 rounded-control px-3 text-left',
                    'text-[length:var(--p-text-body)] font-medium',
                    'transition-transform duration-150 ease-out active:scale-[0.99]',
                    'disabled:pointer-events-none disabled:opacity-50',
                    action.destructive
                      ? 'text-[var(--danger-on-surface)] hover:bg-[var(--danger-surface)]'
                      : 'text-heading hover:bg-info-surface',
                  )}
                >
                  {action.icon ? (
                    <span className="grid size-5 shrink-0 place-items-center" aria-hidden>
                      {action.icon}
                    </span>
                  ) : null}
                  {action.label}
                </button>
              ))}
            </div>

            <Dialog.Close
              className={cn(
                'mb-1 flex h-12 items-center justify-center rounded-control bg-info-surface',
                'text-[length:var(--p-text-body)] font-semibold text-heading',
                'transition-transform duration-150 ease-out active:scale-[0.99]',
              )}
            >
              {cancelLabel}
            </Dialog.Close>
          </motion.div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
