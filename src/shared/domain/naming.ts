export function nextDefaultName(base: string, existing: Iterable<string>): string {
  const taken = new Set<string>()
  for (const name of existing) taken.add(name.trim().toLowerCase())
  for (let n = 1; ; n++) {
    const candidate = `${base} ${n}`
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
}
