import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { ExtensionServicesContext, useExtensionServices } from './extension-services-context'

const within =
  (active: Record<string, unknown>) =>
  ({ children }: { children: ReactNode }) => (
    <ExtensionServicesContext value={active}>{children}</ExtensionServicesContext>
  )

describe('useExtensionServices', () => {
  it('returns what the active extension published', () => {
    const services = { store: 'held' }
    const { result } = renderHook(() => useExtensionServices('fake'), {
      wrapper: within({ fake: services }),
    })
    expect(result.current).toBe(services)
  })

  it('says which extension is missing — its screens render only while it is active', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useExtensionServices('fake'), { wrapper: within({}) })).toThrow(
      'The fake extension is not active',
    )
  })
})
