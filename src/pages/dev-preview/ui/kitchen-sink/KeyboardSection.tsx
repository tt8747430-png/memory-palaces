import { Case, Cases, Section } from './layout'
import { KeyboardProbe } from '../KeyboardProbe'
import { HeaderSearchProbe } from '../HeaderSearchProbe'

export function KeyboardSection() {
  return (
    <Section
      id="keyboard"
      title="Keyboard & viewport"
      note="Open on a phone: focus the field and read the live numbers to see whether iOS pans the visual viewport or resizes the layout one. Then open the header search — the bar must not move at all."
    >
      <Cases>
        <Case label="Viewport probe" full>
          <KeyboardProbe />
        </Case>
        <Case label="Header search (focuses on mount)" full>
          <HeaderSearchProbe />
        </Case>
      </Cases>
    </Section>
  )
}
