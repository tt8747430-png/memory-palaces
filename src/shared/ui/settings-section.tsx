import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface SettingsSectionProps {
  title?: string
  children: ReactNode
  className?: string
}

/** A titled group of `SettingsRow`s rendered as one hairline-divided card. */
export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {title ? (
        <h2 className="px-1 text-[length:var(--ms-text-label)] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      ) : null}
      <div className="divide-y divide-border overflow-hidden rounded-card bg-card shadow-rest">
        {children}
      </div>
    </section>
  )
}
