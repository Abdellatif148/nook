import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useSessionStore } from '../stores/sessionStore'

export const useRealtime = () => {
  const { cafe } = useAuthStore()
  const { addSession, updateSession, removeSession, setActiveSessions } = useSessionStore()

  useEffect(() => {
    if (!cafe?.id) return

    // Initial fetch
    supabase
      .from('sessions')
      .select('*')
      .eq('cafe_id', cafe.id)
      .eq('status', 'active')
      .then(({ data }) => {
        if (data) setActiveSessions(data)
      })

    const channel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `cafe_id=eq.${cafe.id}`
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload

          if (eventType === 'INSERT') {
            if (newRow.status === 'active') addSession(newRow as any)
          } else if (eventType === 'UPDATE') {
            if (newRow.status === 'active') {
              updateSession(newRow as any)
            } else {
              removeSession(newRow.id)
            }
          } else if (eventType === 'DELETE') {
            removeSession(oldRow.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [cafe?.id])
}
