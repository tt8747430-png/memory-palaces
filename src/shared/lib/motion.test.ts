import { describe, expect, it } from 'vitest'
import { poseAt } from './motion'

const poses = [{ scale: 1 }, { scale: 0.9 }, { scale: 0.8 }]

describe('poseAt', () => {
  it('returns the pose for the depth asked for', () => {
    expect(poseAt(poses, 1)).toEqual({ scale: 0.9 })
  })

  it('reuses the deepest pose past the end of the table', () => {
    expect(poseAt(poses, 9)).toEqual({ scale: 0.8 })
  })

  it('treats a negative depth as the front of the stack', () => {
    expect(poseAt(poses, -1)).toEqual({ scale: 1 })
  })
})
