import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { getClients, saveClient } from '../db/clients';
import { addToSyncQueue } from '../db/syncQueue';
import { formatDH } from '../utils/formatters';
import { BottomSheet } from '../components/ui/BottomSheet';
import type { ClientAccount } from '../types';

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [clients, setClients] = React.useState<ClientAccount[]>([]);
  const [search, setSearch] = React.useState('');
  const [isNewClientOpen, setIsNewClientOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // New client form
  const [newName, setNewName] = React.useState('');
  const [newPhone, setNewPhone] = React.useState('');
  const [newBalance, setNewBalance] = React.useState(0);

  React.useEffect(() => {
    if (user?.cafe_id) {
      fetchClients(user.cafe_id);
    }
  }, [user]);

  const fetchClients = async (cafeId: string) => {
    const data = await getClients(cafeId);
    setClients(data.sort((a, b) => b.total_spent - a.total_spent));
  };

  const handleCreateClient = async () => {
    if (!user || !newName) return;

    setIsSaving(true);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const client: ClientAccount = {
      id,
      cafe_id: user.cafe_id,
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      balance: newBalance,
      total_visits: 0,
      total_spent: 0,
      synced: false,
      created_at: now,
      updated_at: now
    };

    try {
      await saveClient(client);
      await addToSyncQueue({
        id: crypto.randomUUID(),
        type: 'create_client',
        payload: client,
        retry_count: 0,
        created_at: now
      });
      setClients([client, ...clients]);
      addToast({ type: 'success', message: `Compte créé pour ${newName}` });
      setIsNewClientOpen(false);
      setNewName('');
      setNewPhone('');
      setNewBalance(0);
    } catch (err) {
      addToast({ type: 'error', message: 'Erreur lors de la création' });
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold text-text">Clients</h1>
        <button
          onClick={() => setIsNewClientOpen(true)}
          className="w-10 h-10 bg-accent text-white rounded-button flex items-center justify-center shadow-main"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
        <input
          type="text"
          placeholder="Chercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 bg-black/30 border border-border rounded-input pl-11 pr-4 text-text placeholder:text-text3 text-[14px]"
        />
      </div>

      <div className="space-y-3">
        {filtered.map(client => (
          <div
            key={client.id}
            onClick={() => navigate(`/clients/${client.id}`)}
            className="bg-card border border-border rounded-card p-4 flex items-center gap-4 active:bg-surface2 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue to-blue/50 flex items-center justify-center text-white font-bold text-sm">
              {client.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-text truncate">{client.name}</p>
              <p className="text-[11px] text-text3">Dernière visite: {client.total_visits > 0 ? 'Récemment' : 'Jamais'}</p>
            </div>
            <div className="text-right">
              <p className={`text-[14px] font-mono font-bold ${client.balance < 10 ? 'text-red' : client.balance < 50 ? 'text-yellow' : 'text-green'}`}>
                {formatDH(client.balance)}
              </p>
              <p className="text-[10px] text-text3 font-bold uppercase">Solde</p>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center text-text3 text-[14px]">
            Aucun client trouvé
          </div>
        )}
      </div>

      <BottomSheet isOpen={isNewClientOpen} onClose={() => setIsNewClientOpen(false)} title="Nouveau compte client">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-text2 uppercase">Nom</label>
            <input
              type="text"
              placeholder="Nom du client"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full h-12 bg-black/30 border border-border rounded-input px-4 text-text"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-text2 uppercase">Téléphone</label>
            <input
              type="tel"
              placeholder="+212 6XX XXX XXX"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              className="w-full h-12 bg-black/30 border border-border rounded-input px-4 text-text"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-text2 uppercase">Solde initial</label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                value={newBalance || ''}
                onChange={e => setNewBalance(parseFloat(e.target.value) || 0)}
                className="w-full h-12 bg-black/30 border border-border rounded-input px-4 text-text font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 font-mono">DH</span>
            </div>
            <p className="text-[11px] text-text3">Crédit de bienvenue (optionnel)</p>
          </div>

          <button
            disabled={!newName || isSaving}
            onClick={handleCreateClient}
            className="w-full h-[52px] bg-accent text-white font-bold rounded-button shadow-main disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer le compte'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
