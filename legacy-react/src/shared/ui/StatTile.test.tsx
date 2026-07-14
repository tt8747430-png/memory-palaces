import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Zap } from 'lucide-react'
import { StatTile } from './StatTile'

afterEach(cleanup)

describe('StatTile', () => {
  it('renders the icon, value, and label', () => {
    render(<StatTile icon={<Zap data-testid="icon" />} value="1,200" label="Total XP" />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('1,200')).toBeInTheDocument()
    expect(screen.getByText('Total XP')).toBeInTheDocument()
  })
})
