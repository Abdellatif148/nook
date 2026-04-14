// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, Phone, Wallet, FileText, Loader2, MessageCircle, TrendingUp, Calendar, BarChart, MoreVertical, CreditCard, PlusCircle, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { formatDH, formatDate } from '../utils/formatters'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Input } from '../components/ui/Input'
import type { ClientAccount } from '../types'

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafe } = useAuthStore()
  const { addToast } = useUIStore()
  const [clients, setClients] = React.useState<ClientAccount[]>([])
  const [search, setSearch] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | 'positive' | 'low'>('all')
  const [isNewClientOpen, setIsNewClientOpen] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(true)

  // New Client Form
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [balance, setBalance] = React.useState(0)
  const [notes, setNotes] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)

  const fetchClients = async () => {
    if (!cafe) return
    setIsRefreshing(true)
    const { data } = await supabase
      .from('client_accounts')
      .select('*')
      .eq('cafe_id', cafe.id)
      .order('updated_at', { ascending: false })

    if (data) setClients(data as ClientAccount[])
    setIsRefreshing(false)
  }

  React.useEffect(() => {
    fetchClients()
  }, [cafe])

  const handleCreate = async () => {
    if (!cafe || !name) return
    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('client_accounts')
        .insert({
          cafe_id: cafe.id,
          name: name.trim(),
          phone: phone.trim() || null,
          balance: balance,
          notes: notes.trim() || null,
          total_visits: 0,
          total_spent: 0
        })
        .select()
        .single()

      if (error) throw error

      addToast({ type: 'success', message: 'Client créé' })
      setClients([data as ClientAccount, ...clients])
      setIsNewClientOpen(false)
      setName(''); setPhone(''); setBalance(0); setNotes('');
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const filtered = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search))
    if (!matchesSearch) return false
    if (filter === 'positive') return c.balance > 0
    if (filter === 'low') return c.balance < 20
    return true
  })

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border p-4">
        <h1 className="text-[18px] font-bold text-text mb-4">Clients</h1>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
          <input
            className="w-full bg-black/25 border border-border rounded-lg h-11 pl-10 pr-4 text-sm text-text focus:border-accent outline-none"
            placeholder="Chercher un client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
           {[
             { id: 'all', label: 'Tous' },
             { id: 'positive', label: 'Solde positif' },
             { id: 'low', label: 'Faible solde' }
           ].map(opt => (
             <button
               key={opt.id}
               onClick={() => setFilter(opt.id as any)}
               className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold border transition-all ${
                 filter === opt.id ? 'bg-accent border-accent text-white' : 'bg-surface2 border-border text-text3'
               }`}
             >
               {opt.label}
             </button>
           ))}
        </div>
      </header>

      <main className="p-4 space-y-3">
        {filtered.map(client => (
          <motion.div
            layout
            key={client.id}
            onClick={() => navigate(`/clients/${client.id}`)}
            className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 active:bg-white/5 transition-all cursor-pointer shadow-sm"
          >
            <Avatar name={client.name} size="md" />
            <div className="flex-1 min-w-0">
               <p className="text-[14px] font-bold text-text truncate">{client.name}</p>
               <p className="text-[11px] text-text3">Dernière visite: {client.updated_at ? formatDate(client.updated_at) : '-'}</p>
            </div>
            <div className="text-right">
               <p className={`text-[14px] font-mono font-black ${
                 client.balance < 10 ? 'text-error' : client.balance < 50 ? 'text-warning' : 'text-success'
               }`}>
                 {formatDH(client.balance)}
               </p>
               <p className="text-[10px] font-bold text-text3 uppercase tracking-wider">solde</p>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !isRefreshing && (
          <div className="py-20 text-center space-y-4">
             <div className="w-12 h-12 rounded-full bg-surface2 mx-auto flex items-center justify-center text-text3"><Wallet className="w-6 h-6" /></div>
             <p className="text-text3 font-medium">Aucun client trouvé</p>
          </div>
        )}
      </main>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsNewClientOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-accent to-[#ea6b0a] rounded-full flex items-center justify-center text-white shadow-2xl shadow-accent/40 z-40 border border-white/10"
      >
        <UserPlus className="w-6 h-6" />
      </motion.button>

      <BottomSheet isOpen={isNewClientOpen} onClose={() => setIsNewClientOpen(false)} title="Nouveau compte client">
        <div className="space-y-6 pb-4">
           <Input label="Nom" placeholder="Ahmed Alaoui" icon={<UserPlus className="w-4 h-4" />} value={name} onChange={e => setName(e.target.value)} />
           <Input label="Téléphone" placeholder="+212 6XX XXX XXX" icon={<Phone className="w-4 h-4" />} value={phone} onChange={e => setPhone(e.target.value)} />

           <div className="space-y-2">
             <label className="text-[11px] font-bold text-text3 uppercase px-1">Solde initial en DH</label>
             <div className="relative">
               <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
               <input
                 type="number"
                 className="w-full bg-black/25 border border-border rounded-lg h-11 pl-10 pr-4 text-sm text-text font-mono focus:border-accent outline-none"
                 placeholder="0.00"
                 value={balance || ''}
                 onChange={e => setBalance(parseFloat(e.target.value) || 0)}
               />
             </div>
             <p className="text-[11px] text-text3 px-1">Crédit de bienvenue (optionnel)</p>
           </div>

           <div className="space-y-2">
             <label className="text-[11px] font-bold text-text3 uppercase px-1">Notes</label>
             <div className="relative">
               <FileText className="absolute left-3.5 top-3 w-4 h-4 text-text3" />
               <textarea
                 rows={3}
                 className="w-full bg-black/25 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text focus:border-accent outline-none transition-all placeholder:text-text3"
                 placeholder="Préférences, allergies, etc..."
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
               />
             </div>
           </div>

           <Button onClick={handleCreate} className="w-full h-12" isLoading={isSaving} disabled={!name}>Créer le compte</Button>
        </div>
      </BottomSheet>
    </div>
  )
}
