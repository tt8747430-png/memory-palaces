import { useState } from 'react'
import { Search, Settings } from 'lucide-react'
import { IconButton, ScreenHeader, SearchField } from '@/shared/ui'

/**
 * The real bar, in search mode, so the two things that only fail on a device
 * can be checked: that the header does not move when the keyboard opens
 * (ADR 0002's acceptance test), and that the field's mount-time focus does not
 * drag the layout viewport with it (CODE_STYLE §11).
 */
export function HeaderSearchProbe() {
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <div className="-mx-4 overflow-hidden rounded-card border border-border">
      <ScreenHeader
        title="Deck of cards"
        subtitle="A subtitle, so both lines are here"
        onBack={() => {}}
        backLabel="Back"
        search={
          searching ? (
            <SearchField
              className="w-full"
              value={query}
              onValueChange={setQuery}
              placeholder="Search cards"
              closeLabel="Close search"
              onClose={() => {
                setSearching(false)
                setQuery('')
              }}
            />
          ) : null
        }
        action={
          <span className="flex items-center gap-1">
            <IconButton
              variant="glass"
              aria-label="Search cards"
              onClick={() => setSearching(true)}
            >
              <Search className="size-5" aria-hidden />
            </IconButton>
            <IconButton variant="glass" aria-label="Deck settings" onClick={() => {}}>
              <Settings className="size-5" aria-hidden />
            </IconButton>
          </span>
        }
      />
    </div>
  )
}
