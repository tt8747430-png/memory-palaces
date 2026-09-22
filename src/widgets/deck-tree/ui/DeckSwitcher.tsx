import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Layers } from 'lucide-react'
import { type Deck, DEFAULT_DECK_COLOR, DEFAULT_DECK_ICON } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { ActionSheet, DeckCover, type SheetAction } from '@/shared/ui'
import { useLibraryArrangement } from '../model/use-library-arrangement'
import { DestinationSheet } from './DestinationSheet'

export interface DeckSwitcherProps {
  deck: Deck
  decks: Deck[]
  folders: Folder[]
  onSwitch: (deckId: string) => void
}

/**
 * The deck's name, with the decks it carries behind it. A subdeck is one press away instead of a
 * trip back through the Library, and **More decks…** is the move drawer wearing different words —
 * the same tree, picking a deck to open rather than a place to put one.
 */
export function DeckSwitcher({ deck, decks, folders, onSwitch }: DeckSwitcherProps) {
  const { t } = useTranslation()
  /** Which sheet is up: the short list, the whole tree, or neither. Never both. */
  const [open, setOpen] = useState<'list' | 'more' | null>(null)

  // In the order the Library shows them under this deck — the one arrangement every list reads.
  const children = useLibraryArrangement(decks, folders).subdecks(deck.id)

  const actions: SheetAction[] = [
    ...children.map((child): SheetAction => ({
      id: child.id,
      label: child.name,
      icon: (
        <DeckCover
          icon={child.icon || DEFAULT_DECK_ICON}
          color={child.color || DEFAULT_DECK_COLOR}
          className="size-7 rounded-control ring-1 ring-border"
          iconClassName="size-3.5"
        />
      ),
      onSelect: () => onSwitch(child.id),
    })),
    {
      id: 'more',
      label: t('deck.moreDecks'),
      icon: <Layers className="size-4.5" aria-hidden />,
      onSelect: () => setOpen('more'),
    },
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen('list')}
        aria-haspopup="dialog"
        aria-label={t('deck.switchFrom', { name: deck.name })}
        className="flex min-w-0 items-center gap-1 rounded-control text-left transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40"
      >
        <span className="truncate">{deck.name}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      <ActionSheet
        open={open === 'list'}
        onOpenChange={(next) => setOpen(next ? 'list' : null)}
        title={deck.name}
        description={children.length > 0 ? t('deck.switchHint') : t('deck.switchHintNoSubdecks')}
        actions={actions}
        cancelLabel={t('common.cancel')}
      />

      <DestinationSheet
        open={open === 'more'}
        onOpenChange={(next) => setOpen(next ? 'more' : null)}
        title={t('deck.openAnotherDeck')}
        subtitle={deck.name}
        decks={decks}
        folders={folders}
        targets="deck"
        action={{
          prompt: t('deck.pickToOpen'),
          confirm: (name) => t('deck.openNamed', { name }),
        }}
        onPick={(destination) => {
          setOpen(null)
          // `targets="deck"` leaves nothing else pickable, but the type still allows it.
          if (destination.kind === 'deck') onSwitch(destination.deckId)
        }}
      />
    </>
  )
}
