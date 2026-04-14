import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, CreditCard, MessageCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { getClient, saveClient } from '../db/clients';
import { addToSyncQueue } from '../db/syncQueue';
import { getAllSessions } from '../db/sessions';
import { formatDH, formatDate, formatTime } from '../utils/formatters';
import { BottomSheet } from '../components/ui/BottomSheet';
import type { ClientAccount, Session } from '../types';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useAuthStore();
  const { addToast } = useUIStore();

  const [client, setClient] = React.useState<ClientAccount | null>(null);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [isRechargeOpen, setIsRechargeOpen] = React.useState(false);
  const [rechargeAmount, setRechargeAmount] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      fetchClient(id);
    }
  }, [id]);

  const fetchClient = async (clientId: string) => {
    const data = await getClient(clientId);
    if (data) {
      setClient(data);
      const all = await getAllSessions(data.cafe_id);
      const clientSessions = all.filter(s => s.customer_name === data.name || s.client_account_id === data.id);
      setSessions(clientSessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()));
    }
  };

  const handleRecharge = async () => {
    if (!client || rechargeAmount <= 0) return;

    setIsSaving(true);
    const updated: ClientAccount = {
      ...client,
      balance: client.balance + rechargeAmount,
      updated_at: new Date().toISOString()
    };

    try {
      await saveClient(updated);
      await addToSyncQueue({
        id: crypto.randomUUID(),
        type: 'update_client_balance',
        payload: { id: client.id, amount: rechargeAmount },
        retry_count: 0,
        created_at: new Date().toISOString()
      });
      setClient(updated);
      addToast({ type: 'success', message: `${formatDH(rechargeAmount)} ajoutés pour ${client.name}` });
      setIsRechargeOpen(false);
      setRechargeAmount(0);
    } catch (err) {
      addToast({ type: 'error', message: 'Erreur lors de la recharge' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!client) return null;

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <header className="h-[56px] border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-text2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold text-text truncate max-w-[200px]">{client.name}</h1>
        </div>
        <button className="text-text2">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-card2 border border-border rounded-[16px] p-6 space-y-6 shadow-main">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue to-blue/50 flex items-center justify-center text-white font-bold text-xl shadow-main">
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-[18px] font-black text-text">{client.name}</h2>
              {client.phone && <p className="text-[13px] text-text2 font-mono">{client.phone}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] text-text2 uppercase font-bold tracking-widest">Solde disponible</p>
            <p className={`text-[32px] font-mono font-black ${client.balance < 10 ? 'text-red' : client.balance < 50 ? 'text-yellow' : 'text-green'}`}>
              {formatDH(client.balance)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
            <div className="text-center">
              <p className="text-[10px] text-text3 font-bold uppercase mb-1">Visites</p>
              <p className="text-[13px] font-mono font-bold text-text">{client.total_visits}</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-[10px] text-text3 font-bold uppercase mb-1">Dépensé</p>
              <p className="text-[13px] font-mono font-bold text-text">{formatDH(client.total_spent)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-text3 font-bold uppercase mb-1">Dernière</p>
              <p className="text-[13px] font-bold text-text">
                {sessions.length > 0 ? formatDate(sessions[0].started_at) : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setIsRechargeOpen(true)}
            className="h-[52px] bg-green-dim border border-green/30 text-green rounded-button flex items-center justify-center gap-2 font-bold"
          >
            <CreditCard className="w-4 h-4" />
            Recharger
          </button>
          {client.phone && (
            <a
              href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${client.name}, votre solde chez ${settings?.cafe_name || 'Nook'} est de ${formatDH(client.balance)}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[52px] bg-surface border border-border text-text2 rounded-button flex items-center justify-center gap-2 font-bold"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-[15px] font-bold text-text">Historique des visites</h3>
          <div className="space-y-1">
            {sessions.slice(0, 20).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="space-y-0.5">
                  <p className="text-[13px] font-medium text-text">{formatDate(s.started_at)} • {formatTime(s.started_at)}</p>
                  <p className="text-[11px] text-text3">{s.duration_minutes || '?'} min</p>
                </div>
                <p className="text-[13px] font-mono font-bold text-text">{formatDH(s.total_amount)}</p>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-center text-text3 text-[13px] py-10">Aucune visite enregistrée</p>
            )}
          </div>
        </div>
      </div>

      <BottomSheet isOpen={isRechargeOpen} onClose={() => setIsRechargeOpen(false)} title="Recharger le compte">
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-[12px] text-text2 uppercase font-bold tracking-widest">Solde actuel</p>
            <p className="text-[28px] font-mono font-black text-text">{formatDH(client.balance)}</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[20, 50, 100, 200].map(amt => (
              <button
                key={amt}
                onClick={() => setRechargeAmount(amt)}
                className={`py-2 rounded-badge border text-[13px] font-bold transition-all ${rechargeAmount === amt ? 'bg-accent border-accent text-white' : 'bg-surface border-border text-text2'}`}
              >
                {amt} DH
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-text2 uppercase">Montant à ajouter (DH)</label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min="1"
                placeholder="0.00"
                value={rechargeAmount || ''}
                onChange={e => setRechargeAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-12 bg-black/30 border border-border rounded-input px-4 text-text font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 font-mono">DH</span>
            </div>
          </div>

          <div className="bg-card2 border border-border rounded-card p-4 flex justify-between items-center">
            <span className="text-text3 text-[13px]">Nouveau solde:</span>
            <span className="text-green font-mono font-bold text-[18px]">
              {formatDH(client.balance + rechargeAmount)}
            </span>
          </div>

          <button
            disabled={rechargeAmount <= 0 || isSaving}
            onClick={handleRecharge}
            className="w-full h-[52px] bg-accent text-white font-bold rounded-button shadow-main disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmer la recharge'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
