/**
 * A document the way an older version of the app wrote it: the named fields are simply not there.
 * That is what a row pushed by a device running an earlier build looks like when it is pulled back —
 * the type says the field exists and the stored data disagrees, so the cast is the point.
 */
export function withoutFields<T extends object>(doc: T, ...fields: (keyof T & string)[]): T {
  const legacy = { ...doc } as Partial<T>
  for (const field of fields) delete legacy[field]
  return legacy as T
}
