import { type SyntheticEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import {
  type Deck,
  DECK_COLOR_OPTIONS,
  DEFAULT_DECK_COLOR,
  DEFAULT_DECK_ICON,
  useDeckStoreApi,
} from '@/entities/deck'
import { editDeck } from '@/features/deck'
import { Button, IconColorRow, Sheet, Input } from '@/shared/ui'

export interface DeckAppearanceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deck: Deck
}

export function DeckAppearanceSheet({ open, onOpenChange, deck }: DeckAppearanceSheetProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const [name, setName] = useState(deck.name)
  const [color, setColor] = useState(deck.color || DEFAULT_DECK_COLOR)
  const [icon, setIcon] = useState(deck.icon || DEFAULT_DECK_ICON)

  useEffect(() => {
    if (!open) return
    setName(deck.name)
    setColor(deck.color || DEFAULT_DECK_COLOR)
    setIcon(deck.icon || DEFAULT_DECK_ICON)
  }, [open, deck])

  const valid = name.trim().length > 0
  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault()
    if (!valid) return
    void editDeck(deckStore, deck.id, { name: name.trim(), color, icon })
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('deckSettings.appearanceTitle')}
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
          <Check className="size-[18px]" aria-hidden />
          {t('deckSettings.appearanceSave')}
        </Button>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
        <Input
          aria-label={t('deck.nameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('deck.namePlaceholder')}
          enterKeyHint="done"
          maxLength={60}
        />
        <IconColorRow
          icon={icon}
          color={color}
          onIconChange={setIcon}
          onColorChange={setColor}
          colorOptions={DECK_COLOR_OPTIONS}
          label={t('folder.iconColorLabel')}
          iconLabel={t('deckSettings.iconLabel')}
        />
      </form>
    </Sheet>
  )
}
