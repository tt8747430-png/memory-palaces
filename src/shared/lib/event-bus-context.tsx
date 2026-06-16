import { createContext, useContext } from 'react'
import type { EventBus } from './event-bus'
import type { AppEvents } from './events'

/** React injection point for the composition-root {@link EventBus} singleton. */
export const EventBusContext = createContext<EventBus<AppEvents> | null>(null)

/** Imperative handle to the bus (publish or subscribe). Throws if no provider. */
export function useEventBus(): EventBus<AppEvents> {
  const bus = useContext(EventBusContext)
  if (!bus) {
    throw new Error('Event bus missing — render inside <EventBusContext value={…}>')
  }
  return bus
}

/** The bus, or null when none is provided. Lets emitters (e.g. session reward) no-op
 * in focused tests that mount without the app's event wiring. */
export function useEventBusOptional(): EventBus<AppEvents> | null {
  return useContext(EventBusContext)
}
