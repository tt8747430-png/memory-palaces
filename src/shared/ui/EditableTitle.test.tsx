import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { EditableTitle } from './EditableTitle'

afterEach(cleanup)

async function enterEditMode(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = screen.getByRole('button', { name: label })
  button.focus()
  await user.keyboard('{Enter}')
  return screen.getByRole('textbox', { name: label })
}

describe('EditableTitle', () => {
  it('renders the current value as an editable trigger', () => {
    renderWithProviders(
      <EditableTitle value="History" onRename={() => {}} editLabel="Rename deck" />,
    )
    expect(screen.getByRole('button', { name: 'Rename deck' })).toHaveTextContent('History')
  })

  it('commits a changed name on Enter', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    renderWithProviders(
      <EditableTitle value="History" onRename={onRename} editLabel="Rename deck" />,
    )

    const input = await enterEditMode(user, 'Rename deck')
    await user.clear(input)
    await user.type(input, 'Geography{Enter}')
    expect(onRename).toHaveBeenCalledWith('Geography')
  })

  it('reverts on Escape without renaming', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    renderWithProviders(
      <EditableTitle value="History" onRename={onRename} editLabel="Rename deck" />,
    )

    const input = await enterEditMode(user, 'Rename deck')
    await user.clear(input)
    await user.type(input, 'Geography{Escape}')
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Rename deck' })).toHaveTextContent('History')
  })

  it('renders a static label when disabled', () => {
    renderWithProviders(
      <EditableTitle value="History" onRename={() => {}} editLabel="Rename deck" disabled />,
    )
    expect(screen.queryByRole('button', { name: 'Rename deck' })).toBeNull()
    expect(screen.getByText('History')).toBeInTheDocument()
  })
})
