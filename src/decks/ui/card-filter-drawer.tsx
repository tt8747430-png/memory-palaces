import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flag } from 'lucide-react'
import type { SrsStatus } from '@/shared/domain'
import { cn } from '@/shared/lib'
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  openOverlay,
  type OverlayResolver,
  Switch,
  useOverlayController,
} from '@/shared/ui'

export interface CardFilter {
  maturity: Set<SrsStatus>
  flaggedOnly: boolean
}

export interface OpenCardFilterDrawerOptions {
  /** The filter currently applied — the drawer opens showing it. */
  filter: CardFilter
  /** Per-status card counts, shown as a badge on each chip. */
  counts: Record<SrsStatus, number>
}

const MATURITY_DOT: Record<SrsStatus, string> = {
  new: 'bg-[var(--text-faint)]',
  learning: 'bg-accent',
  known: 'bg-success',
}

const MATURITY_ORDER: readonly SrsStatus[] = ['new', 'learning', 'known']

/**
 * Opens the maturity/flagged filter as a Drawer that resolves the applied `CardFilter`,
 * or `null` when dismissed. `main` drove this from four `useState`s in `DeckContentEditor`
 * (`filterOpen`, `draftMaturity`, `draftFlagged`, plus the applied pair); here the draft
 * lives with the drawer that owns it and only the applied filter crosses back.
 */
export function openCardFilterDrawer(
  options: OpenCardFilterDrawerOptions,
): Promise<CardFilter | null> {
  return openOverlay<CardFilter | null>((resolve) => (
    <CardFilterDrawerBody {...options} resolve={resolve} />
  ))
}

function CardFilterDrawerBody({
  filter,
  counts,
  resolve,
}: OpenCardFilterDrawerOptions & { resolve: OverlayResolver<CardFilter | null> }) {
  const { t } = useTranslation()
  const [maturity, setMaturity] = useState<Set<SrsStatus>>(new Set(filter.maturity))
  const [flaggedOnly, setFlaggedOnly] = useState(filter.flaggedOnly)
  const { open, close, onOpenChangeComplete } = useOverlayController(resolve)

  const activeCount = maturity.size + (flaggedOnly ? 1 : 0)

  const toggleMaturity = (key: SrsStatus) =>
    setMaturity((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const reset = () => {
    setMaturity(new Set())
    setFlaggedOnly(false)
  }

  const labelFor: Record<SrsStatus, string> = {
    new: t('cards.filter.new'),
    learning: t('cards.filter.learning'),
    known: t('cards.filter.known'),
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close(null)
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('cards.filter.title')}</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-5 px-4 pb-2 pt-1.5">
          <div>
            <p className="mb-2 px-1 text-[length:var(--ms-text-label)] font-bold uppercase tracking-wide text-muted-foreground">
              {t('cards.filter.maturity')}
            </p>
            <div className="flex flex-wrap gap-2">
              {MATURITY_ORDER.map((key) => {
                const on = maturity.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleMaturity(key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-pill py-2 pl-3 pr-2 text-[length:var(--ms-text-label)] font-semibold transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.96]',
                      on
                        ? 'bg-primary text-primary-foreground shadow-interactive'
                        : 'bg-secondary/40 text-heading ring-1 ring-inset ring-primary/10',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'size-2.5 rounded-full transition-colors',
                        on ? 'bg-primary-foreground' : MATURITY_DOT[key],
                      )}
                    />
                    <span>{labelFor[key]}</span>
                    <span
                      className={cn(
                        'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[length:var(--ms-text-tiny)] font-bold tabular-nums transition-colors',
                        on
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-card text-muted-foreground',
                      )}
                    >
                      {counts[key]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 px-1 text-[length:var(--ms-text-label)] font-bold uppercase tracking-wide text-muted-foreground">
              {t('cards.filter.status')}
            </p>
            <label className="flex items-center justify-between gap-3 rounded-card bg-secondary/40 px-3.5 py-3">
              <span className="inline-flex items-center gap-2.5 text-[length:var(--ms-text-body)] font-semibold text-heading">
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--warning-surface)]"
                >
                  <Flag className="size-4 text-[var(--warning-foreground)]" aria-hidden />
                </span>
                {t('cards.filter.flagged')}
              </span>
              <Switch
                label={t('cards.filter.flagged')}
                checked={flaggedOnly}
                onCheckedChange={setFlaggedOnly}
              />
            </label>
          </div>
        </div>

        <DrawerFooter>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={reset} disabled={activeCount === 0}>
              {t('cards.filter.reset')}
            </Button>
            <Button className="flex-1" onClick={() => close({ maturity, flaggedOnly })}>
              {t('cards.filter.apply')}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
