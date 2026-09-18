import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, screen } from '@testing-library/react'
import { useState } from 'react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { useExtensionPoint, useExtensionServices } from '@/shared/lib'
import { setExtensionEnabled } from '@/features/preferences'
import { createExtensionRuntime } from './extension-runtime'
import { ExtensionsProvider } from './ExtensionsProvider'
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

function renderWith(extensions: string[], children = <Host />) {
  const preferences = preferencesWith(extensions)
  const runtime = createExtensionRuntime({
    extensions: [loaded(fakeManifest())],
    preferences,
    repositories: {},
  })
  runtime.start()
  renderWithProviders(<ExtensionsProvider runtime={runtime}>{children}</ExtensionsProvider>)
  return preferences
}

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
})
