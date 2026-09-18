import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { PreferencesStoreContext } from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'
import { setPreferences } from '@/features/preferences'
import { useLibraryExpanded } from './use-library-expanded'

function renderExpanded(libraryExpanded: string[] = []) {
  const store = preferencesStoreHolding({ libraryExpanded })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PreferencesStoreContext value={store}>{children}</PreferencesStoreContext>
  )
  return { ...renderHook(() => useLibraryExpanded(), { wrapper }), store }
}

describe('useLibraryExpanded', () => {
  it('opens the rows the account left open', () => {
    const { result } = renderExpanded(['deck-1'])
    expect([...result.current.expanded]).toEqual(['deck-1'])
  })

  it('shows a toggle at once, and stores it for every device', async () => {
    const { result, store } = renderExpanded()
    act(() => result.current.toggleExpanded('deck-1'))
    expect(result.current.expanded.has('deck-1')).toBe(true)
    await waitFor(() => expect(store.getState().preferences?.libraryExpanded).toEqual(['deck-1']))
  })

  it('builds a rapid second toggle on the first, not on what was stored before it', async () => {
    const { result, store } = renderExpanded()
    act(() => {
      result.current.toggleExpanded('deck-1')
    })
    act(() => {
      result.current.expand('deck-2')
    })
    await waitFor(() =>
      expect(store.getState().preferences?.libraryExpanded).toEqual(['deck-1', 'deck-2']),
    )
  })

  it('follows a change another device made', async () => {
    const { result, store } = renderExpanded(['deck-1'])
    await act(() => setPreferences(store, { libraryExpanded: ['deck-9'] }))
    expect([...result.current.expanded]).toEqual(['deck-9'])
  })
})
