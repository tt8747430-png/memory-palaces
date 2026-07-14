import { provideTaiga } from '@taiga-ui/core'
import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core'
import { provideRouter } from '@angular/router'
import { providePrimeNG } from 'primeng/config'
import Aura from '@primeuix/themes/aura'

import { routes } from './app.routes'
import { provideServiceWorker } from '@angular/service-worker'
import { provideHttpClient } from '@angular/common/http'
import { TranslocoHttpLoader } from './transloco-loader'
import { provideTransloco } from '@jsverse/transloco'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideTaiga(),
    providePrimeNG({
      // Placeholder preset — Phase 2 replaces it with the custom --sw-* token preset (ADR-0001).
      theme: { preset: Aura, options: { darkModeSelector: '[data-theme="dark"]' } },
    }),
    provideHttpClient(),
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
