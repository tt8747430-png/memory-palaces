import { Fragment, type ReactNode } from 'react'
import { cn, isReferenceMarker } from '@/shared/lib'

export interface TokenLineProps {
  tokens: readonly string[]
  className?: string
  /**
   * What to draw for a word the face is withholding. Return `null` and the word shows as itself.
   * Reference markers are never withheld.
   */
  renderWithheld: (token: string, index: number) => ReactNode | null
}

/**
 * An answer laid out word by word. Every face that hides part of an answer draws it through here,
 * so a reference marker always reads as an accent and a revealed word always reads the same.
 */
export function TokenLine({ tokens, className, renderWithheld }: TokenLineProps) {
  return (
    <p
      className={cn(
        'flex w-full flex-wrap items-baseline justify-center text-[clamp(17px,4.6vw,22px)] font-semibold text-heading',
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
