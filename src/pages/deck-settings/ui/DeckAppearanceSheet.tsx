import { type SyntheticEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { type Deck, DEFAULT_DECK_COLOR, DEFAULT_DECK_ICON, useDeckStoreApi } from '@/entities/deck'
import { useSessionStore } from '@/entities/session'
import { editDeck, setDeckImage } from '@/features/deck'
import { AppearanceFields } from '@/widgets/appearance-form'
import { useStorage } from '@/shared/lib'
import { Button, Sheet } from '@/shared/ui'
import { DeckCoverPicker } from './DeckCoverPicker'

export interface DeckAppearanceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deck: Deck
}

export function DeckAppearanceSheet({ open, onOpenChange, deck }: DeckAppearanceSheetProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const storage = useStorage()
  // Only an account owns a storage prefix; a guest's cover stays inside the document.
  const userId = useSessionStore((state) =>
    state.session?.kind === 'account' ? state.session.id : null,
  )
  const [name, setName] = useState(deck.name)
  const [color, setColor] = useState(deck.color || DEFAULT_DECK_COLOR)
  const [icon, setIcon] = useState(deck.icon || DEFAULT_DECK_ICON)
  const [image, setImage] = useState<string | null>(deck.image ?? null)

  useEffect(() => {
    if (!open) return
    setName(deck.name)
    setColor(deck.color || DEFAULT_DECK_COLOR)
    setIcon(deck.icon || DEFAULT_DECK_ICON)
    setImage(deck.image ?? null)
  }, [open, deck])

  const valid = name.trim().length > 0
  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault()
    if (!valid) return
    void editDeck(deckStore, deck.id, { name: name.trim(), color, icon })
    // The cover is its own write: it may need to travel to storage, and the rest of the form must
    // not wait on a network round-trip to close.
    if (image !== (deck.image ?? null)) {
      void setDeckImage({ store: deckStore, storage, userId }, deck.id, image)
    }
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('deckSettings.appearanceTitle')}
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
          <Check className="size-4.5" aria-hidden />
          {t('deckSettings.appearanceSave')}
        </Button>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
        <DeckCoverPicker icon={icon} color={color} image={image} onChange={setImage} />
        <AppearanceFields
          subject="deck"
          name={name}
          color={color}
          icon={icon}
          onNameChange={setName}
          onColorChange={setColor}
          onIconChange={setIcon}
        />
      </form>
    </Sheet>
  )
}
