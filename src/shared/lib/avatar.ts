export interface CropRect {
  sx: number
  sy: number
  size: number
}

export function coverSquare(width: number, height: number): CropRect {
  const size = Math.min(width, height)
  return { sx: (width - size) / 2, sy: (height - size) / 2, size }
}

const AVATAR_PX = 256
/** Deck covers render larger than an avatar, so they get more pixels to work with. */
export const DECK_IMAGE_PX = 512
const AVATAR_QUALITY = 0.82

/** Centre-crops to a square and re-encodes, so what is shown is exactly what gets uploaded. */
export function fileToSquareImage(file: File, size: number = AVATAR_PX): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Could not load the image.'))
      image.onload = () => {
        const { sx, sy, size: crop } = coverSquare(image.width, image.height)
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Could not process the image.'))
          return
        }
        context.drawImage(image, sx, sy, crop, crop, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', AVATAR_QUALITY))
      }
      image.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Turns the data URL `fileToSquareImage` produced back into bytes, so the same processed image that
 * is shown locally is the one uploaded — no second, differently-cropped encode.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(',')
  if (!header || encoded === undefined) throw new Error('Not a data URL')
  const type = header.match(/^data:([^;]+)/)?.[1] ?? 'application/octet-stream'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}
