import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { FirstRunGuide } from './FirstRunGuide'

afterEach(cleanup)

describe('FirstRunGuide', () => {
  it('explains the method of loci in three steps', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <FirstRunGuide />
      </I18nextProvider>,
    )

    expect(screen.getByText('How it works')).toBeInTheDocument()
    expect(screen.getByText('Build a palace')).toBeInTheDocument()
    expect(screen.getByText('Place vivid cues')).toBeInTheDocument()
    expect(screen.getByText('Train your recall')).toBeInTheDocument()
    expect(screen.getAllByText(/^[123]$/)).toHaveLength(3)
  })
})
