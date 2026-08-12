import { afterEach, describe, expect, it, vi } from 'vitest'
import { canReadClipboard, readClipboardText } from './clipboard'

const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

function stubClipboard(readText: unknown) {
  Object.defineProperty(navigator, 'clipboard', {
    value: readText === undefined ? undefined : { readText },
    configurable: true,
  })
}

afterEach(() => {
  if (original) Object.defineProperty(navigator, 'clipboard', original)
  else stubClipboard(undefined)
})

describe('canReadClipboard', () => {
  it('is false where the API is missing', () => {
    stubClipboard(undefined)
    expect(canReadClipboard()).toBe(false)
  })

  it('is true where the API is present', () => {
    stubClipboard(vi.fn())
    expect(canReadClipboard()).toBe(true)
  })
})

describe('readClipboardText', () => {
  it('returns the text', async () => {
    stubClipboard(vi.fn().mockResolvedValue('Zeus, King of the gods'))
    expect(await readClipboardText()).toEqual({
      status: 'text',
      text: 'Zeus, King of the gods',
    })
  })

  it('reports whitespace as empty rather than pasting it', async () => {
    stubClipboard(vi.fn().mockResolvedValue('  \n '))
    expect(await readClipboardText()).toEqual({ status: 'empty' })
  })

  it('reports a refused read as blocked, not empty', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')))
    expect(await readClipboardText()).toEqual({ status: 'blocked' })
  })
})
