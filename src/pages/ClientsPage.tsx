import * as React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Wallet, User, Phone, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { BottomSheet } from '../components/ui/BottomSheet'
import type { ClientAccount } from '../types'
import { cn } from '../utils/cn'

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafe } = useAuthStore()
  const { addToast } = useUIStore()

  const [clients, setClients] = React.useState<ClientAccount[]>([])
  const [search, setSearch] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | 'positive' | 'low'>('all')
  const [isLoading, setIsLoading] = React.useState(true)
  const [showAddSheet, setShowAddSheet] = React.useState(false)

  const [newName, setNewName] = React.useState('')
  const [newPhone, setNewPhone] = React.useState('')
  const [initialBalance, setInitialBalance] = React.useState('0')
  const [newNotes, setNewNotes] = React.useState('')

  const fetchClients = async () => {
    if (!cafe?.id) return
    setIsLoading(true)
    const { data } = await supabase.from('client_accounts').select('*').eq('cafe_id', cafe.id).order('updated_at', { ascending: false })
    setClients(data as ClientAccount[] || [])
    setIsLoading(false)
  }

  React.useEffect(() => { fetchClients() }, [cafe?.id])

  const handleAddClient = async () => {
    if (!cafe?.id || !newName) return
    setIsLoading(true)
    try {
      const { error } = await supabase.from('client_accounts').insert({
        cafe_id: cafe.id,
        name: newName,
        phone: newPhone,
        balance: parseFloat(initialBalance) || 0,
        notes: newNotes
      } as any)
      if (error) throw error
      addToast({ type: 'success', message: 'Client ajouté' })
      setShowAddSheet(false)
      fetchClients()
      setNewName(''); setNewPhone(''); setInitialBalance('0'); setNewNotes('')
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
    if (filter === 'positive') return matchesSearch && c.balance > 0
    if (filter === 'low') return matchesSearch && c.balance < 20
    return matchesSearch
  })

  return (
    <div className="pt-20 pb-24 px-4 space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-text">Clients</h1>
        <Input placeholder="Rechercher..." icon={<Search className="w-4 h-4" />} value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2">
          {['all', 'positive', 'low'].map((f: any) => (
            <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? 'Tous' : f === 'positive' ? 'Solde +' : 'Solde -'}</FilterChip>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : filteredClients.map((client) => (
          <motion.div layout key={client.id} onClick={() => navigate(`/clients/${client.id}`)} className="bg-surface border border-border rounded-card p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4"><Avatar name={client.name} size="md" /><div><h3 className="text-sm font-bold text-text">{client.name}</h3><p className="text-[10px] text-text3 font-medium uppercase">{client.phone || 'Pas de numéro'}</p></div></div>
            <div className="text-right flex items-center gap-3">
              <div className="space-y-1"><p className={cn("text-sm font-mono font-black", client.balance > 50 ? "text-success" : client.balance < 20 ? "text-error" : "text-warning")}>{client.balance.toFixed(2)} DH</p><p className="text-[9px] text-text3 font-black uppercase tracking-widest leading-none">Solde</p></div>
              <ChevronRight className="w-4 h-4 text-text3" />
            </div>
          </motion.div>
        ))}
      </div>

      <button onClick={() => setShowAddSheet(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-[#f97316] to-[#ea6b0a] text-white rounded-full shadow-lg flex items-center justify-center z-[110]"><UserPlus className="w-6 h-6" /></button>

      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title="Nouveau client">
        <div className="space-y-4 pt-2">
          <Input label="Nom" icon={<User className="w-4 h-4" />} value={newName} onChange={e => setNewName(e.target.value)} />
          <Input label="Téléphone" type="tel" icon={<Phone className="w-4 h-4" />} value={newPhone} onChange={e => setNewPhone(e.target.value)} />
          <Input label="Solde (DH)" type="number" icon={<Wallet className="w-4 h-4" />} value={initialBalance} onChange={e => setInitialBalance(e.target.value)} />
          <Button onClick={handleAddClient} className="w-full h-14" isLoading={isLoading}>Créer</Button>
        </div>
      </BottomSheet>
    </div>
  )
}

const FilterChip = ({ children, active, onClick }: any) => (
  <button onClick={onClick} className={cn("px-4 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0", active ? "bg-accent text-white border-accent" : "bg-surface border-border text-text3 hover:border-text3")}>{children}</button>
)
