import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { SettingsHelpPage } from './SettingsHelpPage'

afterEach(cleanup)

describe('SettingsHelpPage', () => {
  it('renders the FAQ questions and a support contact', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SettingsHelpPage onBack={() => {}} />
      </I18nextProvider>,
    )
    expect(screen.getByText(/how do i create a memory palace/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /email support/i })).toHaveAttribute(
      'href',
      'mailto:support@mindscape.app',
    )
  })
})
