import { create } from 'zustand'
import { translations } from './translations'

type Language = 'fr' | 'en'

interface TranslationState {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useTranslationStore = create<TranslationState>((set) => ({
  language: (localStorage.getItem('nook_lang') as Language) || 'fr',
  setLanguage: (language) => {
    localStorage.setItem('nook_lang', language)
    set({ language })
  }
}))

export const useTranslation = () => {
  const { language } = useTranslationStore()

  const t = (key: string) => {
    const keys = key.split('.')
    let current: any = translations[language] || translations['fr']

    for (const k of keys) {
      if (current[k] === undefined) {
        // Fallback to French if key missing in current language
        let fallback: any = translations['fr']
        for (const fk of keys) {
          if (fallback[fk] === undefined) return key
          fallback = fallback[fk]
        }
        return fallback
      }
      current = current[k]
    }

    return current
  }

  return { t, language }
}
