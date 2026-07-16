import { Injectable } from '@angular/core'
import type { Theme } from '@app/settings'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Applies the learner's theme to <html data-theme>, tracking the OS on 'system'. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private media: MediaQueryList | null = null
  private readonly onSystemChange = (): void => {
    document.documentElement.dataset['theme'] = this.media?.matches ? 'dark' : 'light'
  }

  set(theme: Theme): void {
    this.media?.removeEventListener('change', this.onSystemChange)
    this.media = null

    if (theme !== 'system') {
      document.documentElement.dataset['theme'] = theme
      return
    }
    this.media = window.matchMedia(DARK_QUERY)
    this.onSystemChange()
    this.media.addEventListener('change', this.onSystemChange)
  }
}
