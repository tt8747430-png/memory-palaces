import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { makeFaceProps } from './face-fixtures'
import { InitialsFace } from './InitialsFace'

afterEach(cleanup)

describe('InitialsFace', () => {
  it('masks answer words behind per-word reveal buttons', () => {
    renderWithProviders(
      <InitialsFace {...makeFaceProps({ mode: 'initials', answer: 'Pax Romana' })} />,
    )
    expect(screen.getByRole('button', { name: /pax/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /romana/i })).toBeInTheDocument()
  })

  it('reveals the whole answer with the show-words aid, then re-masks it', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <InitialsFace {...makeFaceProps({ mode: 'initials', answer: 'Pax Romana' })} />,
    )

    await user.click(screen.getByRole('button', { name: 'Show words' }))
    expect(screen.getByText('Pax')).toBeInTheDocument()
    expect(screen.getByText('Romana')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show initials' }))
    expect(screen.getByRole('button', { name: /pax/i })).toBeInTheDocument()
  })
})
