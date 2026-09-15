import { useState } from 'react'
import { Button, Empty, Progress } from '@/shared/ui'
import { Section, Cases, Case } from './layout'

export function FeedbackSection() {
  const [progress] = useState(62)
  return (
    <Section id="feedback" title="Feedback & status">
      <div className="flex flex-col gap-5">
        <Cases>
          <Case label="progress 0" full>
            <Progress value={0} />
          </Case>
          <Case label={`progress ${progress}`} full>
            <Progress value={progress} />
          </Case>
          <Case label="progress 100" full>
            <Progress value={100} />
          </Case>
        </Cases>
        <div className="border-t border-border pt-4">
          <Empty
            emoji="🗂️"
            title="No decks yet"
            description="Create your first deck to start studying."
            action={<Button size="sm">New deck</Button>}
          />
        </div>
      </div>
    </Section>
  )
}
