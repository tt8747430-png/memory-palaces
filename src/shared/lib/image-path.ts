const PUBLIC_OBJECT = /\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)$/

export function coerceImagePath(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.startsWith('data:')) return value
  const match = PUBLIC_OBJECT.exec(value)
  if (!match?.[1]) return value
  return decodeURIComponent(match[1].split('?')[0] ?? match[1])
}
