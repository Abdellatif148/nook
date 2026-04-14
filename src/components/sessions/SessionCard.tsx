import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveTimer } from '../../hooks/useLiveTimer';
import { useCurrentBill } from '../../hooks/useCurrentBill';
import { useAuthStore } from '../../stores/authStore';
import { formatDH } from '../../utils/formatters';
import type { Session } from '../../types';

interface SessionCardProps {
  session: Session;
  onEnd: (session: Session) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onEnd }) => {
  const navigate = useNavigate();
  const { settings } = useAuthStore();
  const { display, totalMinutes } = useLiveTimer(session.started_at);
  const { totalAmount } = useCurrentBill(session, settings);

  const isLong = settings && totalMinutes > settings.long_session_alert_hours * 60;

  return (
    <div
      className={`bg-card border ${isLong ? 'border-yellow/50' : 'border-border'} rounded-card p-4 shadow-main relative overflow-hidden`}
      onClick={() => navigate(`/sessions/${session.id}`)}
    >
      {isLong && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow animate-pulse" />
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-accent-dim text-accent2 text-[11px] font-bold rounded-badge uppercase">
            Place {session.seat_number}
          </span>
          <span className="text-[14px] font-bold text-text truncate max-w-[120px]">
            {session.customer_name}
          </span>
        </div>
        <span className="px-2 py-0.5 bg-border2 text-text2 text-[11px] rounded-badge">
          {session.rate_per_hour} DH/h
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="text-[28px] font-mono font-bold text-text leading-none">
            {display}
          </div>
          <div className="text-[10px] text-text3 uppercase font-bold tracking-wider">durée</div>
        </div>

        <div className="space-y-1 text-center">
          <div className="text-[22px] font-mono font-bold text-accent2 leading-none">
            {formatDH(totalAmount)}
          </div>
          <div className="text-[10px] text-text3 uppercase font-bold tracking-wider">montant</div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEnd(session);
          }}
          className="bg-red-dim border border-red/30 text-red px-3.5 py-2 rounded-button text-[13px] font-bold hover:bg-red/10 active:scale-95 transition-all"
        >
          Terminer
        </button>
      </div>

      {isLong && (
        <div className="mt-3 py-1.5 px-3 bg-yellow-dim border border-yellow/20 rounded-button flex items-center gap-2">
          <span className="text-[11px] font-bold text-yellow">⚠ Session longue — vérifier</span>
        </div>
      )}
    </div>
  );
};
