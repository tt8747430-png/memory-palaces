import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { i18n } from '@/shared/i18n'
import { started } from '@/shared/test/started'
import {
  createPreferencesStore,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'
import { type ExtensionManifest, extensionRoute } from '@/shared/lib'
import { SettingsExtensionsPage } from './SettingsExtensionsPage'

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

// The host resolves a manifest's keys against the extension's own namespace, which the app adds
// behind the splash for every registered extension. Adding it here is what makes the rows read as
// copy.
i18n.addResourceBundle(
  'en',
  'fake',
  { label: 'Fake', description: 'A fake extension', admin: 'Fake library' },
  true,
  true,
)

afterEach(cleanup)

const Screen = () => null

const manifest: ExtensionManifest = {
  id: 'fake',
  icon: <span />,
  labelKey: 'fake:label',
  descriptionKey: 'fake:description',
  namespace: 'fake',
  loadMessages: () => Promise.resolve({}),
  routes: [],
  loadRuntime: () => Promise.resolve({ activate: () => ({ services: {}, deactivate: () => {} }) }),
  contributions: {},
}

function renderPage(
  manifests: ExtensionManifest[],
  extensions: string[] = [],
  {
    highlight,
    onOpenExtension,
    devMode = false,
  }: { highlight?: string; onOpenExtension?: (path: string) => void; devMode?: boolean } = {},
) {
  const store = preferencesStoreHolding({ extensions, devMode })
  renderWithProviders(
    <PreferencesStoreContext value={store}>
      <SettingsExtensionsPage
        manifests={manifests}
        highlight={highlight}
        onOpenExtension={onOpenExtension}
        onBack={vi.fn()}
      />
    </PreferencesStoreContext>,
  )
  return store
}

describe('SettingsExtensionsPage', () => {
  it('says so when the build carries no extensions', () => {
    renderPage([])
    expect(screen.getByText('No extensions yet')).toBeInTheDocument()
  })

  it('shows a switch per extension, off by default', () => {
    renderPage([manifest])
    expect(screen.getByRole('switch', { name: 'Fake' })).not.toBeChecked()
  })

  it('turning one on writes it to preferences', async () => {
    const user = userEvent.setup()
    const store = renderPage([manifest])
    await user.click(screen.getByRole('switch', { name: 'Fake' }))
    await waitFor(() => expect(store.getState().preferences?.extensions).toEqual(['fake']))
  })

  it('turning one off leaves the rest alone', async () => {
    const user = userEvent.setup()
    const store = renderPage([manifest], ['fake', 'from-the-future'])
    await user.click(screen.getByRole('switch', { name: 'Fake' }))
    await waitFor(() =>
      expect(store.getState().preferences?.extensions).toEqual(['from-the-future']),
    )
  })

  it('marks the row a guard sent the learner to', () => {
    renderPage([manifest], [], { highlight: 'fake' })
    expect(
      screen.getByRole('switch', { name: 'Fake' }).closest('[data-highlighted]'),
    ).not.toBeNull()
  })

  it('says so when the write fails — the one error this page can have', async () => {
    const user = userEvent.setup()
    const failing = started(
      createPreferencesStore({
        observe: (emit: (all: Preferences[]) => void) => {
          emit([])
          return () => {}
        },
        save: () => Promise.reject(new Error('disk is full')),
        remove: () => Promise.resolve(),
      } as never),
    )
    renderWithProviders(
      <PreferencesStoreContext value={failing}>
        <SettingsExtensionsPage manifests={[manifest]} onBack={vi.fn()} />
      </PreferencesStoreContext>,
    )
    await user.click(screen.getByRole('switch', { name: 'Fake' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  const withAdmin: ExtensionManifest = {
    ...manifest,
    admin: {
      labelKey: 'fake:admin',
      route: extensionRoute(
        '/settings/extensions/fake',
        () => Promise.resolve({ Screen }),
        'Screen',
      ),
    },
  }

  it('offers an enabled extension its admin screen in dev mode, by the path its manifest names', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    renderPage([withAdmin], ['fake'], { onOpenExtension: onOpen, devMode: true })
    await user.click(screen.getByRole('button', { name: 'Fake library' }))
    expect(onOpen).toHaveBeenCalledWith('/settings/extensions/fake')
  })

  it('shows nothing of the admin screen outside dev mode', () => {
    renderPage([withAdmin], ['fake'])
    expect(screen.queryByRole('button', { name: 'Fake library' })).not.toBeInTheDocument()
  })

  it('hides the admin row while the extension is off', () => {
    renderPage([withAdmin], [], { devMode: true })
    expect(screen.queryByRole('button', { name: 'Fake library' })).not.toBeInTheDocument()
  })
})
