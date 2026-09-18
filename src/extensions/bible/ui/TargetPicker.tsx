import { Button, ToggleRow } from '@/shared/ui'
import { useBibleT } from '../i18n/use-bible-t'

export interface TargetPickerProps {
  auto: boolean
  onAutoChange: (value: boolean) => void
  /** Where the cards will land, said plainly before they are added; null while the app decides. */
  destination: string | null
  onPickDeck: () => void
  onNameDeck: () => void
}

/**
 * "Include in decks" is automatic **placement**, not which deck: on, a deck per book and a subdeck
 * per chapter; off, the reader says where.
 */
export function TargetPicker({
  auto,
  onAutoChange,
  destination,
  onPickDeck,
  onNameDeck,
}: TargetPickerProps) {
  const t = useBibleT()
  return (
    <section className="flex flex-col gap-3">
      <ToggleRow
        label={t('target')}
        description={t('targetHint')}
        checked={auto}
        onChange={onAutoChange}
      />
      {auto ? null : (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onPickDeck}>
            {t('targetExisting')}
          </Button>
          <Button variant="secondary" size="sm" onClick={onNameDeck}>
            {t('targetNew')}
          </Button>
        </div>
      )}
      {destination ? (
        <p className="text-label leading-snug text-muted-foreground">{destination}</p>
      ) : null}
    </section>
  )
}
