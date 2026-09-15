export function withoutFields<T extends object>(doc: T, ...fields: (keyof T & string)[]): T {
  const legacy = { ...doc } as Partial<T>
  for (const field of fields) delete legacy[field]
  return legacy as T
}
