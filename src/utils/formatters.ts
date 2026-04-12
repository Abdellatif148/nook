export const formatDH = (amount: number) => {
  return `${amount.toFixed(2)} DH`
}

export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}min`
}

export const formatTime = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
