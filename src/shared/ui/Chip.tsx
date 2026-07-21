import type { ReactNode } from 'react'
import { Badge } from './primitives/badge'

/**
 * Domain affordance: a small info pill with an optional leading glyph.
 * Composes the `Badge` primitive (`info` variant) so styling stays centralized.
 */
export function Chip({
  children,
  icon,
  className,
}: {
  children: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <Badge variant="info" className={className}>
      {icon ? (
        <span className="grid place-items-center" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </Badge>
  )
}
