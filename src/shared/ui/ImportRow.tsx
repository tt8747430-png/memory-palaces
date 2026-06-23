import { type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

export interface ImportRowProps {
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
  disabled?: boolean
}

/** A tappable import/export option: an icon chip, a title + subtitle, and a chevron, on a
 * soft info-surface card. Shared by the palace import sheet and the room transfer sheet so
 * both read as one family. */
export function ImportRow({ icon, title, subtitle, onClick, disabled }: ImportRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3.5 rounded-card bg-info-surface px-4 py-3 text-left transition-transform active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-control bg-card text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
          {title}
        </span>
        <span className="mt-0.5 block text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
          {subtitle}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-faint" aria-hidden />
    </button>
  )
}
