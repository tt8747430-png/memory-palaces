import type { ReactElement, ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'
import { Check, MoreVertical } from 'lucide-react'
import { cn } from '@/shared/lib'
import { IconButton, type IconButtonSize, type IconButtonVariant } from './icon-button'

/**
 * A row-anchored menu entry. Distinct from `ActionDrawerAction`: this menu is
 * declarative and callback-driven (it stays mounted with its trigger), where the
 * action Drawer is imperative and resolves a chosen id. Anchored popover and modal
 * Drawer are different categories, not two takes on one.
 */
export interface MenuAction {
  id: string
  label: string
  icon?: ReactNode
  destructive?: boolean
  disabled?: boolean
  selected?: boolean
  onSelect: () => void
}

export interface FlyoutMenuProps {
  label: string
  actions: MenuAction[]
  trigger?: ReactElement
  variant?: IconButtonVariant
  size?: IconButtonSize
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function FlyoutMenu({
  label,
  actions,
  trigger,
  variant = 'glass',
  size = 'sm',
  side = 'bottom',
  align = 'end',
  className,
}: FlyoutMenuProps) {
  const triggerElement = trigger ?? (
    <IconButton
      variant={variant}
      size={size}
      aria-label={label}
      className={className}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <MoreVertical className={size === 'md' ? 'size-5' : 'size-4'} aria-hidden />
    </IconButton>
  )

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger render={triggerElement} />
      <Menu.Portal>
        <Menu.Positioner side={side} align={align} sideOffset={6} collisionPadding={12}>
          <Menu.Popup
            className={cn(
              'min-w-52 origin-[var(--transform-origin)] rounded-card bg-card p-1.5',
              'shadow-elevated outline-none ring-1 ring-[color:var(--border-glass)]',
              'transition-[transform,opacity] duration-150 ease-out motion-reduce:transition-none',
              'data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0',
            )}
          >
            {actions.map((action) => (
              <Menu.Item
                key={action.id}
                disabled={action.disabled}
                onClick={action.onSelect}
                className={cn(
                  'flex h-11 cursor-default select-none items-center gap-3 rounded-control px-3',
                  'text-[length:var(--ms-text-body)] font-medium outline-none',
                  'transition-transform duration-150 ease-out active:scale-[0.99]',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  action.destructive
                    ? 'text-[var(--danger-on-surface)] data-[highlighted]:bg-[var(--danger-surface)]'
                    : action.selected
                      ? 'text-accent data-[highlighted]:bg-info-surface'
                      : 'text-heading data-[highlighted]:bg-info-surface',
                )}
              >
                {action.icon ? (
                  <span className="grid size-5 shrink-0 place-items-center" aria-hidden>
                    {action.icon}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 truncate">{action.label}</span>
                {action.selected ? (
                  <Check className="size-[1.125rem] shrink-0 text-accent" aria-hidden />
                ) : null}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
