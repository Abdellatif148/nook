import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertBannerProps {
  message: string | null;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="w-full p-2.5 bg-red-dim border-b border-red/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red shrink-0" />
            <span className="text-[13px] font-medium text-red truncate">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
