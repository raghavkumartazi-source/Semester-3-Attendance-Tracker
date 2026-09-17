'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AttendanceStatus } from '@/lib/types';

interface UndoToastProps {
  show: boolean;
  subjectCode: string;
  status: AttendanceStatus;
  onUndo: () => void;
  onClose: () => void;
}

const STATUS_EMOJI: Record<AttendanceStatus, string> = {
  PRESENT: '✅',
  ABSENT: '❌',
  CANCELLED: '🚫',
  UNMARKED: '↩️',
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  CANCELLED: 'Cancelled',
  UNMARKED: 'Unmarked',
};

export default function UndoToast({ show, subjectCode, status, onUndo, onClose }: UndoToastProps) {
  const [visible, setVisible] = useState(false);
  const [emojiKey, setEmojiKey] = useState(0);

  useEffect(() => {
    if (show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      setEmojiKey((k) => k + 1);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, onClose]);

  if (!show && !visible) return null;

  return (
    <motion.div
      initial={false}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 16, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
    >
      <div className="glass-floating rounded-full px-4 py-3 flex items-center gap-4 shadow-2xl border-white/20">
        <div className="flex items-center gap-2.5">
          {/* Animated emoji pops in on every new status */}
          <AnimatePresence mode="wait">
            <motion.span
              key={emojiKey}
              initial={{ scale: 0, rotate: -30, opacity: 0 }}
              animate={{ scale: [0, 1.4, 0.9, 1.12, 1], rotate: [-30, 10, -5, 0], opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="text-base select-none"
              style={{ lineHeight: 1 }}
            >
              {STATUS_EMOJI[status]}
            </motion.span>
          </AnimatePresence>

          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
            status === 'PRESENT' ? 'bg-emerald-400 text-emerald-400' :
            status === 'ABSENT' ? 'bg-red-400 text-red-400' :
            status === 'CANCELLED' ? 'bg-zinc-400 text-zinc-400' :
            'bg-white/20 text-white/20'
          }`} />
          <span className="text-xs font-medium text-white">
            Marked <span className="font-bold">{STATUS_LABEL[status]}</span> for {subjectCode}
          </span>
        </div>
        
        <div className="w-[1px] h-4 bg-white/10" />
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            onUndo();
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Undo
        </motion.button>
      </div>
    </motion.div>
  );
}
