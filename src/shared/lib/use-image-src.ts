import { useEffect, useState } from 'react'
import type { StorageBucket } from '@/shared/api'
import { isInlineImage } from './inline-image'
import { onImageSettled, readCachedImage } from './image-cache'

export type ImageSrc =
  | { state: 'inline'; src: string }
  | { state: 'cached'; src: string }
  | { state: 'pending' }
  | { state: 'unavailable' }

const PENDING: ImageSrc = { state: 'pending' }
const UNAVAILABLE: ImageSrc = { state: 'unavailable' }

export function useImageSrc(bucket: StorageBucket, value: string | null | undefined): ImageSrc {
  const [resolved, setResolved] = useState<ImageSrc>(value ? PENDING : UNAVAILABLE)
  const inline = isInlineImage(value)

  useEffect(() => {
    if (!value || inline) return

    const image = { bucket, path: value }
    let url: string | null = null
    let live = true

    const look = async () => {
      const cached = await readCachedImage(image)
      if (!live) return
      if (cached.state === 'cached') {
        if (url) URL.revokeObjectURL(url)
        url = URL.createObjectURL(cached.blob)
        setResolved({ state: 'cached', src: url })
      } else {
        setResolved(cached.state === 'missing' ? UNAVAILABLE : PENDING)
      }
    }

    setResolved(PENDING)
    void look()
    const stop = onImageSettled((settled) => {
      if (settled.bucket === bucket && settled.path === value) void look()
    })

    return () => {
      live = false
      stop()
      if (url) URL.revokeObjectURL(url)
    }
  }, [bucket, value, inline])

  if (!value) return UNAVAILABLE
  if (inline) return { state: 'inline', src: value }
  return resolved
}
