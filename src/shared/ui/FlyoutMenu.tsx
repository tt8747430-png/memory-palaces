import { type ReactElement } from 'react'
import { Check, MoreVertical } from 'lucide-react'
import { IconButton, type IconButtonSize, type IconButtonVariant } from './primitives/icon-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuTrigger,
} from './primitives/dropdown-menu'
import type { SheetAction } from './ActionSheet'

export interface FlyoutMenuProps {
  label: string
  actions: SheetAction[]
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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger render={triggerElement} />
      <DropdownMenuContent side={side} align={align}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            disabled={action.disabled}
            onClick={action.onSelect}
            variant={action.destructive ? 'destructive' : action.selected ? 'active' : 'default'}
          >
            {action.icon ? <DropdownMenuItemIcon>{action.icon}</DropdownMenuItemIcon> : null}
            <span className="min-w-0 flex-1 truncate">{action.label}</span>
            {action.selected ? (
              <Check className="size-[18px] shrink-0 text-accent" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
