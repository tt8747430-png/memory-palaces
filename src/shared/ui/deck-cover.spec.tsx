import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeckCover } from './deck-cover'

describe('DeckCover', () => {
  it('renders the icon', () => {
    render(<DeckCover icon="🧠" color="#123456" />)
    expect(screen.getByText('🧠')).toBeInTheDocument()
  })
})
