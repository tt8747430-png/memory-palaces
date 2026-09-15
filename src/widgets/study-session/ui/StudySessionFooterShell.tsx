import type { ReactNode } from 'react'

export function StudySessionFooterShell({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 border-t border-border/60 bg-card-glass px-5 pb-(--p-safe-bottom) pt-2.5">
      {children}
    </div>
  )
}
