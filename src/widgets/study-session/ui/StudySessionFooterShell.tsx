import type { ReactNode } from 'react'

/**
 * The footer is not a bar. It paints nothing, so the Card style's scene runs unbroken from the
 * header to the safe area and every control floats on it — the way the header's buttons already do.
 */
export function StudySessionFooterShell({ children }: { children: ReactNode }) {
  return <div className="shrink-0 px-5 pb-(--p-safe-bottom) pt-2.5">{children}</div>
}
