import { Fragment, type ReactNode } from 'react'
import { cn, isReferenceMarker } from '@/shared/lib'

export interface TokenLineProps {
  tokens: readonly string[]
  className?: string
  renderWithheld: (token: string, index: number) => ReactNode | null
}

export function TokenLine({ tokens, className, renderWithheld }: TokenLineProps) {
  return (
    <p
      className={cn(
        'flex w-full flex-wrap items-baseline justify-center text-card-token font-semibold text-heading',
        className,
      )}
    >
      {tokens.map((token, i) => {
        if (isReferenceMarker(token)) {
          return (
            <span key={i} className="font-bold text-accent">
              {token}
            </span>
          )
        }
        const withheld = renderWithheld(token, i)
        if (withheld !== null) return <Fragment key={i}>{withheld}</Fragment>
        return (
          <span key={i} className="whitespace-nowrap">
            {token}
          </span>
        )
      })}
    </p>
  )
}
