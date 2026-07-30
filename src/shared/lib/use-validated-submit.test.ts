import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { type FieldErrors, useValidatedSubmit } from './use-validated-submit'
import * as React from 'react'

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.SyntheticEvent

describe('useValidatedSubmit', () => {
  it('stops the browser from navigating', () => {
    const event = submitEvent()
    const { result } = renderHook(() => useValidatedSubmit(() => ({}), vi.fn()))
    act(() => result.current.onSubmit(event))
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('surfaces every field error at once and holds the submit back', () => {
    const submit = vi.fn()
    const errors: FieldErrors<'email' | 'password'> = { email: 'bad', password: 'short' }
    const { result } = renderHook(() => useValidatedSubmit(() => errors, submit))

    act(() => result.current.onSubmit(submitEvent()))

    expect(result.current.errors).toEqual(errors)
    expect(submit).not.toHaveBeenCalled()
  })

  it('ignores keys whose error is undefined', () => {
    const submit = vi.fn()
    const { result } = renderHook(() =>
      useValidatedSubmit<'email'>(() => ({ email: undefined }), submit),
    )
    act(() => result.current.onSubmit(submitEvent()))
    expect(submit).toHaveBeenCalledOnce()
  })

  it('stays busy until the submit settles', async () => {
    let release = () => {}
    const submit = vi.fn(() => new Promise<void>((resolve) => (release = resolve)))
    const { result } = renderHook(() => useValidatedSubmit(() => ({}), submit))

    act(() => result.current.onSubmit(submitEvent()))
    expect(result.current.busy).toBe(true)

    await act(async () => {
      release()
    })
    expect(result.current.busy).toBe(false)
  })

  it('refuses a second attempt while the first is in flight', () => {
    const submit = vi.fn(() => new Promise<void>(() => {}))
    const { result } = renderHook(() => useValidatedSubmit(() => ({}), submit))

    act(() => result.current.onSubmit(submitEvent()))
    act(() => result.current.onSubmit(submitEvent()))

    expect(submit).toHaveBeenCalledOnce()
  })

  it('clears an error once the field is fixed', () => {
    let broken = true
    const { result } = renderHook(() =>
      useValidatedSubmit<'email'>(() => ({ email: broken ? 'bad' : undefined }), vi.fn()),
    )

    act(() => result.current.onSubmit(submitEvent()))
    expect(result.current.errors.email).toBe('bad')

    broken = false
    act(() => result.current.onSubmit(submitEvent()))
    expect(result.current.errors.email).toBeUndefined()
  })
})
