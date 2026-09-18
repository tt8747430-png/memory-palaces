import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import {
  createPreferencesStore,
  makePreferences,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import type { ExtensionManifest } from '@/shared/lib'
import { SettingsExtensionsPage } from './SettingsExtensionsPage'

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

// The host resolves a manifest's keys against the extension's own namespace, which
// `ExtensionsProvider` adds when it mounts one. Adding it here is what makes the rows read as copy.
i18n.addResourceBundle('en', 'fake', { label: 'Fake', description: 'A fake extension' }, true, true)

afterEach(cleanup)

const manifest: ExtensionManifest = {
  id: 'fake',
  icon: <span />,
  labelKey: 'fake:label',
  descriptionKey: 'fake:description',
  namespace: 'fake',
  loadMessages: () => Promise.resolve({}),
  routes: [],
  contributions: {},
}

function renderPage(
  manifests: ExtensionManifest[],
  extensions: string[] = [],
  highlight?: string,
  onOpenExtension?: (path: string) => void,
) {
  const stored: Preferences = {
    ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
    extensions,
  }
  const store = started(createPreferencesStore(new InMemoryRepository<Preferences>([stored])))
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

  it('marks the row a guard sent the reader to', () => {
    renderPage([manifest], [], 'fake')
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

  it('offers an enabled extension its own screen, by the path its manifest names', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const withDetail = { ...manifest, detailPath: '/settings/extensions/fake' }
    renderPage([withDetail], ['fake'], undefined, onOpen)
    await user.click(screen.getByRole('button', { name: 'Open Fake settings' }))
    expect(onOpen).toHaveBeenCalledWith('/settings/extensions/fake')
  })

  it('hides that row while the extension is off', () => {
    const withDetail = { ...manifest, detailPath: '/settings/extensions/fake' }
    renderPage([withDetail], [])
    expect(screen.queryByRole('button', { name: 'Open Fake settings' })).not.toBeInTheDocument()
  })
})
