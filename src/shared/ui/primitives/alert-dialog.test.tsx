import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'

afterEach(cleanup)

function Example() {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Delete deck</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete deck?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        <AlertDialogClose>Cancel</AlertDialogClose>
      </AlertDialogContent>
    </AlertDialog>
  )
}

describe('AlertDialog', () => {
  it('opens from the trigger and renders title + description in a portal, then closes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Example />)

    await user.click(screen.getByRole('button', { name: 'Delete deck' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Delete deck?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it('labels and describes the dialog from its title and description', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Example />)

    await user.click(screen.getByRole('button', { name: 'Delete deck' }))
    const dialog = await screen.findByRole('alertdialog')

    const title = screen.getByText('Delete deck?')
    const description = screen.getByText('This cannot be undone.')
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id)
    expect(dialog.getAttribute('aria-describedby')).toBe(description.id)
  })
})
