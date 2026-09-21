import { NO_PENDING } from '@/shared/lib'
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, screen } from '@testing-library/react'
import { useState } from 'react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { useExtensionPoint, useExtensionServices } from '@/shared/lib'
import { PreferencesStoreContext } from '@/entities/preferences'
import { setExtensionEnabled, setExtensionFeature } from '@/features/preferences'
import { createExtensionRuntime } from './extension-runtime'
import { ExtensionsProvider } from './ExtensionsProvider'
import type { Preferences } from '@/entities/preferences'
import { fakeManifest, loaded, preferencesWith } from './testing/fake-extension'

let mounts = 0

function Host() {
  const options = useExtensionPoint('importOptions')
  const [mountedAs] = useState(() => ++mounts)
  return (
    <>
      <span>{options.length === 0 ? 'no contributions' : options[0]!.titleKey}</span>
      <span data-testid="mount">{mountedAs}</span>
    </>
  )
}

function Services() {
  const services = useExtensionServices<{ activation: number }>('fake')
  return <span>activation {services.activation}</span>
}

function renderWith(
  extensions: string[],
  children = <Host />,
  manifest = fakeManifest(),
  stored: Partial<Preferences> = {},
) {
  const preferences = preferencesWith(extensions, stored)
  const runtime = createExtensionRuntime({
    extensions: [loaded(manifest)],
    preferences,
    repositories: {},
    pending: () => NO_PENDING,
  })
  runtime.start()
  renderWithProviders(
    <PreferencesStoreContext value={preferences}>
      <ExtensionsProvider runtime={runtime}>{children}</ExtensionsProvider>
    </PreferencesStoreContext>,
  )
  return preferences
}

/** A manifest whose one import row belongs to a feature the learner can switch off. */
const withFeature = () =>
  fakeManifest({
    features: [
      {
        id: 'rows',
        icon: <span />,
        labelKey: 'fake:label',
        descriptionKey: 'fake:description',
      },
    ],
    contributions: {
      importOptions: [
        {
          id: 'fake',
          icon: null,
          titleKey: 'fake:label',
          subtitleKey: 'fake:description',
          to: '/import/fake',
          feature: 'rows',
        },
      ],
    },
  })

afterEach(() => {
  cleanup()
  mounts = 0
})

describe('ExtensionsProvider', () => {
  it('publishes nothing while the extension is off', () => {
    renderWith([])
    expect(screen.getByText('no contributions')).toBeInTheDocument()
  })

  it('publishes an active extension’s contributions and services from the first render', () => {
    renderWith(
      ['fake'],
      <>
        <Host />
        <Services />
      </>,
    )
    expect(screen.getByText('fake:label')).toBeInTheDocument()
    expect(screen.getByText('activation 1')).toBeInTheDocument()
  })

  it('withdraws and republishes on a toggle without remounting what it wraps', async () => {
    const preferences = renderWith(['fake'])
    expect(screen.getByTestId('mount')).toHaveTextContent('1')

    await act(() => setExtensionEnabled(preferences, 'fake', false))
    expect(screen.getByText('no contributions')).toBeInTheDocument()

    await act(() => setExtensionEnabled(preferences, 'fake', true))
    expect(screen.getByText('fake:label')).toBeInTheDocument()
    // The app under the provider kept its state: switching an extension is not a reload.
    expect(screen.getByTestId('mount')).toHaveTextContent('1')
  })

  it('withdraws a row whose feature is switched off, while the extension stays on', async () => {
    const preferences = renderWith(['fake'], <Host />, withFeature())
    expect(screen.getByText('fake:label')).toBeInTheDocument()

    await act(() => setExtensionFeature(preferences, 'fake', 'rows', false))
    expect(screen.getByText('no contributions')).toBeInTheDocument()

    await act(() => setExtensionFeature(preferences, 'fake', 'rows', true))
    expect(screen.getByText('fake:label')).toBeInTheDocument()
  })

  it('offers a row whose feature nobody has ever touched', () => {
    renderWith(['fake'], <Host />, withFeature())
    expect(screen.getByText('fake:label')).toBeInTheDocument()
  })

  it('leaves a row that belongs to no feature alone', async () => {
    const preferences = renderWith(['fake'])
    await act(() => setExtensionFeature(preferences, 'fake', 'rows', false))
    expect(screen.getByText('fake:label')).toBeInTheDocument()
  })
})
