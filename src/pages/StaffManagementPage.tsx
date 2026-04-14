// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Plus, User, Timer, BarChart2, Users, Settings, ChevronRight, CheckCircle2, Shield, Trash2, Key, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { hashPin } from '../lib/crypto'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Toggle } from '../components/ui/Toggle'
import { BottomSheet } from '../components/ui/BottomSheet'
import { PINDots } from '../components/ui/PINDots'
import { NumPad } from '../components/ui/NumPad'
import type { Staff, StaffPermissions } from '../types'

export const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafe } = useAuthStore()
  const { addToast } = useUIStore()
  const [staffList, setStaffList] = React.useState<Staff[]>([])
  const [isRefreshing, setIsRefreshing] = React.useState(true)
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [selectedStaff, setSelectedStaff] = React.useState<Staff | null>(null)

  // Form state
  const [name, setName] = React.useState('')
  const [pin, setPin] = React.useState('')
  const [permissions, setPermissions] = React.useState<StaffPermissions>({
    sessions: true,
    reports: false,
    clients: false,
    settings: false
  })
  const [isSaving, setIsSaving] = React.useState(false)

  const fetchStaff = async () => {
    if (!cafe) return
    setIsRefreshing(true)
    const { data } = await supabase
      .from('staff')
      .select('*')
      .eq('cafe_id', cafe.id)
      .order('created_at', { ascending: false })
    if (data) setStaffList(data as Staff[])
    setIsRefreshing(false)
  }

  React.useEffect(() => {
    fetchStaff()
  }, [cafe])

  const handleAddStaff = async () => {
    if (!cafe || !name || pin.length !== 4) return
    setIsSaving(true)
    try {
      const pinHash = await hashPin(pin)
      const { data, error } = await supabase
        .from('staff')
        .insert({
          cafe_id: cafe.id,
          name,
          pin_hash: pinHash,
          permissions,
          active: true
        })
        .select()
        .single()

      if (error) throw error
      setStaffList([data as Staff, ...staffList])
      setIsAddOpen(false)
      setName(''); setPin(''); setPermissions({ sessions: true, reports: false, clients: false, settings: false });
      addToast({ type: 'success', message: 'Employé ajouté' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (s: Staff) => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .update({ active: !s.active })
        .eq('id', s.id)
        .select()
        .single()
      if (error) throw error
      setStaffList(staffList.map(item => item.id === s.id ? (data as Staff) : item))
      if (selectedStaff?.id === s.id) setSelectedStaff(data as Staff)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 h-[56px] bg-bg/90 backdrop-blur-md border-b border-border px-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text3 hover:text-text transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[16px] font-bold text-text">Mon équipe</h1>
        <div className="flex-1" />
        <button
          onClick={() => setIsAddOpen(true)}
          className="p-2 bg-accent text-white rounded-lg shadow-lg shadow-accent/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <main className="p-4 space-y-4">
        <div className="grid gap-3">
          {staffList.map(s => (
            <div
              key={s.id}
              onClick={() => setSelectedStaff(s)}
              className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between active:bg-surface2/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                 <Avatar name={s.name} size="md" />
                 <div className="space-y-1">
                    <p className="text-[14px] font-bold text-text flex items-center gap-2">
                       {s.name}
                       {!s.active && <span className="px-1.5 py-0.5 bg-surface2 border border-border text-[9px] font-black text-text3 rounded uppercase tracking-wider">Inactif</span>}
                    </p>
                    <div className="flex gap-2">
                       {(s.permissions as any).sessions && <Timer className="w-3 h-3 text-accent" />}
                       {(s.permissions as any).reports && <BarChart2 className="w-3 h-3 text-info" />}
                       {(s.permissions as any).clients && <Users className="w-3 h-3 text-success" />}
                       {(s.permissions as any).settings && <Shield className="w-3 h-3 text-error" />}
                    </div>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text3" />
            </div>
          ))}

          {staffList.length === 0 && !isRefreshing && (
            <div className="py-20 text-center space-y-4">
               <div className="w-12 h-12 rounded-full bg-surface2 mx-auto flex items-center justify-center text-text3"><Users className="w-6 h-6" /></div>
               <p className="text-text3 font-medium">Aucun employé pour le moment</p>
               <Button variant="ghost" onClick={() => setIsAddOpen(true)}>Ajouter mon premier employé</Button>
            </div>
          )}
        </div>
      </main>

      {/* Add Staff Sheet */}
      <BottomSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Nouvel employé">
         <div className="space-y-8 pb-4">
            <Input label="Nom de l'employé" placeholder="Ahmed" icon={<User className="w-4 h-4" />} value={name} onChange={e => setName(e.target.value)} />

            <div className="space-y-4">
               <label className="text-[11px] font-bold text-text3 uppercase tracking-wider block text-center">Code PIN (4 chiffres)</label>
               <PINDots length={pin.length} />
               <NumPad onInput={d => pin.length < 4 && setPin(pin + d)} onDelete={() => setPin(pin.slice(0, -1))} />
            </div>

            <div className="space-y-4">
               <p className="text-[11px] font-bold text-text3 uppercase tracking-wider px-1">Droits d'accès</p>
               <div className="bg-surface2/30 border border-border rounded-xl divide-y divide-border/50">
                  <div className="flex items-center justify-between p-4 opacity-60">
                     <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-text">Gérer les sessions</span>
                        <span className="text-[11px] text-text3">Toujours activé</span>
                     </div>
                     <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div className="p-4"><Toggle enabled={permissions.reports} onChange={v => setPermissions({...permissions, reports: v})} label="Voir les rapports" /></div>
                  <div className="p-4"><Toggle enabled={permissions.clients} onChange={v => setPermissions({...permissions, clients: v})} label="Gérer les clients" /></div>
                  <div className="p-4"><Toggle enabled={permissions.settings} onChange={v => setPermissions({...permissions, settings: v})} label="Accès aux réglages" /></div>
               </div>
            </div>

            <Button onClick={handleAddStaff} className="w-full h-14 font-bold" isLoading={isSaving} disabled={!name || pin.length !== 4}>Créer l'employé</Button>
         </div>
      </BottomSheet>

      {/* Detail Sheet */}
      <BottomSheet isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title="Gérer l'employé">
         {selectedStaff && (
           <div className="space-y-8 pb-4 pt-2">
              <div className="flex items-center gap-4 p-4 bg-surface2/30 rounded-xl border border-border">
                 <Avatar name={selectedStaff.name} size="md" />
                 <div className="flex-1">
                    <p className="font-bold text-text">{selectedStaff.name}</p>
                    <p className="text-[11px] text-text3">Membre depuis {new Date(selectedStaff.created_at).toLocaleDateString()}</p>
                 </div>
                 <Toggle enabled={selectedStaff.active} onChange={() => handleToggleActive(selectedStaff)} />
              </div>

              <div className="space-y-4">
                 <p className="text-[11px] font-bold text-text3 uppercase tracking-wider px-1">Accès autorisés</p>
                 <div className="bg-surface2/30 border border-border rounded-xl divide-y divide-border/50">
                    <div className="p-4"><Toggle enabled={(selectedStaff.permissions as any).reports} onChange={() => {}} label="Voir les rapports" disabled /></div>
                    <div className="p-4"><Toggle enabled={(selectedStaff.permissions as any).clients} onChange={() => {}} label="Gérer les clients" disabled /></div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <Button variant="ghost" className="h-12" icon={<Key className="w-4 h-4" />}>Changer PIN</Button>
                 <Button variant="danger" className="h-12" icon={<Trash2 className="w-4 h-4" />}>Supprimer</Button>
              </div>
           </div>
         )}
      </BottomSheet>
    </div>
  )
}
