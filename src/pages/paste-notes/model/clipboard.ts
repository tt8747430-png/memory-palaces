/**
 * Reading the clipboard is a request, not a read.
 *
 * WebKit has no `clipboard-read` permission to hand out: unless the text was copied by this same
 * origin, every `readText()` raises a native Paste prompt, and answering it grants that one read
 * only — which is why the prompt comes back on every attempt and no amount of allowing makes it
 * stop. Worse, on iOS the grant lands *after* the call that raised the prompt has already been
 * rejected, so the first attempt of a session always fails and the second succeeds.
 *
 * Neither is recoverable here, so the caller gets the two failures apart instead: an empty
 * clipboard is a dead end worth saying plainly, a refused read is worth offering again now that
 * the grant has caught up.
 */
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
