import * as React from 'react'
import type { Session, Cafe } from '../types'

export function useCurrentBill(session: Session, cafe: Cafe | null) {
  const [bill, setBill] = React.useState({
    timeCost: 0,
    extrasTotal: session.extras_total || 0,
    totalAmount: (session.time_cost || 0) + (session.extras_total || 0)
  })

  const calculate = React.useCallback(() => {
    if (session.status !== 'active') {
      setBill({
        timeCost: session.time_cost || 0,
        extrasTotal: session.extras_total || 0,
        totalAmount: session.total_amount || 0
      })
      return
    }

    const start = new Date(session.started_at).getTime()
    const now = Date.now()
    const totalMinutes = Math.max(0, Math.floor((now - start) / 60000))

    let billedMinutes = totalMinutes
    if (cafe) {
      if (cafe.billing_increment === '15min') {
        billedMinutes = Math.ceil(totalMinutes / 15) * 15
      } else if (cafe.billing_increment === '30min') {
        billedMinutes = Math.ceil(totalMinutes / 30) * 30
      } else if (cafe.billing_increment === 'hour') {
        billedMinutes = Math.ceil(totalMinutes / 60) * 60
      }
    }

    const timeCost = (billedMinutes / 60) * session.rate_per_hour
    // Parse extras if they are Json
    let extrasTotal = 0
    if (session.extras && Array.isArray(session.extras)) {
      extrasTotal = (session.extras as any[]).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
    }

    setBill({
      timeCost,
      extrasTotal,
      totalAmount: timeCost + extrasTotal
    })
  }, [session.started_at, session.rate_per_hour, session.extras, session.status, session.time_cost, session.extras_total, session.total_amount, cafe])

  React.useEffect(() => {
    calculate()
    const interval = setInterval(calculate, 60000)
    return () => clearInterval(interval)
  }, [calculate])

  return bill
}
