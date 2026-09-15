import { useState } from 'react'
import { ArrowUpDown, Clock, Flame } from 'lucide-react'
import { Avatar, DeckCover, EditableTitle, FolderGlyph, GlassCard, StatTile } from '@/shared/ui'
import { Section, Cases, Case } from './layout'
import { FIRST_COLOR, MID_COLOR, LONG_TEXT } from './fixtures'

function EditableTitleDemo({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  return <EditableTitle value={value} onRename={setValue} editLabel="Rename" />
}

export function DataSection() {
  return (
    <Section id="data" title="Data display">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={<Flame className="size-5" aria-hidden />} value="14" label="Day streak" />
          <StatTile
            icon={<Clock className="size-5" aria-hidden />}
            value="2h 40m"
            label="Studied"
          />
        </div>
        <Cases>
          <Case label="deck cover">
            <DeckCover icon="📗" color={FIRST_COLOR} className="size-16 rounded-card" />
          </Case>
          <Case label="folder glyph">
            <FolderGlyph icon="📁" color={MID_COLOR} className="size-16" />
          </Case>
          <Case label="avatar">
            <Avatar name="Ada Lovelace" className="size-12" />
          </Case>
          <Case label="glass card">
            <GlassCard className="grid size-16 place-items-center rounded-card">
              <ArrowUpDown className="size-5 text-heading" aria-hidden />
            </GlassCard>
          </Case>
        </Cases>
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <Case label="editable title" full>
            <EditableTitleDemo initial="Biology 101" />
          </Case>
          <Case label="editable title — long (truncation)" full>
            <EditableTitleDemo initial={LONG_TEXT} />
          </Case>
        </div>
      </div>
    </Section>
  )
}
