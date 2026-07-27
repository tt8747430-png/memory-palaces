import { cn, type RecallSlot } from '@/shared/lib'

const CORRECT = 'text-(--success-foreground)'
const STRUCK =
  'rounded-md bg-(--danger-surface) px-1 text-(--danger-on-surface) line-through decoration-2'
const EXPECTED = 'rounded-md bg-(--warning-surface) px-1 font-semibold text-(--warning-foreground)'

/** The typed answer marked up against the real one, word by word. */
export function RecallTokens({ slots }: { slots: RecallSlot[] }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5">
      {slots.map((slot, i) => (
        <RecallToken key={i} slot={slot} />
      ))}
    </p>
  )
}

function RecallToken({ slot }: { slot: RecallSlot }) {
  switch (slot.kind) {
    case 'pending':
      return null
    case 'correct':
      return <span className={CORRECT}>{slot.expected}</span>
    case 'extra':
      return <span className={STRUCK}>{slot.typed}</span>
    case 'missing':
      return (
        <span
          className={cn(EXPECTED, 'underline decoration-dashed decoration-2 underline-offset-2')}
        >
          {slot.expected}
        </span>
      )
    case 'wrong':
      return (
        <span className="inline-flex items-baseline gap-1">
          <span className={STRUCK}>{slot.typed}</span>
          <span className={EXPECTED}>{slot.expected}</span>
        </span>
      )
  }
}
