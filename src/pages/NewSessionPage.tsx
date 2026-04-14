import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { useUIStore } from '../stores/uiStore';
import { saveSession } from '../db/sessions';
import { addToSyncQueue } from '../db/syncQueue';
import { addAuditLog } from "../db/auditLog";
import { getAllSessions } from '../db/sessions';
import { formatTime } from '../utils/formatters';
import type { Session } from '../types';

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, settings } = useAuthStore();
  const { addActiveSession } = useSessionStore();
  const { addToast } = useUIStore();

  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [selectedSeat, setSelectedSeat] = React.useState<number | null>(null);
  const [rateType, setRateType] = React.useState<'standard' | 'premium' | 'custom'>('standard');
  const [customRate, setCustomRate] = React.useState<number>(0);
  const [note, setNote] = React.useState('');
  const [occupiedSeats, setOccupiedSeats] = React.useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = React.useState(false);
  const [recentClients, setRecentClients] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (user?.cafe_id) {
      fetchOccupied(user.cafe_id);
      fetchRecentClients(user.cafe_id);
    }
  }, [user]);

  const fetchOccupied = async (cafeId: string) => {
    const all = await getAllSessions(cafeId);
    const occupied = new Set(all.filter(s => s.status === 'active').map(s => s.seat_number));
    setOccupiedSeats(occupied);
  };

  const fetchRecentClients = async (cafeId: string) => {
    const all = await getAllSessions(cafeId);
    const names = Array.from(new Set(all.map(s => s.customer_name))).slice(0, 5);
    setRecentClients(names);
  };

  const handleStart = async () => {
    if (!user || !selectedSeat || !customerName) return;
    if (occupiedSeats.has(selectedSeat)) {
      addToast({ type: 'error', message: `La place ${selectedSeat} est déjà occupée.` });
      return;
    }

    setIsSaving(true);
    const rate = rateType === 'standard' ? (settings?.default_rate || 2)
               : rateType === 'premium' ? (settings?.premium_rate || 3)
               : customRate;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const session: Session = {
      id,
      local_id: id,
      cafe_id: user.cafe_id,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || undefined,
      seat_number: selectedSeat,
      rate_per_hour: rate,
      started_at: now,
      extras: [],
      extras_total: 0,
      total_amount: 0,
      status: 'active',
      created_by: user.id,
      synced: false,
      created_at: now,
      updated_at: now
    };

    try {
      await saveSession(session);
      await addToSyncQueue({
        id: crypto.randomUUID(),
        type: 'create_session',
        payload: session,
        retry_count: 0,
        created_at: now
      });
      await addAuditLog(user.cafe_id, user.id, "CREATE_SESSION", `Session démarrée pour ${customerName} à la place ${selectedSeat}`);
      addActiveSession(session);
      addToast({ type: 'success', message: `Session démarrée — Place ${selectedSeat}, ${customerName}` });
      navigate('/dashboard');
    } catch (err) {
      addToast({ type: 'error', message: 'Erreur lors du démarrage' });
    } finally {
      setIsSaving(false);
    }
  };

  const totalSeats = settings?.total_seats || 20;
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <header className="h-[56px] border-b border-border px-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-text2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] font-bold text-text">Nouvelle session</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {/* SECTION 1 — Client */}
        <section className="space-y-4">
          <h2 className="text-[12px] font-bold text-text2 uppercase tracking-widest">Client</h2>

          <div className="space-y-3">
            <div className="relative">
              <input
                autoFocus
                type="text"
                placeholder="Nom du client"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full h-[48px] bg-black/30 border border-border rounded-input px-4 text-text text-[16px] focus:border-accent"
              />
              {customerName && (
                <button
                  onClick={() => setCustomerName('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text3"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              type="tel"
              inputMode="numeric"
              placeholder="+212 6XX XXX XXX"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="w-full h-[48px] bg-black/30 border border-border rounded-input px-4 text-text text-[16px] focus:border-accent"
            />

            {recentClients.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-text3 font-bold">Récents:</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {recentClients.map(name => (
                    <button
                      key={name}
                      onClick={() => setCustomerName(name)}
                      className="shrink-0 px-3 py-1.5 bg-card border border-border rounded-badge text-[12px] text-text2 active:scale-95 transition-all"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2 — Place */}
        <section className="space-y-4">
          <h2 className="text-[12px] font-bold text-text2 uppercase tracking-widest">Place</h2>
          <div className="grid grid-cols-4 gap-3">
            {seats.map(num => {
              const isOccupied = occupiedSeats.has(num);
              const isSelected = selectedSeat === num;

              return (
                <button
                  key={num}
                  disabled={isOccupied}
                  onClick={() => setSelectedSeat(num)}
                  className={`
                    w-full aspect-square rounded-full flex flex-col items-center justify-center border transition-all
                    ${isOccupied ? 'bg-red-dim border-red/30 text-red opacity-50' :
                      isSelected ? 'bg-accent-dim border-accent text-accent2 ring-4 ring-accent/10' :
                      'bg-card border-border text-text2'}
                  `}
                >
                  <span className={`text-[16px] ${isSelected ? 'font-bold' : 'font-medium'}`}>{num}</span>
                  {isOccupied && <span className="text-[9px] mt-0.5 opacity-80">Occ.</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 3 — Tarif */}
        <section className="space-y-4">
          <h2 className="text-[12px] font-bold text-text2 uppercase tracking-widest">Tarif</h2>
          <div className="space-y-2">
            {[
              { id: 'standard', label: 'Standard', sub: `${settings?.default_rate || 2} DH / heure`, icon: '⏱️' },
              { id: 'premium', label: 'Premium', sub: `${settings?.premium_rate || 3} DH / heure`, icon: '⭐' },
              { id: 'custom', label: 'Personnalisé', sub: 'Saisir un tarif', icon: '✏️' },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setRateType(type.id as any)}
                className={`
                  w-full p-4 rounded-card border flex items-center justify-between text-left transition-all
                  ${rateType === type.id ? 'bg-accent-dim border-accent' : 'bg-card border-border'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{type.icon}</span>
                  <div>
                    <p className={`text-[14px] font-bold ${rateType === type.id ? 'text-accent2' : 'text-text'}`}>
                      {type.label}
                    </p>
                    <p className="text-[12px] text-text3">{type.sub}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${rateType === type.id ? 'border-accent' : 'border-border2'}`}>
                  {rateType === type.id && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                </div>
              </button>
            ))}

            {rateType === 'custom' && (
              <div className="relative mt-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="DH/heure"
                  value={customRate || ''}
                  onChange={e => setCustomRate(parseFloat(e.target.value) || 0)}
                  className="w-full h-12 bg-black/30 border border-accent/30 rounded-input px-4 text-text font-mono focus:border-accent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 font-mono">DH/h</span>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[12px] font-bold text-text2 uppercase tracking-widest">Note (optionnel)</h2>
          <textarea
            placeholder="Note interne (optionnel)"
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full bg-black/20 border border-border rounded-input p-3 text-text placeholder:text-text3 text-[14px] focus:border-accent"
          />
        </section>

        {customerName && selectedSeat && (
          <div className="bg-card2 border border-border rounded-card p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="text-[11px] font-bold text-accent2 uppercase">Résumé de départ</h3>
            <div className="flex justify-between text-[13px]">
              <span className="text-text3">Client:</span>
              <span className="text-text font-bold">{customerName}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text3">Place:</span>
              <span className="text-text font-bold">{selectedSeat}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text3">Début:</span>
              <span className="text-text font-mono font-bold">{formatTime(new Date())}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 safe-bottom">
        <button
          disabled={!customerName || !selectedSeat || isSaving}
          onClick={handleStart}
          className="w-full h-[52px] bg-gradient-to-r from-accent to-accent2 text-white font-bold rounded-button shadow-main disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : '▶ Démarrer la session'}
        </button>
      </div>
    </div>
  );
};
