import type { ComponentProps, ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib'

const DropdownMenu = Menu.Root
const DropdownMenuTrigger = Menu.Trigger
const DropdownMenuGroup = Menu.Group

type Side = 'top' | 'bottom' | 'left' | 'right'
type Align = 'start' | 'center' | 'end'

interface DropdownMenuContentProps extends Omit<ComponentProps<typeof Menu.Popup>, 'className'> {
  className?: string
  side?: Side
  align?: Align
  sideOffset?: number
  collisionPadding?: number
}

/** Portal + positioner + popup, styled as an elevated floating menu. */
function DropdownMenuContent({
  className,
  side = 'bottom',
  align = 'end',
  sideOffset = 6,
  collisionPadding = 12,
  ...props
}: DropdownMenuContentProps) {
  return (
    <Menu.Portal>
      <Menu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className="z-[500]"
      >
        <Menu.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            'min-w-[208px] origin-[var(--transform-origin)] rounded-card bg-card p-1.5',
            'shadow-elevated outline-none ring-1 ring-[color:var(--border-glass)]',
            'transition-[transform,opacity] duration-150 ease-out motion-reduce:transition-none',
            'data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0',
            className,
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  )
}

const menuItemVariants = cva(
  cn(
    'flex h-11 cursor-default select-none items-center gap-3 rounded-control px-3',
    'text-[length:var(--p-text-body)] font-medium outline-none',
    'transition-transform duration-150 ease-out active:scale-[0.99]',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  ),
  {
    variants: {
      variant: {
        default: 'text-heading data-[highlighted]:bg-info-surface',
        active: 'text-accent data-[highlighted]:bg-info-surface',
        destructive:
          'text-[var(--danger-on-surface)] data-[highlighted]:bg-[var(--danger-surface)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

interface DropdownMenuItemProps
  extends Omit<ComponentProps<typeof Menu.Item>, 'className'>,
    VariantProps<typeof menuItemVariants> {
  className?: string
}

function DropdownMenuItem({ className, variant, ...props }: DropdownMenuItemProps) {
  return (
    <Menu.Item
      data-slot="dropdown-menu-item"
      className={cn(menuItemVariants({ variant }), className)}
      {...props}
    />
  )
}

/** Leading icon slot, sized to the menu row. */
function DropdownMenuItemIcon({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-5 shrink-0 place-items-center" aria-hidden>
      {children}
    </span>
  )
}

const DropdownMenuRadioGroup = Menu.RadioGroup

interface DropdownMenuRadioItemProps extends Omit<ComponentProps<typeof Menu.RadioItem>, 'className'> {
  className?: string
}

function DropdownMenuRadioItem({ className, children, ...props }: DropdownMenuRadioItemProps) {
  return (
    <Menu.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        'flex h-11 cursor-default select-none items-center gap-3 rounded-control px-3',
        'text-[length:var(--p-text-body)] font-medium text-heading outline-none',
        'transition-transform duration-150 ease-out active:scale-[0.99]',
        'data-[highlighted]:bg-info-surface data-[checked]:text-accent',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <Menu.RadioItemIndicator className="ml-auto shrink-0">
        <Check className="size-[18px] text-accent" aria-hidden />
      </Menu.RadioItemIndicator>
    </Menu.RadioItem>
  )
}

interface DropdownMenuSeparatorProps extends Omit<ComponentProps<typeof Menu.Separator>, 'className'> {
  className?: string
}

function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
  return (
    <Menu.Separator
      data-slot="dropdown-menu-separator"
      className={cn('mx-1 my-1.5 h-px bg-border', className)}
      {...props}
    />
  )
}

interface DropdownMenuLabelProps extends Omit<ComponentProps<typeof Menu.GroupLabel>, 'className'> {
  className?: string
}

function DropdownMenuLabel({ className, ...props }: DropdownMenuLabelProps) {
  return (
    <Menu.GroupLabel
      data-slot="dropdown-menu-label"
      className={cn(
        'px-3 pb-1 pt-2 text-[length:var(--p-text-label)] font-semibold text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  menuItemVariants,
}
