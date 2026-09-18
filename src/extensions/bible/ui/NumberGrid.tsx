import { cn } from '@/shared/lib'
import { FOCUS_RING } from '@/shared/ui'

export function NumberGrid({
  label,
  values,
  onPick,
  lead,
}: {
  label: string
  values: number[]
  onPick: (value: number) => void
  lead?: { label: string; onPick: () => void }
}) {
  return (
    <section>
      <h2 className="mb-3 text-center text-body font-bold text-heading">{label}</h2>
      {lead ? (
        <button
          type="button"
          onClick={lead.onPick}
          className={cn(
            'mx-auto mb-3 block rounded-control bg-info-surface px-5 py-2.5 text-body font-semibold text-heading',
            'shadow-rest transition-[transform,box-shadow] duration-150 ease-out',
            'hover:shadow-interactive active:scale-[0.97]',
            FOCUS_RING,
            'motion-reduce:transition-none',
          )}
        >
          {lead.label}
        </button>
      ) : null}
      <div className="grid grid-cols-4 gap-2.5">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            className={cn(
              'grid aspect-square place-items-center rounded-full border border-border bg-card',
              'text-body font-semibold tabular-nums text-heading',
              'shadow-rest transition-[transform,background-color] duration-150 ease-out',
              'hover:bg-info-surface active:scale-[0.94]',
              FOCUS_RING,
              'motion-reduce:transition-none',
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </section>
  )
}
