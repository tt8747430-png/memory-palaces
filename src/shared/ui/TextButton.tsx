import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface TextButtonProps {
  children: ReactNode
  onClick: () => void
  icon?: ReactNode
  /** `muted` for the secondary of a pair — "clear" next to "paste", say. */
  tone?: 'primary' | 'muted'
  className?: string
}

/** An inline action with no surface of its own: label, optional icon, nothing else. */
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
