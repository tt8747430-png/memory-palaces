import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PRESETS } from '@/shared/lib/card-style/presets'
import { CardScene } from './CardScene'

afterEach(() => {
  cleanup()
  delete document.documentElement.dataset.theme
})

const style = { preset: 'sky', font: 'default', textSize: 30, alignment: 'center' } as const

describe('CardScene', () => {
  it('prints the material by day', () => {
    document.documentElement.dataset.theme = 'light'
    render(<CardScene style={style}>card</CardScene>)
    const scene = screen.getByTestId('card-scene')
    expect(scene.style.getPropertyValue('--scene-bg')).toBe(PRESETS.sky.scene)
    expect(scene.dataset.scene).toBe('light')
  })

  it('prints the same material at night, and lights the chrome from the dark block', () => {
    document.documentElement.dataset.theme = 'dark'
    render(<CardScene style={style}>card</CardScene>)
    const scene = screen.getByTestId('card-scene')
    expect(scene.style.getPropertyValue('--scene-bg')).toBe(PRESETS.sky.dark?.scene)
    expect(scene.dataset.scene).toBe('dark')
  })

  it('leaves a preset made of tokens to the theme', () => {
    document.documentElement.dataset.theme = 'dark'
    render(<CardScene style={{ ...style, preset: 'plain' }}>card</CardScene>)
    const scene = screen.getByTestId('card-scene')
    expect(scene.style.getPropertyValue('--scene-bg')).toBe(PRESETS.plain.scene)
    expect(scene.dataset.scene).toBeUndefined()
  })
})
