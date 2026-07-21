import { FlyoutMenu } from './FlyoutMenu'
import type { IconButtonSize, IconButtonVariant } from './primitives/icon-button'
import type { SheetAction } from './ActionSheet'

export interface OverflowMenuButtonProps {
  label: string
  actions: SheetAction[]
  variant?: IconButtonVariant
  size?: IconButtonSize
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function OverflowMenuButton({
  label,
  actions,
  variant = 'ghost',
  size = 'md',
  side = 'bottom',
  align = 'end',
  className,
}: OverflowMenuButtonProps) {
  return (
    <FlyoutMenu
      label={label}
      actions={actions}
      variant={variant}
      size={size}
      side={side}
      align={align}
      className={className}
    />
  )
}
