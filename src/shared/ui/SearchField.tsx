import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { IconButton } from './primitives/icon-button'
import { Input } from './primitives/input'

export interface SearchFieldProps {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  onClose: () => void
  closeLabel: string
  className?: string
}

/**
 * Mounts focused: nothing raises this field except a learner asking to search,
 * so a second tap to reach it would be a step with no decision in it.
 * `preventScroll` keeps that focus from scrolling the layout viewport — the
 * field is chrome, not content, and moving the page under it is what skews the
 * keyboard measurement (CODE_STYLE §11).
 */
export function SearchField({
  value,
  onValueChange,
  placeholder,
  onClose,
  closeLabel,
  className,
}: SearchFieldProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  return (
    // gap-2: the field's focus ring draws 5px outside it, and the close control must not sit in that.
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
      <IconButton variant="glass" aria-label={closeLabel} onClick={onClose}>
        <X className="size-5" aria-hidden />
      </IconButton>
      <span className="sr-only" role="status">
        {value ? t('cards.searchActive', { query: value }) : ''}
      </span>
    </div>
  )
}
