import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { useTranslation } from 'react-i18next'
import { renderWithProviders } from './render-with-providers'

afterEach(cleanup)

function Probe() {
  const { t } = useTranslation()
  // Resolve a real key so the assertion fails if i18n isn't wired (a missing key
  // returns the key string itself, not the English value).
  return <span>{t('common.cancel')}</span>
}

describe('renderWithProviders', () => {
  it('supplies working i18n context to descendants', () => {
    renderWithProviders(<Probe />)
    // 'common.cancel' resolves to its English value, proving translations are live.
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.queryByText('common.cancel')).toBeNull()
  })

  it('renders arbitrary UI', () => {
    renderWithProviders(<button type="button">Go</button>)
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })
})
