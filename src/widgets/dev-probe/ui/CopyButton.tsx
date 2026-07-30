import { useEffect, useRef, useState } from 'react'
import { cn, keepFieldFocused } from '@/shared/lib'

export const PROBE_ACTION =
  'rounded-control border border-border px-2 py-1 text-(length:--p-text-tiny) font-semibold text-heading'

type State = 'idle' | 'copied' | 'failed'

/**
 * `text` is a thunk: the probe re-renders every frame, and the reading worth copying is the one
 * taken when the button was pressed. `keepFieldFocused` is the load-bearing part — the whole
 * purpose is to copy the numbers *while the keyboard is up*, and a tap that blurred the field
 * would close it and copy the resting state instead.
 */
export function CopyButton({
  text,
  label,
  className,
}: {
  text: () => string
  label: string
  className?: string
}) {
  const [state, setState] = useState<State>('idle')
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    let next: State
    try {
      await navigator.clipboard.writeText(text())
      next = 'copied'
    } catch {
      next = 'failed'
    }
    setState(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 1600)
  }

  return (
    <button
      type="button"
      onMouseDown={keepFieldFocused}
      onClick={() => void copy()}
      className={cn(
        PROBE_ACTION,
        state === 'failed' && 'border-destructive text-(--danger-on-surface)',
        className,
      )}
    >
      {state === 'idle' ? label : state === 'copied' ? 'copied' : 'no clipboard'}
    </button>
  )
}
