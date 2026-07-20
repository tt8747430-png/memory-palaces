import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib'

export type ImportRowTone = 'brand' | 'accent' | 'positive' | 'warning' | 'danger' | 'neutral'

const TONE_CHIP: Record<ImportRowTone, string> = {
  brand: 'bg-info-surface text-primary',
  accent: 'bg-secondary/45 text-primary',
  positive: 'bg-[var(--success-surface)] text-[var(--success-on-surface)]',
  warning: 'bg-[var(--warning-surface)] text-[var(--warning-foreground)]',
  danger: 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]',
  neutral: 'bg-secondary/25 text-secondary-foreground',
}

export interface ImportRowProps {
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
  disabled?: boolean
  tone?: ImportRowTone
  badge?: ReactNode
  trailing?: ReactNode
}

export function ImportRow({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
  tone = 'brand',
  badge,
  trailing,
}: ImportRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex w-full items-center gap-3.5 rounded-card border border-border bg-card px-4 py-3 text-left',
        'shadow-rest transition-[transform,box-shadow,border-color] duration-150 ease-out',
        'hover:border-[oklch(var(--ms-tint-navy)/0.14)] active:scale-[0.985]',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
        'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
      )}
    >
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-control transition-transform duration-150 ease-out group-active:scale-95',
          TONE_CHIP[tone],
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[length:var(--ms-text-sub)] font-semibold text-heading">
          {title}
        </span>
        <span className="mt-0.5 block text-[length:var(--ms-text-label)] leading-snug text-muted-foreground">
          {subtitle}
        </span>
      </span>
      {badge ? (
        <span className="shrink-0 rounded-pill bg-info-surface px-2 py-0.5 text-[length:var(--ms-text-tiny)] font-semibold uppercase tracking-wide text-info-foreground">
          {badge}
        </span>
      ) : null}
      {trailing ?? (
        <ChevronRight
          className="size-5 shrink-0 text-faint transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-muted-foreground"
          aria-hidden
        />
      )}
    </button>
  )
}
