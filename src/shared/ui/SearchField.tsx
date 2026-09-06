import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { IconButton } from './primitives/icon-button'
import { Input } from './primitives/input'

export interface SearchFieldProps {
  value: string
  onValueChange: (value: string) => void
  /** What is being searched — "Search cards", "Search questions". Also the field's label. */
  placeholder: string
  /** Dismisses the search entirely, not just the text. */
  onClose: () => void
  closeLabel: string
  /** Takes focus on mount. The field appears in response to a press, so it should. */
  autoFocus?: boolean
  className?: string
}

/**
 * A band of search over a list.
 *
 * `type="search"` so an on-screen keyboard offers a search key and iOS draws its own clear affordance
 * inside the field; the explicit button beside it is what leaves search altogether. `text-entry` is
 * inherited from `Input` and is load-bearing — a field under 16px makes iOS zoom the visual viewport
 * on focus, which moves the ground under every keyboard measurement. ADR 0002.
 */
export function SearchField({
  value,
  onValueChange,
  placeholder,
  onClose,
  closeLabel,
  autoFocus = false,
  className,
}: SearchFieldProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={ref}
          type="search"
          value={value}
          aria-label={placeholder}
          placeholder={placeholder}
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="pl-10"
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose()
          }}
        />
      </span>
      <IconButton variant="ghost" aria-label={closeLabel} onClick={onClose}>
        <X className="size-5" aria-hidden />
      </IconButton>
      <span className="sr-only" role="status">
        {value ? t('cards.searchActive', { query: value }) : ''}
      </span>
    </div>
  )
}
