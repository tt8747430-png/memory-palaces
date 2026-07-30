import { useRef } from 'react'
import { Smile } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface EmojiFieldProps {
  value: string
  onChange: (emoji: string) => void
  'aria-label': string
  className?: string
}

/**
 * UTS #51's `Extended_Pictographic` — every character that can start an emoji,
 * including the text-presentation ones `\p{Emoji_Presentation}` leaves out.
 * (Some IDE regex parsers do not know this property; engines do.)
 */
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

function lastGrapheme(input: string): string {
  if (!input) return ''
  return [...graphemes.segment(input)].at(-1)?.segment ?? ''
}

export function EmojiField({ value, onChange, className, ...rest }: EmojiFieldProps) {
  const ref = useRef<HTMLInputElement>(null)
  const commit = (raw: string) => {
    const next = lastGrapheme(raw.trim())
    if (next && PICTOGRAPHIC.test(next)) onChange(next)
  }
  return (
    <span
      className={cn(
        'relative grid size-14 shrink-0 place-items-center rounded-card bg-info-surface shadow-rest',
        'focus-within:ring-2 focus-within:ring-primary',
        className,
      )}
    >
      {value ? (
        <span aria-hidden className="text-3xl leading-none">
          {value}
        </span>
      ) : (
        <Smile aria-hidden className="size-6 text-muted-foreground" />
      )}
      <input
        ref={ref}
        value={value}
        onChange={(event) => commit(event.target.value)}
        inputMode="text"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        className="absolute inset-0 size-full cursor-pointer rounded-card text-center text-3xl text-transparent caret-transparent outline-none"
        {...rest}
      />
    </span>
  )
}
