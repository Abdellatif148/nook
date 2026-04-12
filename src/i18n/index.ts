import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translations } from './translations'

type Language = 'fr' | 'en'

interface TranslationStore {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

export const useTranslationStore = create<TranslationStore>()(
  persist(
    (set, get) => ({
      language: (localStorage.getItem('nook_lang') as Language) || 'fr',
      setLanguage: (language) => {
        localStorage.setItem('nook_lang', language)
        set({ language })
      },
      t: (key: string) => {
        const keys = key.split('.')
        let current: any = translations[get().language]

        for (const k of keys) {
          if (current[k] === undefined) {
            // Fallback to French
            current = translations['fr']
            for (const fk of keys) {
              if (current[fk] === undefined) return key
              current = current[fk]
            }
            return current
          }
          current = current[k]
        }
        return current
      }
    }),
    {
      name: 'nook_lang_store'
    }
  )
)

export const useTranslation = () => {
  const { t, language, setLanguage } = useTranslationStore()
  return { t, language, setLanguage }
}
