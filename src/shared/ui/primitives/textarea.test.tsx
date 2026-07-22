import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Textarea } from './textarea'

afterEach(cleanup)

describe('Textarea', () => {
  it('accepts multi-line input and fires onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(<Textarea aria-label="Notes" onChange={onChange} />)
    const textarea = screen.getByRole('textbox', { name: 'Notes' })
    await user.type(textarea, 'line one{Enter}line two')
    expect(onChange).toHaveBeenCalled()
    expect(textarea).toHaveValue('line one\nline two')
  })

  it('defaults to three rows and forwards placeholder', () => {
    renderWithProviders(<Textarea aria-label="Notes" placeholder="Write here" />)
    const textarea = screen.getByRole('textbox', { name: 'Notes' })
    expect(textarea).toHaveAttribute('rows', '3')
    expect(textarea).toHaveAttribute('placeholder', 'Write here')
  })

  it('does not accept input when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(<Textarea aria-label="Notes" disabled onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: 'Notes' }), 'x')
    expect(onChange).not.toHaveBeenCalled()
  })
})
