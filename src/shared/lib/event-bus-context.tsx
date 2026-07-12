import { createContext, useContext } from 'react'
import type { EventBus } from './event-bus'
import type { AppEvents } from './events'

export const EventBusContext = createContext<EventBus<AppEvents> | null>(null)

export function useEventBus(): EventBus<AppEvents> {
  const bus = useContext(EventBusContext)
  if (!bus) {
    throw new Error('Event bus missing — render inside <EventBusContext value={…}>')
  }
  return bus
}

export function useEventBusOptional(): EventBus<AppEvents> | null {
  return useContext(EventBusContext)
}
