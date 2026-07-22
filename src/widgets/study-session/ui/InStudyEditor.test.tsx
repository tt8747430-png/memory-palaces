import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeCard } from '@/entities/card'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { InStudyEditor } from './InStudyEditor'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()
const CARD = makeCard({
  id: 'c1',
  createdAt: CREATED,
  deckId: 'd1',
  front: 'Original front',
  back: 'Original back',
})

function setup(overrides: Partial<Parameters<typeof InStudyEditor>[0]> = {}) {
  const onSave = vi.fn()
  const onClose = vi.fn()
  renderWithProviders(
    <InStudyEditor open card={CARD} onSave={onSave} onClose={onClose} {...overrides} />,
  )
  return { onSave, onClose }
}

describe('InStudyEditor', () => {
  it('prefills the fields from the card', async () => {
    setup()
    expect(await screen.findByLabelText('Front (what to recall)')).toHaveValue('Original front')
    expect(screen.getByLabelText('Back (what it means)')).toHaveValue('Original back')
  })

  it('saves the edited card and closes', async () => {
    const user = userEvent.setup()
    const { onSave, onClose } = setup()
    const front = await screen.findByLabelText('Front (what to recall)')
    await user.clear(front)
    await user.type(front, 'New front')
    await user.click(screen.getByRole('button', { name: 'Save card' }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ front: 'New front', back: 'Original back' }),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('disables save when a required field is blank', async () => {
    const user = userEvent.setup()
    setup()
    const front = await screen.findByLabelText('Front (what to recall)')
    await user.clear(front)
    expect(screen.getByRole('button', { name: 'Save card' })).toBeDisabled()
  })
})
