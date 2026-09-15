import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

/**
 * A whole-screen layer that stands in for the app rather than sitting over it: the boot failure,
 * an account on its way to being destroyed. Its content is the only thing on screen, so the caller
 * gives it the role — `alert` for something to act on, `status` for a wait.
 *
 * No z-index on purpose. It replaces the children, so nothing competes with it, and the toaster
 * has to be able to reach over it to say what a press did.
 */
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
