import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Plus, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { useUIStore } from '../stores/uiStore';
import { useLiveTimer } from '../hooks/useLiveTimer';
import { useCurrentBill } from '../hooks/useCurrentBill';
import { getSession, saveSession } from '../db/sessions';
import { addToSyncQueue } from '../db/syncQueue';
import { addAuditLog } from "../db/auditLog";
import { getProducts } from '../db/products';
import { formatDH, formatTime } from '../utils/formatters';
import { BottomSheet } from '../components/ui/BottomSheet';
import type { Session, Product, Extra } from '../types';

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, settings } = useAuthStore();
  const { updateActiveSession, removeActiveSession } = useSessionStore();
  const { addToast } = useUIStore();

  const [session, setSession] = React.useState<Session | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isAddExtrasOpen, setIsAddExtrasOpen] = React.useState(false);
  const [isEndSessionOpen, setIsEndSessionOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'card' | 'account' | 'free' | null>(null);
  const [amountReceived, setAmountReceived] = React.useState<number>(0);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      fetchSession(id);
    }
    if (user?.cafe_id) {
      fetchProducts(user.cafe_id);
    }
  }, [id, user]);

  const fetchSession = async (sessionId: string) => {
    const s = await getSession(sessionId);
    if (s) setSession(s);
  };

  const fetchProducts = async (cafeId: string) => {
    const p = await getProducts(cafeId);
    setProducts(p);
  };

  const { display, totalMinutes } = useLiveTimer(session?.started_at || new Date().toISOString());
  const { timeCost, totalAmount } = useCurrentBill(session || { started_at: new Date().toISOString(), rate_per_hour: 2, extras: [], extras_total: 0 } as any, settings);

  const handleAddExtra = async (product: Product) => {
    if (!session) return;

    const existingIndex = session.extras.findIndex(e => e.id === product.id);
    let newExtras: Extra[];

    if (existingIndex > -1) {
      newExtras = [...session.extras];
      newExtras[existingIndex] = { ...newExtras[existingIndex], quantity: newExtras[existingIndex].quantity + 1 };
    } else {
      newExtras = [...session.extras, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    }

    const extras_total = newExtras.reduce((acc, e) => acc + (e.price * e.quantity), 0);
    const updated: Session = { ...session, extras: newExtras, extras_total, updated_at: new Date().toISOString() };

    await saveSession(updated);
    updateActiveSession(updated);
    setSession(updated);
    addToast({ type: 'success', message: `${product.name} ajouté` });
  };

  const handleCloseSession = async () => {
    if (!session || !paymentMethod || !user) return;

    setIsClosing(true);
    const now = new Date().toISOString();
    const finalSession: Session = {
      ...session,
      status: 'completed',
      ended_at: now,
      duration_minutes: totalMinutes,
      time_cost: timeCost,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      amount_received: paymentMethod === 'cash' ? amountReceived : undefined,
      change_given: paymentMethod === 'cash' ? (amountReceived - totalAmount) : undefined,
      synced: false,
      updated_at: now
    };

    try {
      await saveSession(finalSession);
      await addToSyncQueue({
        id: crypto.randomUUID(),
        type: 'update_session',
        payload: finalSession,
        retry_count: 0,
        created_at: now
      });
      await addAuditLog(user.cafe_id, user.id, "END_SESSION", `Session clôturée pour ${session.customer_name} - Total: ${totalAmount} DH`);
      removeActiveSession(session.id);
      addToast({ type: 'success', message: `Session clôturée — ${session.customer_name}` });
      navigate('/dashboard');
    } catch (err) {
      addToast({ type: 'error', message: 'Erreur lors de la clôture' });
    } finally {
      setIsClosing(false);
    }
  };

  if (!session) return null;

  const isLong = settings && totalMinutes > settings.long_session_alert_hours * 60;

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <header className="h-[56px] border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-text2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold text-text truncate max-w-[200px]">
            Place {session.seat_number} — {session.customer_name}
          </h1>
        </div>
        <button className="text-text2">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* TIMER SECTION */}
        <div className={`bg-card border ${isLong ? 'border-yellow/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-border'} rounded-[16px] p-6 text-center space-y-2`}>
          <div className={`text-[52px] font-mono font-black ${isLong ? 'text-yellow' : 'text-text'} leading-none`}>
            {display}
          </div>
          <div className="flex items-center justify-center gap-4 text-[12px] text-text2">
            <span>Démarré à {formatTime(session.started_at)}</span>
          </div>
          {isLong && (
            <div className="text-yellow text-[11px] font-bold uppercase tracking-widest animate-pulse mt-2">
              ⚠ Session longue
            </div>
          )}
        </div>

        {/* BILL SECTION */}
        <div className="bg-card border border-border rounded-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-text2 text-[14px]">Temps ({session.rate_per_hour} DH/h)</span>
            <span className="text-accent2 font-mono font-bold">{formatDH(timeCost)}</span>
          </div>

          {session.extras.length > 0 && (
            <>
              <div className="h-px bg-border" />
              {session.extras.map(extra => (
                <div key={extra.id} className="flex justify-between items-center text-[14px]">
                  <span className="text-text">{extra.quantity}x {extra.name}</span>
                  <span className="text-text2 font-mono">{formatDH(extra.price * extra.quantity)}</span>
                </div>
              ))}
            </>
          )}

          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="text-text font-bold uppercase tracking-wider text-[12px]">Total</span>
            <span className="text-accent2 font-mono font-black text-[22px]">{formatDH(totalAmount)}</span>
          </div>
        </div>

        <button
          onClick={() => setIsAddExtrasOpen(true)}
          className="w-full py-4 border border-dashed border-accent/30 rounded-card flex items-center justify-center gap-2 text-accent2 font-bold text-[14px]"
        >
          <Plus className="w-4 h-4" />
          Ajouter une consommation
        </button>

        {session.customer_phone && (
          <div className="text-center text-[13px] text-text3 italic">
            Tél: {session.customer_phone}
          </div>
        )}
      </div>

      <div className="p-4 safe-bottom">
        <button
          onClick={() => setIsEndSessionOpen(true)}
          className="w-full h-[52px] bg-gradient-to-r from-red to-red/80 text-white font-bold rounded-button shadow-main"
        >
          ⏹ Terminer la session
        </button>
      </div>

      {/* BOTTOM SHEETS */}
      <BottomSheet isOpen={isAddExtrasOpen} onClose={() => setIsAddExtrasOpen(false)} title="Ajouter une consommation">
        <div className="space-y-6">
          {['boisson', 'nourriture', 'autre'].map(category => {
            const catProducts = products.filter(p => p.category === category);
            if (catProducts.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <h3 className="text-[11px] font-bold text-text3 uppercase tracking-widest">{category}s</h3>
                <div className="grid grid-cols-2 gap-3">
                  {catProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAddExtra(p)}
                      className="p-3 bg-surface border border-border rounded-card text-left flex flex-col justify-between h-[80px]"
                    >
                      <span className="text-[13px] font-bold text-text line-clamp-1">{p.name}</span>
                      <span className="text-accent2 font-mono font-bold">{formatDH(p.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={isEndSessionOpen} onClose={() => setIsEndSessionOpen(false)} title="Clôturer la session">
        <div className="space-y-6">
          <div className="bg-card2 border border-border rounded-card p-4 space-y-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-text3">Client:</span>
              <span className="text-text font-bold">{session.customer_name}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text3">Durée:</span>
              <span className="text-text font-bold">{display}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-[15px]">
              <span className="text-text font-bold uppercase">Total à payer</span>
              <span className="text-accent2 font-mono font-black">{formatDH(totalAmount)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[12px] font-bold text-text2 uppercase tracking-widest">Mode de paiement</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'cash', label: 'Espèces', icon: '💵' },
                { id: 'card', label: 'Carte', icon: '💳' },
                { id: 'account', label: 'Compte', icon: '👤' },
                { id: 'free', label: 'Offert', icon: '🎁' },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`
                    h-[64px] rounded-card border flex items-center justify-center gap-2 transition-all
                    ${paymentMethod === method.id ? 'bg-accent-dim border-accent text-accent2 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'bg-surface border-border text-text2'}
                  `}
                >
                  <span className="text-xl">{method.icon}</span>
                  <span className="text-[14px] font-bold">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <label className="text-[12px] font-bold text-text2 uppercase">Montant reçu</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={totalAmount.toString()}
                  onChange={e => setAmountReceived(parseFloat(e.target.value) || 0)}
                  className="w-full h-12 bg-black/30 border border-border rounded-input px-4 text-text font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 font-mono">DH</span>
              </div>
              {amountReceived > 0 && (
                <div className="flex justify-between text-[14px]">
                  <span className="text-text3">Monnaie à rendre:</span>
                  <span className={`font-mono font-bold ${amountReceived >= totalAmount ? 'text-green' : 'text-red'}`}>
                    {amountReceived >= totalAmount ? formatDH(amountReceived - totalAmount) : 'Montant insuffisant'}
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            disabled={!paymentMethod || (paymentMethod === 'cash' && amountReceived < totalAmount) || isClosing}
            onClick={handleCloseSession}
            className="w-full h-[56px] bg-gradient-to-r from-green to-green/80 text-white font-bold rounded-button shadow-main disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isClosing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Encaisser ${formatDH(totalAmount)} ✓`}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
