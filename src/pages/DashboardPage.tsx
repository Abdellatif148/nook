import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Users, BarChart3, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { SessionCard } from '../components/sessions/SessionCard';
import { AlertBanner } from '../components/layout/AlertBanner';
import { formatDH, formatTime } from '../utils/formatters';
import { getAllSessions } from '../db/sessions';
import type { Session } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, settings } = useAuthStore();
  const { activeSessions, loadActiveSessions } = useSessionStore();
  const [completedToday, setCompletedToday] = React.useState<Session[]>([]);
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    if (user?.cafe_id) {
      loadActiveSessions(user.cafe_id);
      fetchCompletedToday(user.cafe_id);
    }
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, [user, loadActiveSessions]);

  const fetchCompletedToday = async (cafeId: string) => {
    const all = await getAllSessions(cafeId);
    const today = new Date().toISOString().split('T')[0];
    const filtered = all
      .filter(s => s.status === 'completed' && s.ended_at?.startsWith(today))
      .sort((a, b) => new Date(b.ended_at!).getTime() - new Date(a.ended_at!).getTime());
    setCompletedToday(filtered);
  };

  const revenueToday = completedToday.reduce((acc, s) => acc + s.total_amount, 0);
  const activeCount = activeSessions.length;
  const completedCount = completedToday.length;

  const longSession = activeSessions.find(s => {
    if (!settings) return false;
    const start = new Date(s.started_at).getTime();
    const diff = (Date.now() - start) / 3600000;
    return diff > settings.long_session_alert_hours;
  });

  return (
    <div className="p-4 space-y-6">
      <AlertBanner
        message={longSession ? `Session longue: Place ${longSession.seat_number} (${longSession.customer_name})` : null}
      />

      {/* SECTION A — TODAY SUMMARY */}
      <div className="bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/25 rounded-[14px] p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-accent2 uppercase tracking-wider">Aujourd'hui</span>
          <span className="text-[12px] font-mono text-text2">{formatTime(now)}</span>
        </div>

        <div className="text-[36px] font-mono font-extrabold text-text mb-4">
          {formatDH(revenueToday)}
        </div>

        <div className="flex gap-2">
          <div className="px-3 py-1 bg-green-dim border border-green/20 rounded-badge text-[11px] font-bold text-green">
            {activeCount + completedCount} sessions
          </div>
          <div className="px-3 py-1 bg-accent-dim border border-accent/20 rounded-badge text-[11px] font-bold text-accent">
            {activeCount} actives
          </div>
          <div className="px-3 py-1 bg-border2 rounded-badge text-[11px] font-bold text-text2">
            {completedCount} clôturées
          </div>
        </div>
      </div>

      {/* SECTION B — ACTIVE SESSIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-text">Sessions actives</h2>
          <div className="px-2 py-0.5 bg-accent text-white text-[10px] font-bold rounded-full">
            {activeCount}
          </div>
        </div>

        {activeCount > 0 ? (
          <div className="space-y-3">
            {activeSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onEnd={(s) => navigate(`/sessions/${s.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-card p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Clock className="w-8 h-8 text-text3" />
            <p className="text-[14px] text-text2">Aucune session active</p>
            <button
              onClick={() => navigate('/sessions/new')}
              className="w-full h-11 bg-accent text-white font-bold rounded-button"
            >
              + Démarrer une session
            </button>
          </div>
        )}
      </div>

      {/* SECTION C — QUICK ACTIONS */}
      <div className="space-y-3">
        <h2 className="text-[15px] font-bold text-text">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/sessions/new')}
            className="h-[72px] bg-accent-dim border border-accent/30 rounded-card flex flex-col items-center justify-center gap-1 text-accent2"
          >
            <Plus className="w-6 h-6" />
            <span className="text-[12px] font-bold">Nouvelle session</span>
          </button>
          <button
            onClick={() => navigate('/sessions/history')}
            className="h-[72px] bg-card border border-border rounded-card flex flex-col items-center justify-center gap-1 text-text"
          >
            <Clock className="w-6 h-6 text-text2" />
            <span className="text-[12px] font-bold">Historique</span>
          </button>
          <button
            onClick={() => navigate('/clients')}
            className="h-[72px] bg-card border border-border rounded-card flex flex-col items-center justify-center gap-1 text-text"
          >
            <Users className="w-6 h-6 text-text2" />
            <span className="text-[12px] font-bold">Clients</span>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="h-[72px] bg-card border border-border rounded-card flex flex-col items-center justify-center gap-1 text-text"
          >
            <BarChart3 className="w-6 h-6 text-text2" />
            <span className="text-[12px] font-bold">Rapport</span>
          </button>
        </div>
      </div>

      {/* SECTION D — LAST COMPLETED */}
      <div className="space-y-3">
        <h2 className="text-[15px] font-bold text-text">Dernières sessions</h2>
        <div className="space-y-2">
          {completedToday.length > 0 ? (
            completedToday.slice(0, 5).map(session => (
              <div key={session.id} className="flex items-center justify-between p-1">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-mono text-text2">{formatTime(session.ended_at!)}</span>
                  <div className="space-y-0.5">
                    <p className="text-[13px] font-medium text-text">Place {session.seat_number} — {session.customer_name}</p>
                    <p className="text-[11px] text-text3">{session.duration_minutes} min</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-mono font-bold text-text">{formatDH(session.total_amount)}</p>
                  <span className="text-[12px]">
                    {session.payment_method === 'cash' && '💵'}
                    {session.payment_method === 'card' && '💳'}
                    {session.payment_method === 'account' && '👤'}
                    {session.payment_method === 'free' && '🎁'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-text3 text-center py-4">Aucune session clôturée aujourd'hui</p>
          )}
        </div>
      </div>
    </div>
  );
};
