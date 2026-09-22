import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ActionPalette } from './ActionPalette'

afterEach(cleanup)

describe('ActionPalette', () => {
  it('lists every action once, marking the side each one already sits on', () => {
    renderWithProviders(
      <ActionPalette
        type="folder"
        config={{ leading: ['edit'], trailing: ['delete'] }}
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByRole('button', { name: /Edit|Add deck|Delete/ })).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveTextContent('→')
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveTextContent('←')
    expect(screen.getByRole('button', { name: 'Add deck' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('adds an action to the side that is chosen as the target', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <ActionPalette type="folder" config={{ leading: [], trailing: [] }} onChange={onChange} />,
    )
    await user.click(screen.getByRole('button', { name: /Swipe left/ }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onChange).toHaveBeenCalledWith({ leading: [], trailing: ['delete'] })
  })

  it('takes an action off whichever side it is on', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <ActionPalette
        type="folder"
        config={{ leading: ['edit'], trailing: ['delete'] }}
        onChange={onChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onChange).toHaveBeenCalledWith({ leading: ['edit'], trailing: [] })
  })

  it('offers nothing more to a side that is full, and says so', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ActionPalette
        type="folder"
        config={{ leading: ['edit', 'addDeck'], trailing: [] }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /Swipe right/ })).toHaveTextContent('2 / 2')
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Swipe left/ }))
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled()
  })
})
