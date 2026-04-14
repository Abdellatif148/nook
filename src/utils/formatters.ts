import { format, formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

export const formatDH = (amount: number) => {
  return (amount || 0).toFixed(2) + ' DH'
}

export const formatDuration = (minutes: number, lang: 'fr' | 'en' = 'fr') => {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}min`
}

export const formatDate = (date: string | Date, lang: 'fr' | 'en' = 'fr') => {
  return format(new Date(date), 'EEE dd MMM', { locale: lang === 'fr' ? fr : enUS })
}

export const formatFullDate = (date: string | Date, lang: 'fr' | 'en' = 'fr') => {
  return format(new Date(date), 'EEEE dd MMMM yyyy', { locale: lang === 'fr' ? fr : enUS })
}

export const formatTime = (date: string | Date) => {
  return format(new Date(date), 'HH:mm')
}

export const formatRelative = (date: string | Date, lang: 'fr' | 'en' = 'fr') => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: lang === 'fr' ? fr : enUS
  })
}
