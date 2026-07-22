import { type ReactNode, useEffect, useRef } from 'react'
import { cn } from '@/shared/lib'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
} from './primitives/drawer'

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
  const openedAt = useRef(0)
  useEffect(() => {
    if (open) openedAt.current = Date.now()
  }, [open])

  const select = (action: SheetAction) => {
    onOpenChange(false)
    action.onSelect()
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next, details) => {
        // Swallow the release of the very tap that opened the sheet, which Base UI would
        // otherwise read as an outside-press / focus-out and close it instantly.
        if (
          !next &&
          (details.reason === 'outside-press' || details.reason === 'focus-out') &&
          Date.now() - openedAt.current < OPEN_GUARD_MS
        ) {
          return
        }
        onOpenChange(next)
      }}
    >
      <DrawerContent className="px-4 pt-2">
        <DrawerHandle className="mt-1" />
        <div className="px-2 pt-3 pb-1">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
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

        <DrawerClose
          className={cn(
            'mb-1 flex h-12 items-center justify-center rounded-control bg-info-surface',
            'text-[length:var(--p-text-body)] font-semibold text-heading',
            'transition-transform duration-150 ease-out active:scale-[0.99]',
          )}
        >
          {cancelLabel}
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  )
}
