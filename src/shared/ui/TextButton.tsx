import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface TextButtonProps {
  children: ReactNode
  onClick: () => void
  icon?: ReactNode
  tone?: 'primary' | 'muted'
  className?: string
}

export function TextButton({
  children,
  onClick,
  icon,
  tone = 'primary',
  className,
}: TextButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-(length:--p-text-label) font-semibold transition-colors active:opacity-70',
        tone === 'primary' ? 'text-primary' : 'text-muted-foreground',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}
