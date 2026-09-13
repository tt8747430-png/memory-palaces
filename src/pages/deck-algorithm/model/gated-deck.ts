import { createContext, use } from 'react'
import type { Deck, DeckSettings } from '@/entities/deck'

/** The main deck `MainDeckGate` let through, and the settings it is studied by. */
export interface GatedDeck {
  deck: Deck
  settings: DeckSettings
}

export const GatedDeckContext = createContext<GatedDeck | null>(null)

/** The main deck an algorithm screen edits — there only for a screen rendered inside the gate. */
export function useGatedDeck(): GatedDeck {
  const gated = use(GatedDeckContext)
  if (!gated) throw new Error('Gated deck missing — render inside <MainDeckGate>')
  return gated
}
