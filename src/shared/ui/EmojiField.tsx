import { useRef } from 'react'
import { Smile } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface EmojiFieldProps {
  value: string
  onChange: (emoji: string) => void
  /** Accessible name for the field (e.g. "Icon"). */
  'aria-label': string
  className?: string
}

/** The last grapheme cluster of a string (so multi-codepoint emoji — ZWJ sequences, skin
 * tones, flags — count as one). Falls back to codepoint split where Intl.Segmenter is absent. */
function lastGrapheme(input: string): string {
  if (!input) return ''
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const parts = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(input)]
    return parts.at(-1)?.segment ?? ''
  }
  return [...input].at(-1) ?? ''
}

/**
 * Icon picker as a single tile: tap it and the device's own keyboard / emoji picker opens,
 * so the user can choose *any* emoji rather than a curated grid. We keep only the last emoji
 * grapheme they enter and ignore non-emoji input, so the value is always one symbol. The
 * tile doubles as the live preview.
 */
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
      {/* The real input sits transparent over the tile: focusing it raises the emoji keyboard. */}
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
