import type { AppResources } from './locales/en'

// Typed translation keys: `t('home.primaryCta')` is checked + autocompleted.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: AppResources }
  }
}
