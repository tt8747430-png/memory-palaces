import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { SettingsAboutPage } from './SettingsAboutPage'

afterEach(cleanup)

describe('SettingsAboutPage', () => {
  it('shows the app identity and version', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SettingsAboutPage onBack={() => {}} />
      </I18nextProvider>,
    )
    expect(screen.getByText('Mindscape')).toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })
})
