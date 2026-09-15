import { useState } from 'react'
import { DECK_COLOR_OPTIONS } from '@/entities/deck'
import { IconColorRow } from '@/shared/ui'
import { Section, Case } from './layout'
import { FIRST_COLOR, MID_COLOR, LAST_COLOR } from './fixtures'

function ColorRowDemo({ initialColor }: { initialColor: string }) {
  const [color, setColor] = useState(initialColor)
  const [icon, setIcon] = useState('📁')
  return (
    <IconColorRow
      icon={icon}
      color={color}
      onIconChange={setIcon}
      onColorChange={setColor}
      colorOptions={DECK_COLOR_OPTIONS}
      label="Colour"
      iconLabel="Icon"
    />
  )
}

export function ColourSection() {
  return (
    <Section
      id="colour"
      title="Colour row — ring clipping"
      note="The selected swatch's ring must show in full on the first and last colours (overflow-x-auto clips both axes)."
    >
      <div className="flex flex-col gap-5">
        <Case label="first selected" full>
          <ColorRowDemo initialColor={FIRST_COLOR} />
        </Case>
        <Case label="middle selected" full>
          <ColorRowDemo initialColor={MID_COLOR} />
        </Case>
        <Case label="last selected" full>
          <ColorRowDemo initialColor={LAST_COLOR} />
        </Case>
      </div>
    </Section>
  )
}
