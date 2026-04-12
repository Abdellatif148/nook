// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Store, ShoppingBag, Users, Key, Globe, LogOut, ChevronDown, Copy, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useTranslation } from '../i18n'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { BottomSheet } from '../components/ui/BottomSheet'
import type { Product } from '../types'
import { cn } from '../utils/cn'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafe, type, logout, setCafe } = useAuthStore()
  const { addToast } = useUIStore()
  const { language, setLanguage } = useTranslation()

  const [activeSection, setActiveSection] = React.useState<string | null>(null)
  const [products, setProducts] = React.useState<Product[]>([])
  const [showProductSheet, setShowProductSheet] = React.useState(false)

  const [cafeName, setCafeName] = React.useState(cafe?.name || '')
  const [cafeAddress, setCafeAddress] = React.useState(cafe?.address || '')

  const [pName, setPName] = React.useState('')
  const [pPrice, setPPrice] = React.useState('')
  const [pCategory, setPCategory] = React.useState<'boisson' | 'nourriture' | 'autre'>('autre')

  React.useEffect(() => { if (type === 'staff') navigate('/dashboard') }, [type])

  const fetchProducts = async () => {
    if (!cafe?.id) return
    const { data } = await supabase.from('products').select('*').eq('cafe_id', cafe.id)
    setProducts(data as Product[] || [])
  }

  React.useEffect(() => { fetchProducts() }, [cafe?.id])

  const handleUpdateCafe = async () => {
    if (!cafe) return
    const { data, error } = await supabase.from('cafes').update({ name: cafeName, address: cafeAddress } as any).eq('id', cafe.id).select().single()
    if (!error) { setCafe(data as any); addToast({ type: 'success', message: 'Mis à jour' }) }
  }

  const handleAddProduct = async () => {
    if (!cafe || !pName || !pPrice) return
    const { error } = await supabase.from('products').insert({ cafe_id: cafe.id, name: pName, price: parseFloat(pPrice), category: pCategory } as any)
    if (!error) { addToast({ type: 'success', message: 'Ajouté' }); setShowProductSheet(false); fetchProducts(); setPName(''); setPPrice('') }
  }

  const handleDeleteProduct = async (id: string) => { if (await supabase.from('products').delete().eq('id', id)) fetchProducts() }

  return (
    <div className="pt-20 pb-24 px-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-text mb-6">Réglages</h1>
      <AccordionItem icon={<Store className="w-5 h-5" />} title="Mon café" isOpen={activeSection === 'cafe'} onClick={() => setActiveSection(activeSection === 'cafe' ? null : 'cafe')}>
        <div className="space-y-4 pt-2"><Input label="Nom" value={cafeName} onChange={e => setCafeName(e.target.value)} /><Input label="Adresse" value={cafeAddress} onChange={e => setCafeAddress(e.target.value)} /><Button onClick={handleUpdateCafe} className="w-full">Enregistrer</Button></div>
      </AccordionItem>
      <AccordionItem icon={<ShoppingBag className="w-5 h-5" />} title="Produits" isOpen={activeSection === 'products'} onClick={() => setActiveSection(activeSection === 'products' ? null : 'products')}>
        <div className="space-y-4 pt-2">
          {products.map(p => (<div key={p.id} className="p-3 bg-surface2 border border-border rounded-btn flex items-center justify-between"><div><p className="text-sm font-bold">{p.name}</p><p className="text-[10px] text-text3">{p.price.toFixed(2)} DH</p></div><button onClick={() => handleDeleteProduct(p.id)} className="text-text3 hover:text-error p-2"><Trash2 className="w-4 h-4" /></button></div>))}
          <Button variant="ghost" className="w-full h-12 border-dashed" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowProductSheet(true)}>Ajouter</Button>
        </div>
      </AccordionItem>
      <AccordionItem icon={<Users className="w-5 h-5" />} title="Mon équipe" onClick={() => navigate('/settings/staff')} />
      <AccordionItem icon={<Key className="w-5 h-5" />} title="Invitation" isOpen={activeSection === 'code'} onClick={() => setActiveSection(activeSection === 'code' ? null : 'code')}>
        <div className="space-y-4 pt-4 text-center"><div className="p-4 bg-surface2 border border-border rounded-card font-mono font-bold tracking-widest text-accent text-xl">{cafe?.invite_code}</div><Button variant="ghost" className="w-full" leftIcon={<Copy className="w-4 h-4" />} onClick={() => { navigator.clipboard.writeText(cafe?.invite_code || ''); addToast({ type: 'success', message: 'Copié' }) }}>Copier</Button></div>
      </AccordionItem>
      <AccordionItem icon={<Globe className="w-5 h-5" />} title="Langue" isOpen={activeSection === 'lang'} onClick={() => setActiveSection(activeSection === 'lang' ? null : 'lang')}>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={() => setLanguage('fr')} className={cn("p-4 border rounded-card transition-all", language === 'fr' ? "bg-accent-glow border-accent text-accent2" : "bg-surface border-border text-text3")}>Français</button>
          <button onClick={() => setLanguage('en')} className={cn("p-4 border rounded-card transition-all", language === 'en' ? "bg-accent-glow border-accent text-accent2" : "bg-surface border-border text-text3")}>English</button>
        </div>
      </AccordionItem>
      <button onClick={async () => { await supabase.auth.signOut(); logout(); navigate('/login') }} className="w-full p-4 flex items-center gap-3 text-error bg-error-dim border border-error/20 rounded-card font-bold text-sm mt-8 active:scale-95 transition-transform"><LogOut className="w-5 h-5" />Déconnexion</button>
      <BottomSheet isOpen={showProductSheet} onClose={() => setShowProductSheet(false)} title="Nouveau produit">
        <div className="space-y-4 pt-2"><Input label="Nom" value={pName} onChange={e => setPName(e.target.value)} /><Input label="Prix" type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} /><div className="flex gap-2">{['boisson', 'nourriture', 'autre'].map(c => (<button key={c} onClick={() => setPCategory(c as any)} className={cn("flex-1 py-2 rounded-btn border text-[10px] font-bold uppercase", pCategory === c ? "bg-accent text-white border-accent" : "bg-surface2 border-border text-text3")}>{c}</button>))}</div><Button onClick={handleAddProduct} className="w-full h-14">Ajouter</Button></div>
      </BottomSheet>
    </div>
  )
}

const AccordionItem = ({ icon, title, children, isOpen, onClick }: any) => (
  <div className="bg-surface border border-border rounded-card overflow-hidden">
    <button onClick={onClick} className="w-full p-4 flex items-center justify-between hover:bg-white/5">
      <div className="flex items-center gap-3 text-text"><div className="text-text2">{icon}</div><span className="text-sm font-bold">{title}</span></div>
      {children && <ChevronDown className={cn("w-4 h-4 text-text3 transition-transform", isOpen && "rotate-180")} />}
    </button>
    <AnimatePresence>{isOpen && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><div className="p-4 pt-0 border-t border-border/30">{children}</div></motion.div>}</AnimatePresence>
  </div>
)
