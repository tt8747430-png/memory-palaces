import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

export function Curtain({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'fixed inset-0 grid place-items-center overflow-y-auto bg-background px-6 py-safe',
        className,
      )}
      {...props}
    />
  )
}
