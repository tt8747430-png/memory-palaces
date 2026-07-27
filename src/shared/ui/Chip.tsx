import type { ReactNode } from 'react'
import { Badge } from './primitives/badge'

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
