import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, UserPlus, User, Timer, BarChart2, Users, Settings as SettingsIcon, Trash2, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { BottomSheet } from '../components/ui/BottomSheet'
import { hashPin } from '../lib/crypto'
import type { Staff } from '../types'
import { cn } from '../utils/cn'

export const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafe } = useAuthStore()
  const { addToast } = useUIStore()

  const [staffList, setStaffList] = React.useState<Staff[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [showAddSheet, setShowAddSheet] = React.useState(false)

  const [name, setName] = React.useState('')
  const [pin, setPin] = React.useState('')
  const [perms, setPerms] = React.useState({ sessions: true, reports: false, clients: false, settings: false })

  const fetchStaff = async () => {
    if (!cafe?.id) return
    setIsLoading(true)
    const { data } = await supabase.from('staff').select('*').eq('cafe_id', cafe.id).order('created_at')
    setStaffList(data as Staff[] || [])
    setIsLoading(false)
  }

  React.useEffect(() => {
    fetchStaff()
  }, [cafe?.id])

  const handleAddStaff = async () => {
    if (!cafe || !name || pin.length !== 4) return
    setIsLoading(true)
    try {
      const pinHash = await hashPin(pin)
      const { error } = await supabase.from('staff').insert({
        cafe_id: cafe.id,
        name,
        pin_hash: pinHash,
        permissions: perms
      } as any)
      if (error) throw error
      addToast({ type: 'success', message: 'Employé ajouté' })
      setShowAddSheet(false)
      setName(''); setPin(''); setPerms({ sessions: true, reports: false, clients: false, settings: false })
      fetchStaff()
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Supprimer cet employé ?')) return
    const { error } = await supabase.from('staff').delete().eq('id', id)
    if (!error) fetchStaff()
  }

  return (
    <div className="min-h-screen bg-bg pt-14 pb-24">
      <div className="fixed top-0 left-0 right-0 h-14 bg-bg border-b border-border z-[110] px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text3 hover:text-text"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-sm font-bold text-text uppercase tracking-widest">Mon équipe</h1>
        <div className="w-8" />
      </div>

      <div className="p-6 space-y-4 max-w-xl mx-auto">
        {staffList.map(s => (
          <div key={s.id} className="bg-surface border border-border rounded-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={s.name} size="md" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-text">{s.name}</p>
                <div className="flex gap-1.5">
                  <PermissionIcon active={(s.permissions as any).sessions} icon={<Timer className="w-3 h-3" />} />
                  <PermissionIcon active={(s.permissions as any).reports} icon={<BarChart2 className="w-3 h-3" />} />
                  <PermissionIcon active={(s.permissions as any).clients} icon={<Users className="w-3 h-3" />} />
                  <PermissionIcon active={(s.permissions as any).settings} icon={<SettingsIcon className="w-3 h-3" />} />
                </div>
              </div>
            </div>
            <button onClick={() => handleDeleteStaff(s.id)} className="p-3 text-text3 hover:text-error transition-colors"><Trash2 className="w-5 h-5" /></button>
          </div>
        ))}
        <Button className="w-full h-14" leftIcon={<UserPlus className="w-5 h-5" />} onClick={() => setShowAddSheet(true)}>Ajouter un employé</Button>
      </div>

      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title="Nouvel employé">
        <div className="space-y-6 pt-2">
          <Input label="Nom" icon={<User className="w-4 h-4" />} value={name} onChange={e => setName(e.target.value)} />
          <Input label="Code PIN" type="password" maxLength={4} icon={<Lock className="w-4 h-4" />} value={pin} onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))} />
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-text3 uppercase tracking-widest pl-1">Droits d'accès</label>
            <div className="space-y-2">
              <PermissionToggle label="Gérer les sessions" active={perms.sessions} disabled />
              <PermissionToggle label="Voir les rapports" active={perms.reports} onClick={() => setPerms({...perms, reports: !perms.reports})} />
              <PermissionToggle label="Gérer les clients" active={perms.clients} onClick={() => setPerms({...perms, clients: !perms.clients})} />
              <PermissionToggle label="Paramètres" active={perms.settings} onClick={() => setPerms({...perms, settings: !perms.settings})} />
            </div>
          </div>
          <Button onClick={handleAddStaff} className="w-full h-14" isLoading={isLoading}>Créer</Button>
        </div>
      </BottomSheet>
    </div>
  )
}

const PermissionIcon = ({ active, icon }: any) => (
  <div className={cn("p-1 rounded bg-surface2 border border-border", active ? "text-accent2 border-accent-border" : "text-text3 opacity-30")}>{icon}</div>
)

const PermissionToggle = ({ label, active, onClick, disabled }: any) => (
  <button onClick={onClick} disabled={disabled} className={cn("w-full p-4 flex items-center justify-between border rounded-card transition-all", active ? "bg-accent-glow border-accent-border" : "bg-surface border-border", disabled && "opacity-50 cursor-not-allowed")}>
    <span className={cn("text-sm font-bold", active ? "text-text" : "text-text3")}>{label}</span>
    <div className={cn("w-10 h-6 rounded-full relative transition-colors", active ? "bg-accent" : "bg-border")}><motion.div animate={{ x: active ? 18 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" /></div>
  </button>
)
