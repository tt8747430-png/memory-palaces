import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Chip } from './Chip'
import { SwitchTrack } from './Switch'

type Tone = 'default' | 'danger'

interface BaseProps {
  icon: ReactNode
  label: string
  description?: string
  tone?: Tone
}

export type SettingsRowProps = BaseProps &
  (
    | { kind: 'toggle'; checked: boolean; onCheckedChange: (value: boolean) => void }
    | { kind: 'nav'; onClick: () => void; value?: string; disabled?: boolean }
    | { kind: 'value'; value: string }
    | { kind: 'soon'; badge: string }
  )

const ROW = 'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors'

function RowBody({ icon, label, description, tone = 'default' }: BaseProps) {
  const danger = tone === 'danger'
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span
        aria-hidden
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-control [&_svg]:size-[18px]',
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
            'block truncate text-[length:var(--p-text-sub)] font-semibold',
            danger ? 'text-[var(--danger-on-surface)]' : 'text-heading',
          )}
        >
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block truncate text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </span>
  )
}

const trailingValue = (value: string) => (
  <span className="shrink-0 text-[length:var(--p-text-label)] text-muted-foreground">{value}</span>
)

/** One row in a grouped settings list: a tinted icon, a label (+optional description),
 * and a trailing control chosen by `kind` — a toggle, a navigation chevron, a static
 * value, or a "coming soon" badge (inert/disabled). */
export function SettingsRow(props: SettingsRowProps) {
  const { icon, label, description, tone } = props
  const body = <RowBody icon={icon} label={label} description={description} tone={tone} />

  if (props.kind === 'toggle') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        aria-label={label}
        onClick={() => props.onCheckedChange(!props.checked)}
        className={cn(ROW, 'group active:bg-primary/[0.04]')}
      >
        {body}
        <SwitchTrack checked={props.checked} />
      </button>
    )
  }

  if (props.kind === 'nav') {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={props.onClick}
        disabled={props.disabled}
        className={cn(
          ROW,
          'group active:bg-primary/[0.04]',
          'disabled:pointer-events-none disabled:opacity-45',
        )}
      >
        {body}
        {props.value ? trailingValue(props.value) : null}
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-active:translate-x-0.5"
          aria-hidden
        />
      </button>
    )
  }

  if (props.kind === 'soon') {
    return (
      <button type="button" disabled aria-label={label} className={cn(ROW, 'cursor-default')}>
        {body}
        <Chip>{props.badge}</Chip>
      </button>
    )
  }

  return (
    <div className={ROW}>
      {body}
      {trailingValue(props.value)}
    </div>
  )
}
