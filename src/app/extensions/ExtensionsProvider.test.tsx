import { afterEach, describe, expect, it, vi } from 'vitest'
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
import { toast } from 'sonner'
import { ExtensionsProvider } from './ExtensionsProvider'

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

const manifest: ExtensionManifest = {
  id: 'fake',
  icon: <span />,
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

function renderWith(extensions: string[], mounted: ExtensionManifest = manifest) {
  const stored: Preferences = {
    ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
    extensions,
  }
  const store = started(createPreferencesStore(new InMemoryRepository<Preferences>([stored])))
  renderWithProviders(
    <PreferencesStoreContext value={store}>
      <ExtensionsProvider manifests={[mounted]}>
        <Host />
      </ExtensionsProvider>
    </PreferencesStoreContext>,
  )
  return store
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
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

  it('waits for the namespace again when it is switched back on', async () => {
    const store = renderWith(['fake'])
    await waitFor(() => expect(screen.getByText('fake:label')).toBeInTheDocument())

    await act(async () => {
      await setExtensionEnabled(store, 'fake', false)
    })
    await waitFor(() => expect(screen.getByText('no contributions')).toBeInTheDocument())

    await act(async () => {
      await setExtensionEnabled(store, 'fake', true)
    })

    // The contribution comes back only with its bundle: publishing it against a namespace that
    // the switch-off removed is what paints a raw key.
    await waitFor(() => expect(screen.getByText('fake:label')).toBeInTheDocument())
    expect(i18n.getResourceBundle('en', 'fake')).toEqual({
      label: 'Fake',
      importSubtitle: 'From the fake',
    })
  })

  it('publishes nothing and says so when its messages will not load', async () => {
    renderWith(['fake'], { ...manifest, loadMessages: () => Promise.reject(new Error('offline')) })
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(screen.getByText('no contributions')).toBeInTheDocument()
    expect(i18n.getResourceBundle('en', 'fake')).toBeUndefined()
  })

  it('publishes nothing when its provider will not load, even with the messages in', async () => {
    // The import row would navigate into a store context that never mounted, so readiness waits
    // for both chunks — and the messages resolving first must not grant it early.
    renderWith(['fake'], {
      ...manifest,
      loadProvider: () => Promise.reject(new Error('offline')),
    })
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(screen.getByText('no contributions')).toBeInTheDocument()
  })
})
