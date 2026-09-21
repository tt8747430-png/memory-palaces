import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { PreferencesStoreContext } from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'
import type { ExtensionManifest } from '@/shared/lib'
import { FeatureGate } from './FeatureGate'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  Navigate: (props: Record<string, unknown>) => {
    navigate(props)
    return null
  },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const manifest = {
  id: 'fake',
  overview: { route: { path: '/fake' } },
} as unknown as ExtensionManifest

function renderGate(store: ReturnType<typeof preferencesStoreHolding>) {
  return render(
    <PreferencesStoreContext value={store}>
      <FeatureGate manifest={manifest} feature="reader">
        <span>the screen</span>
      </FeatureGate>
    </PreferencesStoreContext>,
  )
}

describe('FeatureGate', () => {
  it('renders the screen while its feature is on', () => {
    renderGate(preferencesStoreHolding({}))
    expect(screen.getByText('the screen')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('sends the learner to the overview — where the switch is — once the feature is off', () => {
    renderGate(preferencesStoreHolding({ disabledFeatures: { fake: ['reader'] } }))
    expect(screen.queryByText('the screen')).not.toBeInTheDocument()
    expect(navigate).toHaveBeenCalledWith({ to: '/fake', replace: true })
  })

  it('withdraws a mounted screen the moment the feature goes off under it', async () => {
    const store = preferencesStoreHolding({})
    renderGate(store)
    expect(screen.getByText('the screen')).toBeInTheDocument()

    await act(async () => {
      const current = store.getState().preferences!
      await store.getState().save({ ...current, disabledFeatures: { fake: ['reader'] } })
    })
    expect(screen.queryByText('the screen')).not.toBeInTheDocument()
    expect(navigate).toHaveBeenCalledWith({ to: '/fake', replace: true })
  })
})
