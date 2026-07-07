import { type ReactNode } from 'react'

/** A titled group inside the study sheets — one label, one cluster of controls. */
export function SheetSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[length:var(--p-text-label)] font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  )
}
