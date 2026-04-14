import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getAllSessions } from '../db/sessions';
import { formatDH, formatTime, formatDate } from '../utils/formatters';
import type { Session } from '../types';

export const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [filter, setFilter] = React.useState<'today' | 'week' | 'month' | 'all'>('today');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (user?.cafe_id) {
      fetchSessions(user.cafe_id);
    }
  }, [user]);

  const fetchSessions = async (cafeId: string) => {
    const all = await getAllSessions(cafeId);
    setSessions(all.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()));
  };

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                          s.seat_number.toString() === search;

    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return matchesSearch && s.started_at.startsWith(today);
    }
    // Simplification for now, filter logic can be more precise
    return matchesSearch;
  });

  const stats = {
    count: filteredSessions.length,
    revenue: filteredSessions.reduce((acc, s) => acc + s.total_amount, 0),
    avgDuration: filteredSessions.length ?
      Math.round(filteredSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / filteredSessions.length) : 0
  };

  // Group by day
  const grouped: Record<string, Session[]> = {};
  filteredSessions.forEach(s => {
    const day = s.started_at.split('T')[0];
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(s);
  });

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-[20px] font-bold text-text">Historique</h1>
        <div className="flex-1" />
        <button className="p-2 bg-card border border-border rounded-button text-text2">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'today', label: 'Aujourd\'hui' },
          { id: 'week', label: 'Cette semaine' },
          { id: 'month', label: 'Ce mois' },
          { id: 'all', label: 'Tout' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id as any)}
            className={`shrink-0 px-4 py-2 rounded-badge text-[13px] font-bold transition-all ${filter === opt.id ? 'bg-accent text-white' : 'bg-card border border-border text-text2'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
        <input
          type="text"
          placeholder="Chercher par nom ou place..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 bg-black/30 border border-border rounded-input pl-11 pr-4 text-text placeholder:text-text3 text-[14px]"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-card p-3 text-center">
          <p className="text-[10px] text-text3 font-bold uppercase mb-1">Sessions</p>
          <p className="text-[15px] font-mono font-bold text-text">{stats.count}</p>
        </div>
        <div className="bg-card border border-border rounded-card p-3 text-center">
          <p className="text-[10px] text-text3 font-bold uppercase mb-1">Recette</p>
          <p className="text-[15px] font-mono font-bold text-accent2">{formatDH(stats.revenue)}</p>
        </div>
        <div className="bg-card border border-border rounded-card p-3 text-center">
          <p className="text-[10px] text-text3 font-bold uppercase mb-1">Moy. durée</p>
          <p className="text-[15px] font-mono font-bold text-text">{stats.avgDuration}min</p>
        </div>
      </div>

      <div className="space-y-6 pb-20">
        {Object.entries(grouped).map(([day, daySessions]) => (
          <div key={day} className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-1">
              <span className="text-[12px] font-bold text-text2">{formatDate(day)}</span>
              <span className="text-[11px] font-mono text-text3">
                {formatDH(daySessions.reduce((acc, s) => acc + s.total_amount, 0))}
              </span>
            </div>
            <div className="space-y-1">
              {daySessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  className="flex items-center justify-between p-2 rounded-card active:bg-surface2 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-[12px] font-mono text-text2">{formatTime(session.started_at)}</span>
                      <span className="text-[10px] font-bold text-accent px-1.5 bg-accent-dim rounded-badge mt-1">P{session.seat_number}</span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-bold text-text">{session.customer_name}</p>
                      <p className="text-[11px] text-text3">{session.duration_minutes || '?'} min</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[14px] font-mono font-bold text-text">{formatDH(session.total_amount)}</p>
                    <span className="text-[14px] mt-0.5 opacity-80">
                      {session.payment_method === 'cash' && '💵'}
                      {session.payment_method === 'card' && '💳'}
                      {session.payment_method === 'account' && '👤'}
                      {session.payment_method === 'free' && '🎁'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="py-20 text-center text-text3 text-[14px]">
            Aucune session trouvée
          </div>
        )}
      </div>
    </div>
  );
};
