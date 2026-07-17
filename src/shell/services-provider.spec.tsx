import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createTestServices } from '@/composition-root'
import { ServicesProvider, useServices } from './services-provider'

describe('ServicesProvider', () => {
  it('provides the services to consumers', () => {
    const services = createTestServices()
    const { result } = renderHook(() => useServices(), {
      wrapper: ({ children }) => (
        <ServicesProvider services={services}>{children}</ServicesProvider>
      ),
    })
    expect(result.current.deckStore).toBe(services.deckStore)
  })

  it('throws a useful error outside a provider', () => {
    expect(() => renderHook(() => useServices())).toThrow(/must be used within a ServicesProvider/)
  })
})
