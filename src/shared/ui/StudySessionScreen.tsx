import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface StudySessionScreenProps {
  children: ReactNode
  className?: string
}

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
