import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-control px-2.5 py-1 ' +
    'text-[length:var(--p-text-label)] font-medium select-none',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        info: 'bg-info-surface text-info-foreground',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeProps = Omit<ComponentProps<'span'>, 'className'> &
  VariantProps<typeof badgeVariants> & { className?: string }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
}

export { Badge, badgeVariants }
export type { BadgeProps }
