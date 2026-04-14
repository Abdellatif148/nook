import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-[90vw] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 p-4 rounded-card border-l-4 shadow-main bg-card2",
              toast.type === 'success' && "border-green",
              toast.type === 'error' && "border-red",
              toast.type === 'warning' && "border-yellow",
              toast.type === 'info' && "border-blue"
            )}
            onClick={() => removeToast(toast.id)}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-red" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue" />}
            </div>
            <p className="text-sm font-medium text-text flex-1">{toast.message}</p>
            <button onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }} className="text-text3 hover:text-text">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
