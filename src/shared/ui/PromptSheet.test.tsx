import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { PromptSheet } from './PromptSheet'

afterEach(cleanup)

function setup(overrides: Partial<Parameters<typeof PromptSheet>[0]> = {}) {
  const onSubmit = vi.fn()
  const onOpenChange = vi.fn()
  renderWithProviders(
    <PromptSheet
      open
      onOpenChange={onOpenChange}
      title="New deck"
      fieldLabel="Deck name"
      confirmLabel="Create"
      onSubmit={onSubmit}
      {...overrides}
    />,
  )
  return { onSubmit, onOpenChange }
}

describe('PromptSheet', () => {
  it('disables confirm until the field has content', async () => {
    setup()
    expect(await screen.findByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('submits the trimmed value and closes', async () => {
    const user = userEvent.setup()
    const { onSubmit, onOpenChange } = setup()
    await user.type(await screen.findByRole('textbox', { name: 'Deck name' }), '  History  ')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(onSubmit).toHaveBeenCalledWith('History')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not submit a blank value', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup({ initialValue: '   ' })
    await user.click(await screen.findByRole('button', { name: 'Create' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
