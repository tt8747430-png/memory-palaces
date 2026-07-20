import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { DECK_COLOR_OPTIONS, type Deck, DEFAULT_DECK_COLOR, DEFAULT_DECK_ICON } from '@/decks'
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  IconColorRow,
  openOverlay,
  type OverlayResolver,
  TextField,
  useOverlayController,
} from '@/shared/ui'

/** What the learner edited: the deck's name and its cover's icon + colour. */
export interface DeckAppearanceDraft {
  name: string
  color: string
  icon: string
}

/**
 * Opens the deck appearance editor, resolving the trimmed draft on save or `null` on
 * cancel/dismiss. `main`'s `DeckAppearanceSheet` dispatched `editDeck` itself and took an
 * `open`/`onOpenChange` pair; the drawer here only *returns the draft*, leaving the write to the
 * settings page — the same shape as `openFolderDrawer`.
 */
export function openDeckAppearanceDrawer(deck: Deck): Promise<DeckAppearanceDraft | null> {
  return openOverlay<DeckAppearanceDraft | null>((resolve) => (
    <DeckAppearanceBody deck={deck} resolve={resolve} />
  ))
}

function DeckAppearanceBody({
  deck,
  resolve,
}: {
  deck: Deck
  resolve: OverlayResolver<DeckAppearanceDraft | null>
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(deck.name)
  const [color, setColor] = useState(deck.color || DEFAULT_DECK_COLOR)
  const [icon, setIcon] = useState(deck.icon || DEFAULT_DECK_ICON)
  const { open, close, onOpenChangeComplete } = useOverlayController(resolve)

  const valid = name.trim().length > 0
  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!valid) return
    close({ name: name.trim(), color, icon })
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close(null)
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('deckSettings.appearanceTitle')}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={submit} className="flex flex-col gap-5 px-4 pb-2 pt-1.5">
          <TextField
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
        <DrawerFooter>
          <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
            <Check className="size-[1.125rem]" aria-hidden />
            {t('deckSettings.appearanceSave')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
