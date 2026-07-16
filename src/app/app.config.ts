import { provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core'
import type { ApplicationConfig } from '@angular/core'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { providePrimeNG } from 'primeng/config'
import { MessageService } from 'primeng/api'
import { MindscapePreset } from './shared/ui/prime-preset'

import { routes } from './app.routes'
import { provideAppData } from './data.providers'
import { provideServiceWorker } from '@angular/service-worker'
import { provideHttpClient } from '@angular/common/http'
import { TranslocoHttpLoader } from './transloco-loader'
import { provideTransloco } from '@jsverse/transloco'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAppData(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    providePrimeNG({
      theme: { preset: MindscapePreset, options: { darkModeSelector: '[data-theme="dark"]' } },
      // Overlay stacking contract (ADR-0002): CDK overlays sit at 1000, so
      // PrimeNG menus/popovers/toasts opened from dialogs stack above them.
      zIndex: { modal: 1300, overlay: 1200, menu: 1200, tooltip: 1400 },
    }),
    provideHttpClient(),
    MessageService,
    provideTransloco({
      config: {
        availableLangs: ['en'],
        defaultLang: 'en',
        // Remove this option if your application doesn't support changing language in runtime.
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
}
