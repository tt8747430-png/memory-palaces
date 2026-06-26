import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EmojiField } from './EmojiField'

afterEach(cleanup)

describe('EmojiField', () => {
  it('keeps only the last emoji grapheme entered', () => {
    const onChange = vi.fn()
    render(<EmojiField value="🏛️" onChange={onChange} aria-label="Icon" />)
    // Simulate appending a new emoji from the keyboard.
    fireEvent.change(screen.getByRole('textbox', { name: 'Icon' }), { target: { value: '🏛️🎨' } })
    expect(onChange).toHaveBeenLastCalledWith('🎨')
  })

  it('ignores non-emoji input', () => {
    const onChange = vi.fn()
    render(<EmojiField value="🏛️" onChange={onChange} aria-label="Icon" />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Icon' }), { target: { value: '🏛️a' } })
    expect(onChange).not.toHaveBeenCalled()
  })
})
