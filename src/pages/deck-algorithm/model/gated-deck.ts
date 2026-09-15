import { createContext, use } from 'react'
import type { Deck, DeckSettings } from '@/entities/deck'

export interface GatedDeck {
  deck: Deck
  settings: DeckSettings
}

export const GatedDeckContext = createContext<GatedDeck | null>(null)

export function useGatedDeck(): GatedDeck {
  const gated = use(GatedDeckContext)
  if (!gated) throw new Error('Gated deck missing — render inside <MainDeckGate>')
  return gated
}
