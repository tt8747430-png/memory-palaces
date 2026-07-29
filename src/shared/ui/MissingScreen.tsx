import { AppScreen } from './AppScreen'
import { ScreenHeader } from './ScreenHeader'

export interface MissingScreenProps {
  /** What the user came looking for, e.g. "Deck not found". */
  title: string
  backLabel: string
  onBack?: () => void
}

/**
 * What a screen shows when the thing it was opened for is gone — a deck deleted
 * on another device, a badge id that no longer exists. Bare header, way back,
 * nothing else to act on.
 */
export function MissingScreen({ title, backLabel, onBack }: MissingScreenProps) {
  return <AppScreen header={<ScreenHeader title={title} onBack={onBack} backLabel={backLabel} />} />
}
