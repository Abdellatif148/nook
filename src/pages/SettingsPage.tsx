import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Save, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { saveSettings } from '../db/settings';
import { addToSyncQueue } from '../db/syncQueue';
import { getProducts, saveProduct, deleteProduct } from '../db/products';
import { formatDH } from '../utils/formatters';
import { BottomSheet } from '../components/ui/BottomSheet';
import type { CafeSettings, Product } from '../types';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, settings, logout, updateSettings } = useAuthStore();
  const { addToast } = useUIStore();

  const [formSettings, setFormSettings] = React.useState<CafeSettings | null>(settings);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = React.useState(false);
  const [newProdName, setNewProdName] = React.useState('');
  const [newProdPrice, setNewProdPrice] = React.useState(0);
  const [newProdCat, setNewProdCat] = React.useState<'boisson' | 'nourriture' | 'autre'>('boisson');

  React.useEffect(() => {
    if (user?.cafe_id) {
      fetchProducts(user.cafe_id);
    }
  }, [user]);

  const fetchProducts = async (cafeId: string) => {
    const data = await getProducts(cafeId);
    setProducts(data);
  };

  const handleSaveSettings = async () => {
    if (!formSettings) return;
    try {
      await saveSettings(formSettings);
      await addToSyncQueue({
        id: crypto.randomUUID(),
        type: 'update_settings',
        payload: formSettings,
        retry_count: 0,
        created_at: new Date().toISOString()
      });
      updateSettings(formSettings);
      addToast({ type: 'success', message: 'Paramètres enregistrés' });
    } catch (err) {
      addToast({ type: 'error', message: 'Erreur lors de l\'enregistrement' });
    }
  };

  const handleAddProduct = async () => {
    if (!user || !newProdName) return;

    const prod: Product = {
      id: crypto.randomUUID(),
      cafe_id: user.cafe_id,
      name: newProdName,
      price: newProdPrice,
      category: newProdCat,
      active: true
    };

    try {
      await saveProduct(prod);
      setProducts([...products, prod]);
      addToast({ type: 'success', message: 'Produit ajouté' });
      setIsAddProductOpen(false);
      setNewProdName('');
      setNewProdPrice(0);
    } catch (err) {
      addToast({ type: 'error', message: 'Erreur' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      addToast({ type: 'success', message: 'Produit supprimé' });
    } catch (err) {
      addToast({ type: 'error', message: 'Erreur' });
    }
  };

  return (
    <div className="p-4 space-y-8 pb-24">
      <h1 className="text-[20px] font-bold text-text">Paramètres</h1>

      <section className="space-y-4">
        <h2 className="text-[12px] font-bold text-text2 uppercase tracking-widest">Mon Café</h2>
        <div className="bg-card border border-border rounded-card p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] text-text3 font-bold uppercase">Nom du café</label>
            <input
              value={formSettings?.cafe_name || ''}
              onChange={e => setFormSettings(prev => prev ? {...prev, cafe_name: e.target.value} : null)}
              className="w-full bg-black/20 border border-border rounded-input px-3 py-2 text-text"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] text-text3 font-bold uppercase">Total places</label>
              <input
                type="number"
                value={formSettings?.total_seats || 20}
                onChange={e => setFormSettings(prev => prev ? {...prev, total_seats: parseInt(e.target.value) || 0} : null)}
                className="w-full bg-black/20 border border-border rounded-input px-3 py-2 text-text"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSaveSettings}
                className="w-full h-[40px] bg-accent text-white font-bold rounded-button flex items-center justify-center gap-2 text-[13px]"
              >
                <Save className="w-4 h-4" /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[12px] font-bold text-text2 uppercase tracking-widest">Tarifs par défaut</h2>
        <div className="bg-card border border-border rounded-card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] text-text3 font-bold uppercase">Standard (DH/h)</label>
              <input
                type="number"
                value={formSettings?.default_rate || 2}
                onChange={e => setFormSettings(prev => prev ? {...prev, default_rate: parseFloat(e.target.value) || 0} : null)}
                className="w-full bg-black/20 border border-border rounded-input px-3 py-2 text-text font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-text3 font-bold uppercase">Premium (DH/h)</label>
              <input
                type="number"
                value={formSettings?.premium_rate || 3}
                onChange={e => setFormSettings(prev => prev ? {...prev, premium_rate: parseFloat(e.target.value) || 0} : null)}
                className="w-full bg-black/20 border border-border rounded-input px-3 py-2 text-text font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] text-text3 font-bold uppercase">Incrément de facturation</label>
            <select
              value={formSettings?.billing_increment || 'minute'}
              onChange={e => setFormSettings(prev => prev ? {...prev, billing_increment: e.target.value as any} : null)}
              className="w-full bg-black/20 border border-border rounded-input px-3 py-2 text-text"
            >
              <option value="minute">À la minute</option>
              <option value="15min">15 minutes</option>
              <option value="30min">30 minutes</option>
              <option value="hour">À l'heure</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-bold text-text2 uppercase tracking-widest">Produits</h2>
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="text-[11px] font-bold text-accent2 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>
        <div className="bg-card border border-border rounded-card overflow-hidden">
          {products.map((p, idx) => (
            <div key={p.id} className={`p-4 flex items-center justify-between ${idx !== products.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="space-y-0.5">
                <p className="text-[14px] font-bold text-text">{p.name}</p>
                <p className="text-[11px] text-text3 uppercase">{p.category}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[14px] font-mono font-bold text-accent2">{formatDH(p.price)}</span>
                <button onClick={() => handleDeleteProduct(p.id)} className="text-red/50 hover:text-red">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <p className="p-8 text-center text-text3 text-[13px]">Aucun produit configuré</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[12px] font-bold text-text2 uppercase tracking-widest">Section V2 (Bientôt)</h2><div className="bg-card border border-border rounded-card p-4 text-[13px] text-text3 italic">Détection automatique des places disponible en V2 avec capteurs.</div></section><section className="space-y-4"><h2 className="text-[12px] font-bold text-text2 uppercase tracking-widest">Synchronisation</h2>
        <div className="bg-card border border-border rounded-card p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[14px] font-bold text-text">Dernière synchro</p>
            <p className="text-[11px] text-text3">Il y a 2 minutes</p>
          </div>
          <button className="p-2 bg-surface border border-border rounded-button text-accent2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section className="pt-4">
        <button
          onClick={() => {
            if (confirm('Êtes-vous sûr? Les données non synchronisées seront conservées.')) {
              logout();
              navigate('/login');
            }
          }}
          className="w-full h-12 bg-red-dim border border-red/20 text-red font-bold rounded-button flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </section>

      <BottomSheet isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} title="Ajouter un produit">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-text2 uppercase">Nom du produit</label>
            <input
              value={newProdName}
              onChange={e => setNewProdName(e.target.value)}
              placeholder="Ex: Café Noir"
              className="w-full h-12 bg-black/30 border border-border rounded-input px-4 text-text"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-text2 uppercase">Prix (DH)</label>
            <div className="relative">
              <input
                type="number"
                value={newProdPrice || ''}
                onChange={e => setNewProdPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full h-12 bg-black/30 border border-border rounded-input px-4 text-text font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 font-mono">DH</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-text2 uppercase">Catégorie</label>
            <div className="grid grid-cols-3 gap-2">
              {['boisson', 'nourriture', 'autre'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewProdCat(cat as any)}
                  className={`py-2 rounded-badge border text-[12px] font-bold capitalize transition-all ${newProdCat === cat ? 'bg-accent border-accent text-white' : 'bg-surface border-border text-text2'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <button
            disabled={!newProdName}
            onClick={handleAddProduct}
            className="w-full h-[52px] bg-accent text-white font-bold rounded-button mt-4"
          >
            Ajouter le produit
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
