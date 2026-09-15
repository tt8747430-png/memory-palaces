import { Section } from './layout'
import { KeyboardProbe } from '../KeyboardProbe'

export function KeyboardSection() {
  return (
    <Section
      id="keyboard"
      title="Keyboard & viewport"
      note="Open on a phone: focus the field and read the live numbers to see whether iOS pans the visual viewport or resizes the layout one."
    >
      <KeyboardProbe />
    </Section>
  )
}
