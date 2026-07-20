import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib'
import { SwitchTrack } from './switch'

type Tone = 'default' | 'danger'

interface BaseProps {
  icon: ReactNode
  label: string
  description?: string
  tone?: Tone
}

/**
 * A row in a `SettingsSection`, discriminated by what it does. `main` also ships `select`
 * (a Combobox) and `soon` (a Chip) variants; both are the settings area's, and neither their
 * component nor a caller exists here yet — they join the union when that area lands.
 */
export type SettingsRowProps = BaseProps &
  (
    | { kind: 'toggle'; checked: boolean; onCheckedChange: (value: boolean) => void }
    | { kind: 'nav'; onClick: () => void; value?: string; disabled?: boolean }
    | { kind: 'action'; onClick: () => void; disabled?: boolean }
    | { kind: 'value'; value: string }
  )

const ROW = 'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors'

const PRESSABLE = 'group active:bg-primary/[0.04] disabled:pointer-events-none disabled:opacity-45'

function RowBody({ icon, label, description, tone = 'default' }: BaseProps) {
  const danger = tone === 'danger'
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span
        aria-hidden
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-control [&_svg]:size-[1.125rem]',
          'transition-transform duration-200 ease-out group-active:scale-[0.92]',
          danger
            ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
            : 'bg-info-surface text-info-foreground',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block truncate text-[length:var(--ms-text-sub)] font-semibold',
            danger ? 'text-[var(--danger-on-surface)]' : 'text-heading',
          )}
        >
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block truncate text-[length:var(--ms-text-label)] leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </span>
  )
}

const trailingValue = (value: string) => (
  <span className="shrink-0 text-[length:var(--ms-text-label)] text-muted-foreground">{value}</span>
)

export function SettingsRow(props: SettingsRowProps) {
  const { icon, label, description, tone } = props
  const body = <RowBody icon={icon} label={label} description={description} tone={tone} />

  switch (props.kind) {
    case 'toggle':
      return (
        <button
          type="button"
          role="switch"
          aria-checked={props.checked}
          aria-label={label}
          onClick={() => props.onCheckedChange(!props.checked)}
          className={cn(ROW, PRESSABLE)}
        >
          {body}
          <SwitchTrack checked={props.checked} />
        </button>
      )

    case 'nav':
      return (
        <button
          type="button"
          aria-label={label}
          onClick={props.onClick}
          disabled={props.disabled}
          className={cn(ROW, PRESSABLE)}
        >
          {body}
          {props.value ? trailingValue(props.value) : null}
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-active:translate-x-0.5"
            aria-hidden
          />
        </button>
      )

    case 'action':
      return (
        <button
          type="button"
          aria-label={label}
          onClick={props.onClick}
          disabled={props.disabled}
          className={cn(ROW, PRESSABLE)}
        >
          {body}
        </button>
      )

    case 'value':
      return (
        <div className={ROW}>
          {body}
          {trailingValue(props.value)}
        </div>
      )
  }
}
