import { Button, ToggleRow } from '@/shared/ui'
import { useBibleT } from '../i18n/use-bible-t'

export interface TargetPickerProps {
  auto: boolean
  onAutoChange: (value: boolean) => void
  /** The Chapter decks feature is on. Off, the learner always says where the cards go. */
  autoAvailable: boolean
  /** Where the cards will land, said plainly before they are added; null while the app decides. */
  destination: string | null
  onPickDeck: () => void
  onNameDeck: () => void
}

/**
 * "Include in decks" is automatic **placement**, not which deck: on, a deck per book and a subdeck
 * per chapter; off, the learner says where.
 */
export function TargetPicker({
  auto,
  onAutoChange,
  autoAvailable,
  destination,
  onPickDeck,
  onNameDeck,
}: TargetPickerProps) {
  const t = useBibleT()
  return (
    <section className="flex flex-col gap-3">
      {autoAvailable ? (
        <ToggleRow
          label={t('target')}
          description={t('targetHint')}
          checked={auto}
          onChange={onAutoChange}
        />
      ) : (
        <p className="text-label leading-snug text-muted-foreground">{t('chapterDecksOff')}</p>
      )}
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
