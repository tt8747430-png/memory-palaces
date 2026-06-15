/**
 * Text-to-speech over the Web Speech API, guarded for environments without it
 * (tests, SSR, unsupported browsers). Side-effecting by nature — kept thin so the
 * pure domain never reaches for the wall device directly.
 */
export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Cancel any in-flight utterance, then speak `text`. No-op when unsupported or empty. */
export function speak(text: string): void {
  if (!speechAvailable() || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  synth.speak(new SpeechSynthesisUtterance(text))
}

export function cancelSpeech(): void {
  if (!speechAvailable()) return
  window.speechSynthesis.cancel()
}
