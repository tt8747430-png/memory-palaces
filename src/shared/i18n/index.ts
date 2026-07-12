import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'

export const defaultNS = 'translation'

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS,
  interpolation: { escapeValue: false },
  returnNull: false,
})

export { i18n }
