import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

/** The phone-first screen column: centered, capped at the app width, safe-area aware.
 * Every screen renders inside one so the layout stays consistent and never sprawls
 * into a dashboard on larger viewports. */
export function AppScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={cn('mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-safe', className)}
    >
      {children}
    </main>
  )
}
