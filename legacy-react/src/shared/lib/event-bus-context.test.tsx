import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { EventBus } from './event-bus'
import type { AppEvents } from './events'
import { EventBusContext, useEventBus, useEventBusOptional } from './event-bus-context'

afterEach(cleanup)

function OptionalProbe() {
  const bus = useEventBusOptional()
  return <span>{bus ? 'present' : 'absent'}</span>
}

function RequiredProbe() {
  useEventBus()
  return <span>ok</span>
}

describe('EventBus context', () => {
  it('useEventBusOptional returns null when no provider is mounted', () => {
    render(<OptionalProbe />)
    expect(screen.getByText('absent')).toBeInTheDocument()
  })

  it('resolves the provided bus instance', () => {
    const bus = new EventBus<AppEvents>()
    render(
      <EventBusContext value={bus}>
        <OptionalProbe />
      </EventBusContext>,
    )
    expect(screen.getByText('present')).toBeInTheDocument()
  })

  it('useEventBus throws when no provider is mounted', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<RequiredProbe />)).toThrow(/event bus/i)
    spy.mockRestore()
  })
})
