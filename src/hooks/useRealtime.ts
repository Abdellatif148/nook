// @ts-nocheck
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useSessionStore } from '../stores/sessionStore'
import type { Session } from '../types'

export function useRealtime() {
  const { cafe } = useAuthStore()
  const { addSession, updateSession, removeSession, setActiveSessions } = useSessionStore()

  useEffect(() => {
    if (!cafe) return

    // Initial load
    const loadSessions = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('cafe_id', cafe.id)
        .eq('status', 'active')

      if (data) {
        setActiveSessions(data as Session[])
      }
    }

    loadSessions()

    const channel = supabase.channel('sessions-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `cafe_id=eq.${cafe.id}`
      }, (payload) => {
        const session = payload.new as Session

        if (payload.eventType === 'INSERT') {
          if (session.status === 'active') addSession(session)
        } else if (payload.eventType === 'UPDATE') {
          if (session.status === 'active') {
            updateSession(session)
          } else {
            removeSession(session.id)
          }
        } else if (payload.eventType === 'DELETE') {
          removeSession((payload.old as Session).id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [cafe, addSession, updateSession, removeSession, setActiveSessions])
}
