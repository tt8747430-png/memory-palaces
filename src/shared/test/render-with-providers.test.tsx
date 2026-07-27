import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { useTranslation } from 'react-i18next'
import { renderWithProviders } from './render-with-providers'

afterEach(cleanup)

function Probe() {
  const { t } = useTranslation()
  return <span>{t('common.cancel')}</span>
}

describe('renderWithProviders', () => {
  it('supplies working i18n context to descendants', () => {
    renderWithProviders(<Probe />)
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.queryByText('common.cancel')).toBeNull()
  })

  it('renders arbitrary UI', () => {
    renderWithProviders(<button type="button">Go</button>)
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })
})
