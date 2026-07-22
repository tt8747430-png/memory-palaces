import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { FolderForm } from './FolderForm'

afterEach(cleanup)

function setup(overrides: Partial<Parameters<typeof FolderForm>[0]> = {}) {
  const onNameChange = vi.fn()
  const onColorChange = vi.fn()
  const onIconChange = vi.fn()
  renderWithProviders(
    <FolderForm
      name="Languages"
      color="from-sky-500 to-blue-600"
      icon="📁"
      onNameChange={onNameChange}
      onColorChange={onColorChange}
      onIconChange={onIconChange}
      {...overrides}
    />,
  )
  return { onNameChange, onColorChange, onIconChange }
}

describe('FolderForm', () => {
  it('prefills the name field from props', () => {
    setup()
    expect(screen.getByRole('textbox', { name: 'Folder name' })).toHaveValue('Languages')
  })

  it('reports name edits through onNameChange', async () => {
    const user = userEvent.setup()
    const { onNameChange } = setup({ name: '' })
    await user.type(screen.getByRole('textbox', { name: 'Folder name' }), 'H')
    expect(onNameChange).toHaveBeenCalledWith('H')
  })

  it('reports colour choices through onColorChange', async () => {
    const user = userEvent.setup()
    const { onColorChange } = setup()
    await user.click(screen.getByRole('button', { name: 'ocean' }))
    expect(onColorChange).toHaveBeenCalledWith('from-blue-600 to-indigo-700')
  })
})
