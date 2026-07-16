import { Injectable } from '@angular/core'

/**
 * Opens the platform file picker and resolves with the chosen file, or null if
 * the learner backed out — the same promise-returning shape as `ConfirmDialog`
 * and `PromptSheet` (ADR-0008).
 *
 * This exists so a view model can ask for a file without a hidden `<input>` in
 * a template and a `viewChild` to click it. It owns the whole dance: create the
 * input, bridge its events to a promise, and let it go.
 */
@Injectable({ providedIn: 'root' })
export class FilePicker {
  /** `accept` takes the usual input accept list, e.g. '.csv' or '.apkg,.colpkg'. */
  pick(accept: string): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.style.display = 'none'

      const settle = (file: File | null): void => {
        input.remove()
        resolve(file)
      }

      input.addEventListener('change', () => settle(input.files?.[0] ?? null), { once: true })
      // Dismissing the picker fires `cancel` rather than `change`; without it the
      // promise would never settle and the caller would hang forever.
      input.addEventListener('cancel', () => settle(null), { once: true })

      document.body.append(input)
      input.click()
    })
  }
}
