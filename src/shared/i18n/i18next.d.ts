import type { AppResources } from './locales/en'

// Typed translation keys: `t('deck.addCard')` is checked + autocompleted.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: AppResources }
  }
}
