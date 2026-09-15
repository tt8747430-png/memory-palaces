import { type ReactNode } from 'react'
import { cn } from '@/shared/lib'

export function Section({
  id,
  title,
  note,
  children,
}: {
  id: string
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-4">
      <div className="mb-3">
        <h2 className="text-body font-semibold text-heading">{title}</h2>
        {note ? <p className="mt-0.5 text-label text-muted-foreground">{note}</p> : null}
      </div>
      <div className="rounded-card-featured border border-border bg-card p-4">{children}</div>
    </section>
  )
}

export function Cases({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-x-6 gap-y-5">{children}</div>
}

export function Case({
  label,
  full,
  children,
}: {
  label: string
  full?: boolean
  children: ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', full && 'w-full')}>
      <div className="min-w-0">{children}</div>
      <span className="text-label text-muted-foreground">{label}</span>
    </div>
  )
}
