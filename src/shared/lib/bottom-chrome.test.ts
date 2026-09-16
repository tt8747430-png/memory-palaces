import { afterEach, describe, expect, it } from 'vitest'
import { claimBottomChrome, clearanceOf } from './bottom-chrome'

const VIEWPORT = 800

function surface(top: number, height = 64): Element {
  const node = document.createElement('div')
  node.getBoundingClientRect = () =>
    ({
      top,
      height,
      width: 320,
      bottom: top + height,
      left: 0,
      right: 320,
      x: 0,
      y: top,
    }) as DOMRect
  return node
}

function chrome(): string {
  return document.documentElement.style.getPropertyValue('--bottom-chrome')
}

let release: (() => void)[] = []

function claim(node: Element) {
  const off = claimBottomChrome(node)
  release.push(off)
  return off
}

Object.defineProperty(document.documentElement, 'clientHeight', {
  configurable: true,
  value: VIEWPORT,
})

afterEach(() => {
  release.forEach((off) => off())
  release = []
})

describe('clearanceOf', () => {
  it('measures how far a surface reaches up from the viewport bottom', () => {
    expect(clearanceOf({ top: 700, width: 320, height: 100 }, VIEWPORT)).toBe(100)
  })

  it('claims nothing for a surface with no box', () => {
    expect(clearanceOf({ top: 0, width: 0, height: 0 }, VIEWPORT)).toBe(0)
  })

  it('never claims below the viewport bottom', () => {
    expect(clearanceOf({ top: 900, width: 320, height: 100 }, VIEWPORT)).toBe(0)
  })
})

describe('claimBottomChrome', () => {
  it('publishes the claim as a pixel length', () => {
    claim(surface(700))
    expect(chrome()).toBe('100px')
  })

  it('publishes the tallest claim, not the last one', () => {
    claim(surface(700))
    claim(surface(620))
    expect(chrome()).toBe('180px')

    claim(surface(760))
    expect(chrome()).toBe('180px')
  })

  it('falls back to the remaining claims when one is released', () => {
    claim(surface(700))
    const releaseTall = claim(surface(620))

    releaseTall()
    expect(chrome()).toBe('100px')
  })

  it('stops publishing once the last claim is released', () => {
    const off = claim(surface(700))
    expect(chrome()).toBe('100px')

    off()
    expect(chrome()).toBe('')
  })

  it('ignores a release that already ran', () => {
    claim(surface(700))
    const off = claim(surface(620))

    off()
    off()
    expect(chrome()).toBe('100px')
  })
})
