import Dexie, { Table } from 'dexie'

export interface PendingAction {
  id?: number
  type: 'START_SESSION' | 'END_SESSION' | 'ADD_EXTRA'
  payload: any
  timestamp: number
}

export class NookDatabase extends Dexie {
  pendingActions!: Table<PendingAction>

  constructor() {
    super('NookDB')
    this.version(1).stores({
      pendingActions: '++id, type, timestamp'
    })
  }
}

export const db = new NookDatabase()
