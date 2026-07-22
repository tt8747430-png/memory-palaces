import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { makeFaceProps } from './face-fixtures'
import { BlurFace } from './BlurFace'

afterEach(cleanup)

describe('BlurFace', () => {
  it('shows the answer words with the blur controls', () => {
    renderWithProviders(<BlurFace {...makeFaceProps({ mode: 'blur', answer: 'Pax Romana' })} />)
    expect(screen.getByText('Pax')).toBeInTheDocument()
    expect(screen.getByText('Romana')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Blur' })).toBeInTheDocument()
  })

  it('blurs words into reveal buttons and restores them with "show all"', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BlurFace {...makeFaceProps({ mode: 'blur', answer: 'Pax Romana' })} />)

    await user.click(screen.getByRole('button', { name: 'Blur' }))
    expect(screen.getAllByRole('button', { name: /Reveal/ }).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Show all' }))
    expect(screen.queryByRole('button', { name: /Reveal/ })).toBeNull()
  })
})
