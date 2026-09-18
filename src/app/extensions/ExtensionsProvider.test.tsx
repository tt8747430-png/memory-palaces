import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { i18n } from '@/shared/i18n'
import {
  createPreferencesStore,
  makePreferences,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { setExtensionEnabled } from '@/features/preferences'
import type { ExtensionManifest } from '@/shared/lib'
import { useExtensionPoint } from '@/shared/lib'
import { ExtensionsProvider } from './ExtensionsProvider'

const manifest: ExtensionManifest = {
  id: 'fake',
  icon: null,
  labelKey: 'label',
  descriptionKey: 'description',
  namespace: 'fake',
  loadMessages: () => Promise.resolve({ label: 'Fake', importSubtitle: 'From the fake' }),
  routes: [],
  contributions: {
    importOptions: [
      {
        id: 'fake',
        icon: null,
        titleKey: 'fake:label',
        subtitleKey: 'fake:importSubtitle',
        to: '/import/fake',
      },
    ],
  },
}

function Host() {
  const options = useExtensionPoint('importOptions')
  return <span>{options.length === 0 ? 'no contributions' : options[0]!.titleKey}</span>
}

function renderWith(extensions: string[]) {
  const stored: Preferences = {
    ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
    extensions,
  }
  const store = started(createPreferencesStore(new InMemoryRepository<Preferences>([stored])))
  renderWithProviders(
    <PreferencesStoreContext value={store}>
      <ExtensionsProvider manifests={[manifest]}>
        <Host />
      </ExtensionsProvider>
    </PreferencesStoreContext>,
  )
  return store
}

afterEach(() => {
  cleanup()
  i18n.removeResourceBundle('en', 'fake')
})

describe('ExtensionsProvider', () => {
  it('publishes nothing while the extension is off', () => {
    renderWith([])
    expect(screen.getByText('no contributions')).toBeInTheDocument()
  })

  it('publishes the enabled extension contributions, once its namespace is in', async () => {
    renderWith(['fake'])
    await waitFor(() => expect(screen.getByText('fake:label')).toBeInTheDocument())
    expect(i18n.getResourceBundle('en', 'fake')).toEqual({
      label: 'Fake',
      importSubtitle: 'From the fake',
    })
  })

  it('withdraws everything when the extension is switched off', async () => {
    const store = renderWith(['fake'])
    await waitFor(() => expect(screen.getByText('fake:label')).toBeInTheDocument())
    await act(async () => {
      await setExtensionEnabled(store, 'fake', false)
    })
    await waitFor(() => expect(screen.getByText('no contributions')).toBeInTheDocument())
    expect(i18n.getResourceBundle('en', 'fake')).toBeUndefined()
  })
})
