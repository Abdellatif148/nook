// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, DollarSign, Bell, ShoppingBag, Users, Key, Globe, User, LogOut, ChevronDown, Plus, Trash2, Edit2, Check, Loader2, Copy, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useTranslation, useTranslationStore } from '../i18n'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Toggle } from '../components/ui/Toggle'
import { BottomSheet } from '../components/ui/BottomSheet'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import type { Product } from '../types'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafe, owner, type, logout, setCafe } = useAuthStore()
  const { t } = useTranslation()
  const { setLanguage, language } = useTranslationStore()
  const { addToast } = useUIStore()

  const [openSection, setOpenSection] = React.useState<string | null>('cafe')
  const [isSaving, setIsSaving] = React.useState(false)

  // Section: Mon Café
  const [cafeName, setCafeName] = React.useState(cafe?.name || '')
  const [address, setAddress] = React.useState(cafe?.address || '')
  const [city, setCity] = React.useState(cafe?.city || '')
  const [phone, setPhone] = React.useState(cafe?.phone || '')

  // Section: Tarifs
  const [standardRate, setStandardRate] = React.useState(cafe?.default_rate || 2)
  const [premiumRate, setPremiumRate] = React.useState(cafe?.premium_rate || 3)
  const [increment, setIncrement] = React.useState(cafe?.billing_increment || 'minute')

  // Section: Produits
  const [products, setProducts] = React.useState<Product[]>([])
  const [isAddProductOpen, setIsAddProductOpen] = React.useState(false)
  const [newProd, setNewProd] = React.useState({ name: '', price: 0, category: 'boisson' })

  // Section: Alerts
  const [longSessionHours, setLongSessionHours] = React.useState(cafe?.long_session_alert_hours || 3)
  const [lowBalance, setLowBalance] = React.useState(cafe?.low_balance_alert || 20)

  // Redirect staff
  React.useEffect(() => {
    if (type === 'staff') {
       addToast({ type: 'warning', message: 'Accès refusé' })
       navigate('/dashboard')
    }
  }, [type])

  const fetchProducts = async () => {
    if (!cafe) return
    const { data } = await supabase.from('products').select('*').eq('cafe_id', cafe.id).order('sort_order')
    if (data) setProducts(data as Product[])
  }

  React.useEffect(() => {
    fetchProducts()
  }, [cafe])

  const handleUpdateCafe = async () => {
    if (!cafe) return
    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('cafes')
        .update({
          name: cafeName,
          address,
          city,
          phone,
          default_rate: standardRate,
          premium_rate: premiumRate,
          billing_increment: increment,
          long_session_alert_hours: longSessionHours,
          low_balance_alert: lowBalance,
          language: language
        })
        .eq('id', cafe.id)
        .select()
        .single()

      if (error) throw error
      setCafe(data as any)
      addToast({ type: 'success', message: 'Paramètres mis à jour' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddProduct = async () => {
    if (!cafe || !newProd.name) return
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          cafe_id: cafe.id,
          name: newProd.name,
          price: newProd.price,
          category: newProd.category,
          active: true,
          sort_order: products.length
        })
        .select()
        .single()

      if (error) throw error
      setProducts([...products, data as Product])
      setIsAddProductOpen(false)
      setNewProd({ name: '', price: 0, category: 'boisson' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
  }

  const toggleSection = (id: string) => setOpenSection(openSection === id ? null : id)

  const Section: React.FC<{ id: string, icon: any, title: string, children: React.ReactNode }> = ({ id, icon: Icon, title, children }) => (
    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
       <button
        onClick={() => toggleSection(id)}
        className={`w-full flex items-center justify-between p-4 transition-all ${openSection === id ? 'bg-surface2/40' : 'bg-surface hover:bg-surface2/20'}`}
       >
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${openSection === id ? 'bg-accent text-white' : 'bg-surface2 text-text3'}`}>
                <Icon className="w-4 h-4" />
             </div>
             <span className={`text-sm font-bold ${openSection === id ? 'text-text' : 'text-text2'}`}>{title}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-text3 transition-transform ${openSection === id ? 'rotate-180' : ''}`} />
       </button>
       <AnimatePresence>
          {openSection === id && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-surface overflow-hidden border-t border-border/50">
               <div className="p-5 space-y-6">
                  {children}
               </div>
            </motion.div>
          )}
       </AnimatePresence>
    </div>
  )

  return (
    <div className="min-h-screen pb-32">
       <header className="sticky top-0 z-50 h-[56px] bg-bg/90 backdrop-blur-md border-b border-border px-4 flex items-center justify-between">
          <h1 className="text-[18px] font-bold text-text">Réglages</h1>
          <Button variant="success" className="h-9 min-h-0 text-[11px] font-black" onClick={handleUpdateCafe} isLoading={isSaving}>
             {t('common.save')}
          </Button>
       </header>

       <main className="p-4 space-y-4">
          <Section id="cafe" icon={Store} title="Mon Café">
             <div className="space-y-4">
                <Input label="Nom du café" value={cafeName} onChange={e => setCafeName(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Ville" value={city} onChange={e => setCity(e.target.value)} />
                   <Input label="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <Input label="Adresse complète" value={address} onChange={e => setAddress(e.target.value)} />
             </div>
          </Section>

          <Section id="rates" icon={DollarSign} title="Tarifs">
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Standard (DH/h)" type="number" step="0.5" value={standardRate} onChange={e => setStandardRate(parseFloat(e.target.value))} />
                   <Input label="Premium (DH/h)" type="number" step="0.5" value={premiumRate} onChange={e => setPremiumRate(parseFloat(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-text3 uppercase tracking-wider pl-1">Incrément de facturation</label>
                  <select className="w-full bg-black/25 border border-border rounded-lg h-11 px-3.5 text-text text-sm" value={increment} onChange={e => setIncrement(e.target.value)}>
                    <option value="minute">À la minute</option>
                    <option value="15min">15 minutes</option>
                    <option value="30min">30 minutes</option>
                    <option value="hour">À l'heure</option>
                  </select>
                </div>
             </div>
          </Section>

          <Section id="alerts" icon={Bell} title="Alertes">
             <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                   <div className="space-y-0.5">
                      <p className="text-[13px] font-bold text-text">Session longue</p>
                      <p className="text-[11px] text-text3 text-left">Alerte après {longSessionHours} heures</p>
                   </div>
                   <input type="number" className="w-14 bg-surface2 border border-border rounded p-1 text-center font-mono text-sm" value={longSessionHours} onChange={e => setLongSessionHours(parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex items-center justify-between py-2">
                   <div className="space-y-0.5">
                      <p className="text-[13px] font-bold text-text">Solde faible</p>
                      <p className="text-[11px] text-text3 text-left">Alerte sous {lowBalance} DH</p>
                   </div>
                   <input type="number" className="w-14 bg-surface2 border border-border rounded p-1 text-center font-mono text-sm" value={lowBalance} onChange={e => setLowBalance(parseInt(e.target.value) || 0)} />
                </div>
             </div>
          </Section>

          <Section id="products" icon={ShoppingBag} title="Produits">
             <div className="space-y-4">
                <div className="bg-surface2/30 rounded-xl overflow-hidden divide-y divide-border/50">
                   {products.map(p => (
                     <div key={p.id} className="p-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                           <p className="text-[13px] font-bold text-text">{p.name}</p>
                           <p className="text-[10px] text-text3 uppercase">{p.category}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-[13px] font-mono font-bold text-accent2">{p.price.toFixed(2)} DH</span>
                           <button className="text-text3 hover:text-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                   ))}
                   {products.length === 0 && (
                     <p className="p-8 text-center text-text3 text-[13px]">Aucun produit</p>
                   )}
                </div>
                <Button variant="ghost" className="w-full h-11 border-dashed" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddProductOpen(true)}>
                   Ajouter un produit
                </Button>
             </div>
          </Section>

          <Section id="team" icon={Users} title="Équipe">
             <div className="space-y-4">
                <p className="text-[13px] text-text3">Gérez vos employés, leurs accès et leurs codes PIN.</p>
                <Button onClick={() => navigate('/settings/staff')} className="w-full h-11" variant="ghost">Gérer mon équipe</Button>
             </div>
          </Section>

          <Section id="invite" icon={Key} title="Code d'invitation">
             <div className="space-y-6 text-center">
                <p className="text-[12px] text-text2">Partagez ce code avec votre équipe</p>
                <div className="text-[32px] font-mono font-black text-text tracking-[0.3em] bg-surface2/50 border border-border rounded-xl py-5">
                   {cafe?.invite_code}
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(cafe?.invite_code || ''); addToast({type: 'success', message: 'Code copié'}) }} icon={<Copy className="w-4 h-4" />}>Copier</Button>
                   <Button variant="danger" icon={<RefreshCw className="w-4 h-4" />}>Régénérer</Button>
                </div>
             </div>
          </Section>

          <Section id="lang" icon={Globe} title="Langue / Language">
             <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                    language === 'fr' ? 'bg-accent-glow border-accent text-accent2' : 'bg-surface2/30 border-border text-text3'
                  }`}
                >
                   <span className="text-2xl">FR</span>
                   <span className="text-[13px] font-bold">Français</span>
                   {language === 'fr' && <div className="p-1 bg-accent text-white rounded-full"><Check className="w-2 h-2" /></div>}
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                    language === 'en' ? 'bg-accent-glow border-accent text-accent2' : 'bg-surface2/30 border-border text-text3'
                  }`}
                >
                   <span className="text-2xl">EN</span>
                   <span className="text-[13px] font-bold">English</span>
                   {language === 'en' && <div className="p-1 bg-accent text-white rounded-full"><Check className="w-2 h-2" /></div>}
                </button>
             </div>
          </Section>

          <section className="pt-8">
             <button
              onClick={() => { if(confirm('Voulez-vous vraiment vous déconnecter ?')) { logout(); navigate('/login'); } }}
              className="w-full flex items-center justify-center gap-3 py-4 text-error font-bold text-sm bg-error-dim border border-error/10 rounded-xl"
             >
                <LogOut className="w-5 h-5" />
                Se déconnecter
             </button>
          </section>
       </main>

       <BottomSheet isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} title="Nouveau produit">
          <div className="space-y-6 pb-4">
             <Input label="Nom" placeholder="Café Noir" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} />
             <Input label="Prix (DH)" type="number" step="0.5" value={newProd.price} onChange={e => setNewProd({...newProd, price: parseFloat(e.target.value)})} />
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-text3 uppercase px-1">Catégorie</label>
                <div className="grid grid-cols-3 gap-2">
                   {['boisson', 'nourriture', 'autre'].map(cat => (
                     <button
                        key={cat}
                        onClick={() => setNewProd({...newProd, category: cat})}
                        className={`h-10 rounded-lg border text-[12px] font-bold capitalize transition-all ${
                          newProd.category === cat ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-surface2 border-border text-text3'
                        }`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>
             </div>
             <Button onClick={handleAddProduct} className="w-full h-12" disabled={!newProd.name}>Ajouter le produit</Button>
          </div>
       </BottomSheet>
    </div>
  )
}
