import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { KeyboardInsetProvider } from './keyboard-inset-provider'

describe('KeyboardInsetProvider', () => {
  it('renders children without throwing when window.visualViewport is undefined', () => {
    expect(window.visualViewport).toBeUndefined()

    expect(() =>
      render(
        <KeyboardInsetProvider>
          <p>content</p>
        </KeyboardInsetProvider>,
      ),
    ).not.toThrow()
  })
})
