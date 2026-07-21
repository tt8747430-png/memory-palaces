import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib'

const iconButtonVariants = cva(
  'inline-grid shrink-0 place-items-center rounded-control select-none ' +
    'transition-transform duration-150 ease-out active:scale-[0.94] ' +
    'focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        ghost: 'text-heading hover:bg-info-surface',
        tint: 'bg-info-surface text-info-foreground',
        solid: 'bg-primary text-primary-foreground shadow-interactive',
        glass: 'bg-card-glass text-heading shadow-rest',
        danger: 'text-[var(--danger-on-surface)] hover:bg-[var(--danger-surface)]',
      },
      size: {
        sm: 'size-9',
        md: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
)

type IconButtonVariant = NonNullable<VariantProps<typeof iconButtonVariants>['variant']>
type IconButtonSize = NonNullable<VariantProps<typeof iconButtonVariants>['size']>

type IconButtonProps = Omit<ButtonPrimitive.Props, 'className'> &
  VariantProps<typeof iconButtonVariants> & {
    className?: string
    'aria-label': string
  }

function IconButton({ className, variant, size, ...props }: IconButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="icon-button"
      className={cn(iconButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { IconButton, iconButtonVariants }
export type { IconButtonProps, IconButtonVariant, IconButtonSize }
