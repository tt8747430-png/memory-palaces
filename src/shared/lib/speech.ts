export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string): void {
  if (!speechAvailable() || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  synth.speak(new SpeechSynthesisUtterance(text))
}
