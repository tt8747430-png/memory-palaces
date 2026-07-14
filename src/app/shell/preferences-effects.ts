import { Injectable, effect, inject } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { setHapticsEnabled } from '@app/shared/domain'
import { PreferencesStore } from '@app/settings/data/preferences-store'
import { ThemeService } from './theme'

/**
 * Applies stored preferences to app-wide surfaces: theme attribute, haptics
 * switch, active language, and the reduced-motion override (CSS keys off
 * <html data-reduce-motion> exactly like prefers-reduced-motion).
 */
@Injectable({ providedIn: 'root' })
export class PreferencesEffects {
  private readonly store = inject(PreferencesStore)
  private readonly theme = inject(ThemeService)
  private readonly transloco = inject(TranslocoService)

  constructor() {
    effect(() => this.theme.set(this.store.effective().theme))
    effect(() => setHapticsEnabled(this.store.effective().haptics))
    effect(() => {
      const language = this.store.effective().language
      if (this.transloco.getActiveLang() !== language) this.transloco.setActiveLang(language)
    })
    effect(() => {
      const root = document.documentElement
      if (this.store.effective().reducedMotion) root.dataset['reduceMotion'] = 'true'
      else delete root.dataset['reduceMotion']
    })
  }

  init(): void {
    this.store.start()
  }
}
