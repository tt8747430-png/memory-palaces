import { AppScreen } from './AppScreen'
import { ScreenHeader } from './header'

export interface MissingScreenProps {
  title: string
  backLabel: string
  onBack?: () => void
}

export function MissingScreen({ title, backLabel, onBack }: MissingScreenProps) {
  return <AppScreen header={<ScreenHeader title={title} onBack={onBack} backLabel={backLabel} />} />
}
