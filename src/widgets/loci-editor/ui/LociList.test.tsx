import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { makeLocus, type Locus } from '@/entities/locus'
import { LociList } from './LociList'

afterEach(cleanup)

const locus = (id: string, front: string, back: string): Locus =>
  makeLocus({ id, createdAt: new Date(0).toISOString(), roomId: 'r1', front, back })

function renderList(props: Partial<Parameters<typeof LociList>[0]> = {}) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn() }
  render(
    <I18nextProvider i18n={i18n}>
      <LociList loci={[]} {...handlers} {...props} />
    </I18nextProvider>,
  )
  return handlers
}

describe('LociList', () => {
  it('shows an empty state when there are no loci', () => {
    renderList({ loci: [] })
    expect(screen.getByText(/no loci/i)).toBeInTheDocument()
  })

  it('renders each locus front and back', () => {
    renderList({ loci: [locus('a', 'Mihi', 'to me')] })
    expect(screen.getByText('Mihi')).toBeInTheDocument()
    expect(screen.getByText('to me')).toBeInTheDocument()
  })

  it('invokes onDelete for the targeted locus', async () => {
    const user = userEvent.setup()
    const handlers = renderList({ loci: [locus('a', 'Mihi', 'to me')] })
    await user.click(screen.getByRole('button', { name: /delete mihi/i }))
    expect(handlers.onDelete).toHaveBeenCalledWith('a')
  })

  it('edits front and back inline, passing trimmed changes', async () => {
    const user = userEvent.setup()
    const handlers = renderList({ loci: [locus('a', 'Mihi', 'to me')] })

    await user.click(screen.getByRole('button', { name: /edit mihi/i }))
    const front = screen.getByRole('textbox', { name: /prompt \(front\)/i })
    const back = screen.getByRole('textbox', { name: /answer \(back\)/i })
    await user.clear(front)
    await user.type(front, '  Tibi  ')
    await user.clear(back)
    await user.type(back, '  to you  ')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(handlers.onEdit).toHaveBeenCalledWith('a', { front: 'Tibi', back: 'to you' })
  })
})
