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
  /** Omit to close the sheet by gesture alone — a card's actions need no Cancel row. */
  cancelLabel?: string
  /** The title still names the sheet for assistive tech; it just stops taking up a line. */
  hideTitle?: boolean
  /** `filled` gives every action its own tinted row, the way the card actions sheet reads. */
  variant?: 'plain' | 'filled'
}

export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
  cancelLabel,
  hideTitle = false,
  variant = 'plain',
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
        {hideTitle ? (
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
        ) : (
          <div className="px-2 pt-3 pb-1">
            <DrawerTitle>{title}</DrawerTitle>
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </div>
        )}

        <div className={cn('flex flex-col gap-0.5 pb-2', hideTitle ? 'mt-3' : 'mt-1')}>
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled}
              aria-current={action.selected ? 'true' : undefined}
              onClick={() => select(action)}
              className={cn(
                'flex h-12 items-center gap-3 rounded-control px-3 text-left',
                'text-(length:--p-text-body) font-medium',
                'transition-transform duration-150 ease-out active:scale-[0.99]',
                'disabled:pointer-events-none disabled:opacity-50',
                action.destructive
                  ? 'text-(--danger-on-surface) hover:bg-(--danger-surface)'
                  : 'text-heading hover:bg-info-surface',
                variant === 'filled' && 'mb-1.5 h-14 rounded-card bg-info-surface px-4',
                variant === 'filled' &&
                  action.destructive &&
                  'bg-(--danger-surface) text-(--danger-on-surface)',
                action.selected && 'text-accent',
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

        {cancelLabel ? (
          <DrawerClose
            className={cn(
              'mb-1 flex h-12 items-center justify-center rounded-control bg-info-surface',
              'text-(length:--p-text-body) font-semibold text-heading',
              'transition-transform duration-150 ease-out active:scale-[0.99]',
            )}
          >
            {cancelLabel}
          </DrawerClose>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
