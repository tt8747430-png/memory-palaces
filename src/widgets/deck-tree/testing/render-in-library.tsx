import type { ReactElement, ReactNode } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { type ExtensionContributions, ExtensionPointsContext } from '@/shared/lib'
import { started } from '@/shared/test/started'
import { type Card, CardStoreContext, createCardStore } from '@/entities/card'
import { type Preferences, PreferencesStoreContext } from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'

export interface LibrarySettings {
  prefs?: Partial<Preferences> | null
  cards?: Card[]
  contributions?: ExtensionContributions
}

/**
 * Renders inside everything the Library's arrangement reads: the learner's order settings and
 * filter, the orders and filters extensions contribute, and the cards an order may count. Decks
 * and folders are the component's own props.
 */
export function renderInLibrary(
  ui: ReactElement,
  { prefs = null, cards = [], contributions = {} }: LibrarySettings = {},
): RenderResult {
  const preferences = preferencesStoreHolding(prefs)
  const cardStore = started(createCardStore(new InMemoryRepository<Card>(cards)))
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <MotionConfig reducedMotion="always">
          <ExtensionPointsContext value={contributions}>
            <PreferencesStoreContext value={preferences}>
              <CardStoreContext value={cardStore}>{children}</CardStoreContext>
            </PreferencesStoreContext>
          </ExtensionPointsContext>
        </MotionConfig>
      </I18nextProvider>
    )
  }
  return render(ui, { wrapper: Wrapper })
}
