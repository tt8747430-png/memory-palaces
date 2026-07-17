import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverlayHost, openOverlay } from './overlay-host'

describe('openOverlay', () => {
  it('mounts a node and resolves the promise with the value it passes back', async () => {
    render(<OverlayHost />)
    const promise = openOverlay<string>((resolve) => (
      <button onClick={() => resolve('picked')}>choose</button>
    ))
    await userEvent.click(await screen.findByText('choose'))
    await expect(promise).resolves.toBe('picked')
    expect(screen.queryByText('choose')).not.toBeInTheDocument() // unmounts on resolve
  })
})
