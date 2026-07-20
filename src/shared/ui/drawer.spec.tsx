import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Drawer, DrawerContent, DrawerTitle } from './drawer'

describe('Drawer', () => {
  it('renders content through the VirtualKeyboardProvider without throwing', () => {
    expect(() =>
      render(
        <Drawer open>
          <DrawerContent>
            <DrawerTitle>T</DrawerTitle>
          </DrawerContent>
        </Drawer>,
      ),
    ).not.toThrow()

    expect(screen.getByText('T')).toBeInTheDocument()
  })
})
