import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from './drawer'

afterEach(cleanup)

function Example() {
  return (
    <Drawer>
      <DrawerTrigger>Open settings</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>Settings</DrawerTitle>
        <DrawerDescription>Adjust your preferences.</DrawerDescription>
        <DrawerClose>Done</DrawerClose>
      </DrawerContent>
    </Drawer>
  )
}

describe('Drawer', () => {
  it('opens from the trigger into a portal and closes from its close control', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Example />)

    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Adjust your preferences.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('dismisses on Escape', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Example />)

    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
