/** Trigger a client-side download of text as a file (browser-only). */
export function downloadText(filename: string, text: string, type = 'application/json'): void {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
