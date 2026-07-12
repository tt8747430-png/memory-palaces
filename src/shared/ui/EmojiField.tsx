import { useRef } from 'react'
import { Smile } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface EmojiFieldProps {
  value: string
  onChange: (emoji: string) => void
  'aria-label': string
  className?: string
}

function lastGrapheme(input: string): string {
  if (!input) return ''
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const parts = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(input)]
    return parts.at(-1)?.segment ?? ''
  }
  return [...input].at(-1) ?? ''
}

export function EmojiField({ value, onChange, className, ...rest }: EmojiFieldProps) {
  const ref = useRef<HTMLInputElement>(null)
  const commit = (raw: string) => {
    const next = lastGrapheme(raw.trim())
    if (next && /\p{Extended_Pictographic}/u.test(next)) onChange(next)
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
