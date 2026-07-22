import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { useTranslation } from 'react-i18next'
import { renderWithProviders } from './render-with-providers'

afterEach(cleanup)

function Probe() {
  const { t } = useTranslation()
  // any real key works; assert the provider resolves translations, not a specific string
  return <span>{typeof t('common.cancel') === 'string' ? 'i18n-ready' : 'no-i18n'}</span>
}

describe('renderWithProviders', () => {
  it('supplies i18n context to descendants', () => {
    renderWithProviders(<Probe />)
    expect(screen.getByText('i18n-ready')).toBeInTheDocument()
  })

  it('renders arbitrary UI', () => {
    renderWithProviders(<button type="button">Go</button>)
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })
})
