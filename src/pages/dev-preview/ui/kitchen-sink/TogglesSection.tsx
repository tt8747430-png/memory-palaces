import { useState } from 'react'
import { Flame } from 'lucide-react'
import { Badge, Chip, SegmentedControl, SelectDot, SrsStatusChip, Switch } from '@/shared/ui'
import { Section, Cases, Case } from './layout'

const BADGE_VARIANTS = ['default', 'info', 'outline'] as const

function SegmentedDemo() {
  const [value, setValue] = useState<'flashcards' | 'quiz' | 'match'>('flashcards')
  return (
    <SegmentedControl
      aria-label="Study mode"
      value={value}
      onChange={setValue}
      options={[
        { value: 'flashcards', label: 'Cards' },
        { value: 'quiz', label: 'Quiz' },
        { value: 'match', label: 'Match' },
      ]}
    />
  )
}

export function TogglesSection() {
  const [toggle, setToggle] = useState(true)
  const [selected, setSelected] = useState(true)
  return (
    <Section id="toggles" title="Selection & toggles">
      <div className="flex flex-col gap-5">
        <Case label="SegmentedControl" full>
          <SegmentedDemo />
        </Case>
        <Cases>
          <Case label="switch on">
            <Switch checked={toggle} onCheckedChange={setToggle} label="Notifications" />
          </Case>
          <Case label="switch disabled">
            <Switch checked={false} onCheckedChange={() => {}} disabled label="Disabled" />
          </Case>
          <Case label="select dot">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected((value) => !value)}
                aria-pressed={selected}
              >
                <SelectDot state={selected ? 'checked' : 'unchecked'} />
              </button>
              <SelectDot state="indeterminate" />
            </div>
          </Case>
        </Cases>
        <Cases>
          <Case label="chip">
            <Chip icon={<Flame className="size-3.5" aria-hidden />}>12 due</Chip>
          </Case>
          {BADGE_VARIANTS.map((variant) => (
            <Case key={variant} label={`badge · ${variant}`}>
              <Badge variant={variant}>{variant}</Badge>
            </Case>
          ))}
          <Case label="SRS status">
            <SrsStatusChip />
          </Case>
        </Cases>
      </div>
    </Section>
  )
}
