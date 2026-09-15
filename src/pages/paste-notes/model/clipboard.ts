export type ClipboardRead = { status: 'text'; text: string } | { status: 'empty' | 'blocked' }

export function canReadClipboard(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function'
}

export async function readClipboardText(): Promise<ClipboardRead> {
  try {
    const text = await navigator.clipboard.readText()
    return text.trim() ? { status: 'text', text } : { status: 'empty' }
  } catch {
    return { status: 'blocked' }
  }
}
