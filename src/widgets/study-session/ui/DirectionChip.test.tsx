import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { DirectionChip } from './DirectionChip'

afterEach(cleanup)

function chip(action: Parameters<typeof DirectionChip>[0]['action']) {
  renderWithProviders(
    <DirectionChip
      action={action}
      x={motionValue(0)}
      y={motionValue(0)}
      dir="right"
      className=""
    />,
  )
}

describe('DirectionChip', () => {
  it('tints each answer by what it means — a grade, a Fast review answer, a flag', () => {
    chip('again')
    expect(screen.getByText('Again')).toHaveClass('text-(--danger-on-surface)')
    cleanup()

    chip('good')
    expect(screen.getByText('Good')).toHaveClass('text-(--success-on-surface)')
    cleanup()

    chip('gotIt')
    expect(screen.getByText('Got it')).toHaveClass('text-(--success-on-surface)')
    cleanup()

    chip('notQuite')
    expect(screen.getByText('Not quite')).toHaveClass('text-(--warning-foreground)')
    cleanup()

    chip('flag')
    expect(screen.getByText('Flag')).toHaveClass('text-(--rating-edge)')
  })

  it('shows nothing for a direction switched off', () => {
    chip('none')
    expect(document.body).toHaveTextContent('')
  })
})
