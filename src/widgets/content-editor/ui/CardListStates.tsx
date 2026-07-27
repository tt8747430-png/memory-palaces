import { useTranslation } from 'react-i18next'
import { MapPin, Plus, Upload } from 'lucide-react'
import { Button } from '@/shared/ui'

export function EmptyCards({ onAdd, onImport }: { onAdd: () => void; onImport: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-card-featured bg-info-surface text-accent">
        <MapPin className="size-6" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-balance text-(length:--p-text-sub) font-semibold text-heading">
        {t('cards.emptyTitle')}
      </h3>
      <p className="max-w-[34ch] text-pretty text-(length:--p-text-body) text-muted-foreground">
        {t('cards.emptyHint')}
      </p>
      <div className="mt-5 flex w-full max-w-60 flex-col gap-2">
        <Button onClick={onAdd}>
          <Plus className="size-[18px]" aria-hidden />
          {t('cards.addCard')}
        </Button>
        <Button variant="secondary" onClick={onImport}>
          <Upload className="size-[18px]" aria-hidden />
          {t('cards.transfer.importShort')}
        </Button>
      </div>
    </div>
  )
}

function NarrowedEmpty({
  message,
  action,
  onAction,
}: {
  message: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="rounded-card bg-card-glass p-6 text-center shadow-rest">
      <p className="text-(length:--p-text-body) text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-2 text-(length:--p-text-label) font-semibold text-accent"
      >
        {action}
      </button>
    </div>
  )
}

export function NoResults({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation()
  return (
    <NarrowedEmpty
      message={t('cards.noResults')}
      action={t('cards.clearSearch')}
      onAction={onClear}
    />
  )
}

export function FilterEmpty({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation()
  return (
    <NarrowedEmpty
      message={t('cards.filterEmpty')}
      action={t('cards.filterClear')}
      onAction={onClear}
    />
  )
}
