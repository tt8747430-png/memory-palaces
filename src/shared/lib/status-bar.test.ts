import { afterEach, describe, expect, it } from 'vitest'
import {
  paintedBehind,
  readStatusBarPaint,
  statusBarColor,
  statusBarIsDeclared,
  statusBarIsPainted,
} from './status-bar'

function declare(color: string) {
  const style = document.createElement('style')
  style.id = 'status-bar-token'
  style.textContent = `:root { --status-bar: ${color}; }`
  document.head.append(style)
}

function tell(color: string) {
  const meta = document.createElement('meta')
  meta.name = 'theme-color'
  meta.content = color
  document.head.append(meta)
}

afterEach(() => {
  document.getElementById('status-bar-token')?.remove()
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove())
})

describe('statusBarColor', () => {
  it('reads the colour the stylesheet names', () => {
    declare('#091a7a')
    expect(statusBarColor()).toBe('#091a7a')
  })

  it('answers empty before a stylesheet has declared one', () => {
    expect(statusBarColor()).toBe('')
  })
})

describe('statusBarIsDeclared', () => {
  it('holds when the platform was told the colour the stylesheet names', () => {
    declare('#091a7a')
    tell('#091a7a')
    expect(statusBarIsDeclared(readStatusBarPaint())).toBe(true)
  })

  it('compares the colours, not how they were written', () => {
    declare('#091a7a')
    tell('rgb(9, 26, 122)')
    expect(statusBarIsDeclared(readStatusBarPaint())).toBe(true)
  })

  it('fails on a stale meta — the bar would be painted the old theme’s colour', () => {
    declare('#0b1533')
    tell('#091a7a')
    expect(statusBarIsDeclared(readStatusBarPaint())).toBe(false)
  })

  it('fails when nothing tells the platform at all', () => {
    declare('#091a7a')
    expect(statusBarIsDeclared(readStatusBarPaint())).toBe(false)
  })
})

describe('statusBarIsPainted', () => {
  it('fails when nothing opaque sits under the bar, which is when it turns white', () => {
    declare('#091a7a')
    tell('#091a7a')
    // jsdom hits no pixels, which is the same answer as a page that paints nothing up there.
    expect(statusBarIsPainted(readStatusBarPaint())).toBe(false)
  })
})

describe('paintedBehind', () => {
  const mount = (html: string) => {
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.append(host)
    return host
  }

  it('looks past a glass layer to the fill that actually stops the light', () => {
    // The header tints what scrolled under it; the white card beneath is what a sampler reads.
    const host = mount(
      '<div style="background-color: rgb(255,255,255)">' +
        '<div id="glass" style="background-color: rgba(0,0,0,0.3)"></div>' +
        '</div>',
    )

    expect(paintedBehind(host.querySelector('#glass'))).toBe('rgb(255, 255, 255)')
    host.remove()
  })

  it('takes the first fill that is opaque, not the first that is coloured', () => {
    const host = mount(
      '<div style="background-color: rgb(9,26,122)">' +
        '<div style="background-color: rgba(255,255,255,0.9)">' +
        '<span id="leaf"></span>' +
        '</div></div>',
    )

    expect(paintedBehind(host.querySelector('#leaf'))).toBe('rgb(9, 26, 122)')
    host.remove()
  })

  it('answers empty when nothing up the tree is opaque — the bar is the platform’s guess', () => {
    const host = mount('<div id="bare"></div>')
    document.body.style.backgroundColor = 'transparent'

    expect(paintedBehind(host.querySelector('#bare'))).toBe('')
    document.body.style.backgroundColor = ''
    host.remove()
  })
})
