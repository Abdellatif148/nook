import * as React from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getAllSessions } from '../db/sessions';
import { formatDH, formatDuration } from '../utils/formatters';
import { generateReportPDF } from '../utils/pdfGenerator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import type { Session } from '../types';

export const ReportsPage: React.FC = () => {
  const { user, settings } = useAuthStore();
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [period, setPeriod] = React.useState<'today' | 'week' | 'month'>('today');
  const [fiscalExpanded, setFiscalExpanded] = React.useState(false);

  React.useEffect(() => {
    if (user?.cafe_id) {
      fetchData(user.cafe_id);
    }
  }, [user]);

  const fetchData = async (cafeId: string) => {
    const all = await getAllSessions(cafeId);
    setSessions(all);
  };

  const filtered = sessions.filter(s => {
    const today = new Date().toISOString().split('T')[0];
    if (period === 'today') return s.started_at.startsWith(today);
    // Simple filter for the last 7 days for 'week'
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(s.started_at) >= weekAgo;
    }
    // Simple filter for the last 30 days for 'month'
    if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return new Date(s.started_at) >= monthAgo;
    }
    return true;
  });

  const stats = {
    revenue: filtered.reduce((acc, s) => acc + s.total_amount, 0),
    count: filtered.length,
    totalMinutes: filtered.reduce((acc, s) => acc + (s.duration_minutes || 0), 0),
    cash: filtered.filter(s => s.payment_method === 'cash').reduce((acc, s) => acc + s.total_amount, 0),
    card: filtered.filter(s => s.payment_method === 'card').reduce((acc, s) => acc + s.total_amount, 0),
    account: filtered.filter(s => s.payment_method === 'account').reduce((acc, s) => acc + s.total_amount, 0),
    free: filtered.filter(s => s.payment_method === 'free').length,
  };

  const avgPerSession = stats.count ? stats.revenue / stats.count : 0;

  const chartData = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 8; // 8am to 10pm
    const hourStr = hour.toString().padStart(2, '0') + ':00';
    const amount = filtered
      .filter(s => s.started_at.includes(`T${hour.toString().padStart(2, '0')}`))
      .reduce((acc, s) => acc + s.total_amount, 0);
    return { name: hourStr, value: amount };
  });

  const handleDownloadPDF = () => {
    generateReportPDF(filtered, settings, period === 'today' ? 'Aujourd_hui' : period === 'week' ? 'Cette_Semaine' : 'Ce_Mois');
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <h1 className="text-[20px] font-bold text-text">Rapports</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'today', label: 'Aujourd\'hui' },
          { id: 'week', label: 'Semaine' },
          { id: 'month', label: 'Mois' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setPeriod(opt.id as any)}
            className={`shrink-0 px-4 py-2 rounded-badge text-[13px] font-bold transition-all ${period === opt.id ? 'bg-accent text-white' : 'bg-card border border-border text-text2'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-[16px] p-6 text-center space-y-2">
        <p className="text-[12px] text-text2 uppercase font-bold tracking-widest">Recette Totale</p>
        <p className="text-[36px] font-mono font-black text-text">{formatDH(stats.revenue)}</p>
        <p className="text-[13px] text-text3">
          {stats.count} sessions • {formatDuration(stats.totalMinutes)} total • {formatDH(avgPerSession)} moy
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Espèces', value: stats.cash, icon: '💵' },
          { label: 'Carte', value: stats.card, icon: '💳' },
          { label: 'Comptes', value: stats.account, icon: '👤' },
          { label: 'Offert', value: `${stats.free} sess.`, icon: '🎁' },
        ].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-card p-4 space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span>{item.icon}</span>
              <span className="text-[11px] text-text3 font-bold uppercase">{item.label}</span>
            </div>
            <p className="text-[15px] font-mono font-bold text-text">
              {typeof item.value === 'number' ? formatDH(item.value) : item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-card p-4 space-y-4">
        <h2 className="text-[15px] font-bold text-text">Évolution de la recette</h2>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2236" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4a5470', fontSize: 10 }}
                interval={2}
              />
              <YAxis hide />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#f97316' : '#1a2236'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-border rounded-card overflow-hidden">
        <button
          onClick={() => setFiscalExpanded(!fiscalExpanded)}
          className="w-full p-4 bg-card flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <span>📋</span>
            <span className="text-[14px] font-bold text-text">Documentation fiscale</span>
          </div>
          {fiscalExpanded ? <ChevronUp className="w-5 h-5 text-text3" /> : <ChevronDown className="w-5 h-5 text-text3" />}
        </button>

        {fiscalExpanded && (
          <div className="p-4 bg-card border-t border-border space-y-4 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-text3 font-bold uppercase">Recette HT</p>
                <p className="text-[14px] font-mono font-bold text-text">{formatDH(stats.revenue / 1.2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-text3 font-bold uppercase">TVA (20%)</p>
                <p className="text-[14px] font-mono font-bold text-text">{formatDH(stats.revenue - (stats.revenue / 1.2))}</p>
              </div>
            </div>

            <button
              onClick={handleDownloadPDF}
              className="w-full h-12 bg-surface border border-border rounded-button flex items-center justify-center gap-2 text-[14px] font-bold text-text hover:bg-surface2 transition-all"
            >
              <Download className="w-4 h-4" />
              Télécharger rapport PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
