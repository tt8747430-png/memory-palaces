import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface StudySessionScreenProps {
  children: ReactNode
  className?: string
}

/**
 * The frame a study session lives in — a pass through a deck, a quiz, a match: one app-width
 * column that fills the shell and never scrolls itself, so the panel inside owns the scrolling.
 */
export function StudySessionScreen({ children, className }: StudySessionScreenProps) {
  return (
    <main
      className={cn(
        'relative mx-auto flex h-full w-full max-w-app flex-col overflow-hidden',
        className,
      )}
    >
      {children}
    </main>
  )
}
