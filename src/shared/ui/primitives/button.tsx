import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-control font-medium select-none ' +
    'transition-transform duration-200 ease-out active:scale-[0.97] ' +
    'disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-interactive',
        secondary: 'bg-secondary text-secondary-foreground',
        ghost: 'bg-card text-heading border border-border shadow-rest',
        destructive: 'bg-(--danger-surface) text-(--danger-on-surface)',
      },
      size: {
        sm: 'h-9 px-3 text-label',
        md: 'h-11 px-5 text-body',
        lg: 'h-12 px-6 text-body',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

type ButtonProps = Omit<ButtonPrimitive.Props, 'className'> &
  VariantProps<typeof buttonVariants> & { className?: string }

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
