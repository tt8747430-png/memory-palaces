import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
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

function FieldExample() {
  return (
    <Drawer open>
      <DrawerContent>
        <DrawerTitle>Rename</DrawerTitle>
        <input aria-label="Name" defaultValue="New Deck" />
        <DrawerFooter>
          <button type="button">Save</button>
        </DrawerFooter>
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

  it('collapses a selected field so a touch drag is read as a swipe, not a page scroll', async () => {
    renderWithProviders(<FieldExample />)
    const field = (await screen.findByLabelText('Name')) as HTMLInputElement
    field.focus()
    field.setSelectionRange(0, field.value.length)

    fireEvent.pointerDown(screen.getByText('Rename'), { pointerType: 'touch' })

    expect(field.selectionStart).toBe(field.value.length)
    expect(field.selectionEnd).toBe(field.value.length)
  })

  it('leaves the selection alone when the touch lands in the field itself', async () => {
    renderWithProviders(<FieldExample />)
    const field = (await screen.findByLabelText('Name')) as HTMLInputElement
    field.focus()
    field.setSelectionRange(0, field.value.length)

    fireEvent.pointerDown(field, { pointerType: 'touch' })

    expect(field.selectionStart).toBe(0)
    expect(field.selectionEnd).toBe(field.value.length)
  })

  it('holds the focused field while a footer control is pressed, so the keyboard cannot drop it', async () => {
    renderWithProviders(<FieldExample />)
    const field = await screen.findByLabelText('Name')
    field.focus()

    const prevented = !fireEvent.mouseDown(screen.getByRole('button', { name: 'Save' }))
    expect(prevented).toBe(true)
    expect(document.activeElement).toBe(field)
  })

  it('lets a footer control take focus when no field is open', async () => {
    renderWithProviders(<FieldExample />)
    const save = await screen.findByRole('button', { name: 'Save' })

    expect(fireEvent.mouseDown(save)).toBe(true)
  })
})
