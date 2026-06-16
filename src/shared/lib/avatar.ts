export interface CropRect {
  sx: number
  sy: number
  size: number
}

/** The largest centered square within the source — the region to draw from. */
export function coverSquare(width: number, height: number): CropRect {
  const size = Math.min(width, height)
  return { sx: (width - size) / 2, sy: (height - size) / 2, size }
}

const AVATAR_PX = 256
const AVATAR_QUALITY = 0.82

/** Read an image file, center-crop to a square, downscale to 256px, and return a JPEG
 * data-URL. Browser-only (canvas); the geometry lives in coverSquare for unit tests. */
export function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Could not load the image.'))
      image.onload = () => {
        const { sx, sy, size } = coverSquare(image.width, image.height)
        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_PX
        canvas.height = AVATAR_PX
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Could not process the image.'))
          return
        }
        context.drawImage(image, sx, sy, size, size, 0, 0, AVATAR_PX, AVATAR_PX)
        resolve(canvas.toDataURL('image/jpeg', AVATAR_QUALITY))
      }
      image.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
