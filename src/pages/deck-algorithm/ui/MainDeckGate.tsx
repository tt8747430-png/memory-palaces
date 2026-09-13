import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { isSubdeck, useDeck } from '@/entities/deck'
import { MissingScreen, ScreenLoading } from '@/shared/ui'
import { GatedDeckContext } from '../model/gated-deck'
import { MainDeckOnlyScreen } from './MainDeckOnlyScreen'

export interface MainDeckGateProps {
  deckId: string
  title: string
  onBack?: () => void
  onOpenMainDeck?: (mainDeckId: string) => void
  /** The screen for a main deck. It reads the deck through `useGatedDeck`. */
  children: ReactNode
}

/**
 * The algorithm screens edit settings only a main deck holds (`MAIN_DECK_SETTINGS`). This is the one
 * place they wait for the store, meet a stale id, and turn a subdeck toward its main deck — so each
 * screen renders only for a main deck that is there.
 */
export function MainDeckGate({
  deckId,
  title,
  onBack,
  onOpenMainDeck,
  children,
}: MainDeckGateProps) {
  const { t } = useTranslation()
  const { deck, mainDeck, settings, ready } = useDeck(deckId)

  if (!ready) return <ScreenLoading />

  if (!deck || !mainDeck) {
    return <MissingScreen title={t('deck.notFound')} onBack={onBack} backLabel={t('common.back')} />
  }

  if (isSubdeck(deck)) {
    return (
      <MainDeckOnlyScreen
        title={title}
        deck={deck}
        mainDeck={mainDeck}
        onBack={onBack}
        onOpenMainDeck={onOpenMainDeck}
      />
    )
  }

  return <GatedDeckContext value={{ deck, settings }}>{children}</GatedDeckContext>
}
