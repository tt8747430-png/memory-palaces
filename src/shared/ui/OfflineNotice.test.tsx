import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { OfflineNotice } from './OfflineNotice'

afterEach(() => {
  cleanup()
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
})

describe('OfflineNotice', () => {
  it('renders nothing while online', () => {
    renderWithProviders(<OfflineNotice />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('wears the warning edge offline, so it holds against the page gradient', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    renderWithProviders(<OfflineNotice message="No connection" />)
    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent('No connection')
    expect(notice).toHaveClass('border')
    expect(notice.className).toMatch(/border-\(--warning-border\)/)
  })
})
