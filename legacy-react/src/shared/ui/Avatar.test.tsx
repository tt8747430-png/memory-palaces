import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

afterEach(cleanup)

describe('Avatar', () => {
  it('renders the image when a src is provided', () => {
    const { container } = render(<Avatar name="Ada" src="data:image/jpeg;base64,xxx" />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,xxx')
  })

  it('falls back to initials when there is no src', () => {
    render(<Avatar name="Ada Lovelace" />)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })
})
