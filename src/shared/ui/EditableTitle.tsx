import { type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib'

export interface EditableTitleProps {
  value: string
  /** Commit a new, non-empty, changed name. */
  onRename: (name: string) => void
  /** Accessible name for the rename trigger, e.g. "Rename Garden Room". */
  editLabel: string
  /** Shared typography/layout classes applied to the title, trigger, and input so the three
   * states line up pixel-for-pixel. */
  className?: string
  /** Select mode / dragging: the title goes inert (plain text) so the card's own tap wins. */
  disabled?: boolean
}

/**
 * A title that renames in place: tapping it swaps the text for an input (Enter / blur saves,
 * Esc / empty cancels). Stops its own pointer + click from bubbling so the host card's
 * open/swipe/drag gestures never fire from the title — the card opens from everywhere else.
 * Rendered as a real control (button ↔ input), so the host card must be a non-button clickable
 * element (a `role="button"` div), never a native `<button>`.
 */
export function EditableTitle({
  value,
  onRename,
  editLabel,
  className,
  disabled = false,
}: EditableTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reseed the draft from upstream whenever we're not mid-edit.
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  // Focus + select the whole name the moment editing opens.
  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  // Entering select mode / a drag cancels any in-flight rename.
  useEffect(() => {
    if (disabled) setEditing(false)
  }, [disabled])

  const stop = (event: { stopPropagation: () => void }) => event.stopPropagation()

  const commit = () => {
    const name = draft.trim()
    if (name && name !== value) onRename(name)
    setEditing(false)
  }
  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (disabled) {
    return <span className={className}>{value}</span>
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onClick={stop}
        onPointerDown={stop}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          // Keep Enter/Escape from reaching the host card (which would open it).
          event.stopPropagation()
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            cancel()
          }
        }}
        onBlur={commit}
        enterKeyHint="done"
        aria-label={editLabel}
        className={cn(
          className,
          'w-full min-w-0 rounded-[8px] bg-info-surface px-1.5 py-0.5 text-heading outline-none ring-2 ring-accent/50',
        )}
      />
    )
  }

  return (
    <button
      type="button"
      aria-label={editLabel}
      onPointerDown={stop}
      onKeyDown={stop}
      onClick={(event) => {
        stop(event)
        setEditing(true)
      }}
      className={cn(className, 'cursor-text text-left')}
    >
      {value}
    </button>
  )
}
