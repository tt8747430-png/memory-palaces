import { type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib'

export interface EditableTitleProps {
  value: string
  onRename: (name: string) => void
  editLabel: string
  className?: string
  disabled?: boolean
}

const DOUBLE_TAP_MS = 300

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
  const lastTapRef = useRef(0)
  const keyActivatedRef = useRef(false)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

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
      onKeyDown={(event) => {
        stop(event)
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          keyActivatedRef.current = true
          setEditing(true)
        }
      }}
      onClick={(event) => {
        stop(event)
        if (keyActivatedRef.current) {
          keyActivatedRef.current = false
          return
        }
        const now = Date.now()
        if (now - lastTapRef.current < DOUBLE_TAP_MS) {
          lastTapRef.current = 0
          setEditing(true)
        } else {
          lastTapRef.current = now
        }
      }}
      className={cn(className, 'cursor-text text-left')}
    >
      {value}
    </button>
  )
}
