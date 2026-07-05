import { type ReactElement } from 'react'
import { Menu } from '@base-ui/react/menu'
import { Check, MoreVertical } from 'lucide-react'
import { cn } from '@/shared/lib'
import { IconButton, type IconButtonSize, type IconButtonVariant } from './IconButton'
import type { SheetAction } from './ActionSheet'

export interface FlyoutMenuProps {
  /** Accessible name for the default ⋮ trigger (ignored when a custom `trigger` is given). */
  label: string
  actions: SheetAction[]
  /** A fully custom trigger element (must accept a ref). Defaults to a kebab IconButton. */
  trigger?: ReactElement
  variant?: IconButtonVariant
  size?: IconButtonSize
  /** Which side of the trigger the panel opens on. */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** How the panel aligns to the trigger along that side. */
  align?: 'start' | 'center' | 'end'
  className?: string
}

/**
 * An anchored flyout of actions — the in-place, popover-style alternative to a bottom
 * {@link ActionSheet} drawer. Built on Base UI's Menu (floating-anchored, focus-managed,
 * dismiss on outside press / Escape) so the panel springs from the control under the thumb
 * instead of sliding the whole sheet up. Same {@link SheetAction} shape as the action sheet.
 *
 * Defaults to a kebab (⋮) trigger; pass `trigger` for a custom control (e.g. a labelled
 * sort pill). Non-modal: it never locks body scroll, and repositions as the page scrolls.
 * A `selected` action renders a trailing check + accent, for single-select menus like sort.
 */
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
      // Shield the trigger from any gesture/tap ancestor so opening the menu never also starts a
      // drag (pointerdown) or fires the row's tap-to-open (click) — the kebab lives inside
      // tappable, long-pressable list rows.
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
        <Menu.Positioner
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className="z-[500]"
        >
          <Menu.Popup
            className={cn(
              'min-w-[208px] origin-[var(--transform-origin)] rounded-card bg-card p-1.5',
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
                  'text-[length:var(--p-text-body)] font-medium outline-none',
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
                  <Check className="size-[18px] shrink-0 text-accent" aria-hidden />
                ) : null}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
