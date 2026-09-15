import { Star, Trash2 } from 'lucide-react'
import { SwipeRow } from '@/shared/ui'
import { Section } from './layout'

function SwipeDemo() {
  return (
    <SwipeRow
      leading={[
        {
          id: 'star',
          icon: <Star className="size-5" aria-hidden />,
          label: 'Star',
          accent: 'teal',
          onAction: () => {},
        },
      ]}
      trailing={[
        {
          id: 'delete',
          icon: <Trash2 className="size-5" aria-hidden />,
          label: 'Delete',
          accent: 'rose',
          onAction: () => {},
        },
      ]}
    >
      <div className="flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3">
        <span className="text-body text-heading">Swipe me left or right</span>
      </div>
    </SwipeRow>
  )
}

export function SwipeSection() {
  return (
    <Section
      id="gestures"
      title="Swipe row"
      note="touch-action trap: the row swipes without the page scrolling; actions reveal behind an opaque row."
    >
      <SwipeDemo />
    </Section>
  )
}
