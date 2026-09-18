import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ExtensionServicesContext } from '@/shared/lib'
import { ROUTES } from '@/shared/config/routes'
import { ExtensionGate } from './ExtensionGate'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  Outlet: () => <span>the screen</span>,
  Navigate: (props: Record<string, unknown>) => {
    navigate(props)
    return null
  },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ExtensionGate', () => {
  it('renders the extension’s screen while it is active', () => {
    render(
      <ExtensionServicesContext value={{ fake: {} }}>
        <ExtensionGate id="fake" />
      </ExtensionServicesContext>,
    )
    expect(screen.getByText('the screen')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('swaps the screen for Settings once it is switched off, rather than letting it throw', () => {
    render(
      <ExtensionServicesContext value={{}}>
        <ExtensionGate id="fake" />
      </ExtensionServicesContext>,
    )
    expect(screen.queryByText('the screen')).not.toBeInTheDocument()
    expect(navigate).toHaveBeenCalledWith({
      to: ROUTES.settingsExtensions,
      search: { highlight: 'fake' },
      replace: true,
    })
  })
})
