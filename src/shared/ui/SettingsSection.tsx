import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface SettingsSectionProps {
  /** Optional group label rendered above the card as a section heading. */
  title?: string
  children: ReactNode
  className?: string
}

/** A grouped settings card: an uppercase section heading over a rounded surface whose
 * rows are separated by hairline dividers. */
export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {title ? (
        <h2 className="px-1 text-[length:var(--p-text-label)] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-card bg-card shadow-rest divide-y divide-border">
        {children}
      </div>
    </section>
  )
}
