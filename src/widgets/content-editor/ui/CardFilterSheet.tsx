import { useTranslation } from 'react-i18next'
import { Flag, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button, Sheet, Switch } from '@/shared/ui'
import type { CardFilterControl } from '../model/use-card-filter'
import type { MaturityKey } from '../model/card-list'

const MATURITY: { key: MaturityKey; labelKey: string; dot: string }[] = [
  { key: 'new', labelKey: 'cards.filter.new', dot: 'bg-(--text-faint)' },
  { key: 'learning', labelKey: 'cards.filter.learning', dot: 'bg-accent' },
  { key: 'known', labelKey: 'cards.filter.known', dot: 'bg-success' },
]

export interface FilterButtonProps {
  count: number
  onClick: () => void
}

/** Opens the filter sheet, and carries how many filters are already narrowing the list. */
export function FilterButton({ count, onClick }: FilterButtonProps) {
  const { t } = useTranslation()
  const label = t('cards.filterLabel')
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-control bg-card pl-2.5 pr-3 shadow-rest transition-transform active:scale-[0.97]',
        count > 0 && 'ring-1 ring-accent/45',
      )}
    >
      <SlidersHorizontal className="size-4 shrink-0 text-accent" aria-hidden />
      <span className="text-(length:--p-text-label) font-semibold text-heading">{label}</span>
      {count > 0 ? (
        <span className="grid size-5 place-items-center rounded-full bg-accent text-(length:--p-text-tiny) font-bold tabular-nums text-accent-foreground">
          {count}
        </span>
      ) : null}
    </button>
  )
}

export interface CardFilterSheetProps {
  filter: CardFilterControl
  /** How many cards sit in each maturity band, so a band that would empty the list says so. */
  counts: Record<MaturityKey, number>
}

/** Narrow the card list by maturity and flag. Edits a draft; nothing applies until Apply. */
export function CardFilterSheet({ filter, counts }: CardFilterSheetProps) {
  const { t } = useTranslation()
  return (
    <Sheet
      open={filter.sheetOpen}
      onOpenChange={(open) => (open ? filter.open() : filter.close())}
      title={t('cards.filter.title')}
      footer={
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={filter.resetDraft}
            disabled={filter.draftCount === 0}
          >
            {t('cards.filter.reset')}
          </Button>
          <Button className="flex-1" onClick={filter.apply}>
            {t('cards.filter.apply')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <section>
          <p className="mb-2 px-1 text-(length:--p-text-label) font-bold uppercase tracking-wide text-muted-foreground">
            {t('cards.filter.maturity')}
          </p>
          <div className="flex flex-wrap gap-2">
            {MATURITY.map(({ key, labelKey, dot }) => (
              <MaturityChip
                key={key}
                label={t(labelKey as never)}
                dot={dot}
                count={counts[key]}
                on={filter.draft.maturity.has(key)}
                onToggle={() => filter.toggleMaturity(key)}
              />
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 px-1 text-(length:--p-text-label) font-bold uppercase tracking-wide text-muted-foreground">
            {t('cards.filter.status')}
          </p>
          <label className="flex items-center justify-between gap-3 rounded-card bg-secondary/40 px-3.5 py-3">
            <span className="inline-flex items-center gap-2.5 text-(length:--p-text-body) font-semibold text-heading">
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-(--warning-surface)"
              >
                <Flag className="size-4 text-(--warning-foreground)" aria-hidden />
              </span>
              {t('cards.filter.flagged')}
            </span>
            <Switch
              label={t('cards.filter.flagged')}
              checked={filter.draft.flaggedOnly}
              onCheckedChange={filter.setFlagged}
            />
          </label>
        </section>
      </div>
    </Sheet>
  )
}

function MaturityChip({
  label,
  dot,
  count,
  on,
  onToggle,
}: {
  label: string
  dot: string
  count: number
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-2 rounded-pill py-2 pl-3 pr-2 text-(length:--p-text-label) font-semibold transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.96]',
        on
          ? 'bg-primary text-primary-foreground shadow-interactive'
          : 'bg-secondary/40 text-heading ring-1 ring-inset ring-primary/10',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-2.5 rounded-full transition-colors',
          on ? 'bg-primary-foreground' : dot,
        )}
      />
      <span>{label}</span>
      <span
        className={cn(
          'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-(length:--p-text-tiny) font-bold tabular-nums transition-colors',
          on ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-card text-muted-foreground',
        )}
      >
        {count}
      </span>
    </button>
  )
}
