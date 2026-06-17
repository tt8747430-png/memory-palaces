import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { SocialButtons } from './SocialButtons'

afterEach(cleanup)

function renderSocial(props: Parameters<typeof SocialButtons>[0] = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <SocialButtons {...props} />
    </I18nextProvider>,
  )
}

describe('SocialButtons', () => {
  it('renders Google and Apple buttons with accessible names', () => {
    renderSocial()
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /apple/i })).toBeInTheDocument()
  })

  it('calls onSelect with the chosen provider', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderSocial({ onSelect })
    await user.click(screen.getByRole('button', { name: /google/i }))
    expect(onSelect).toHaveBeenCalledWith('google')
  })
})
