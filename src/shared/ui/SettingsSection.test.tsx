import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SettingsSection } from './SettingsSection'

afterEach(cleanup)

describe('SettingsSection', () => {
  it('renders a heading and its children when titled', () => {
    renderWithProviders(
      <SettingsSection title="Account">
        <div>Row</div>
      </SettingsSection>,
    )
    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByText('Row')).toBeInTheDocument()
  })

  it('omits the heading when no title is given', () => {
    renderWithProviders(
      <SettingsSection>
        <div>Row</div>
      </SettingsSection>,
    )
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.getByText('Row')).toBeInTheDocument()
  })
})
