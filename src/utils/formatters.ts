import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDH = (amount: number) => {
  return amount.toFixed(2) + ' DH';
};

export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
};

export const formatDate = (date: string | Date) => {
  return format(new Date(date), 'EEE dd MMM', { locale: fr });
};

export const formatFullDate = (date: string | Date) => {
  return format(new Date(date), 'EEEE dd Avril yyyy', { locale: fr });
};

export const formatTime = (date: string | Date) => {
  return format(new Date(date), 'HH:mm');
};
