'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AttendanceStatus } from '@/lib/types';

interface UndoToastProps {
  show: boolean;
  subjectCode: string;
  status: AttendanceStatus;
  onUndo: () => void;
  onClose: () => void;
}

const labels = { PRESENT: 'Present', ABSENT: 'Absent', CANCELLED: 'Cancelled', UNMARKED: 'Unmarked' };

export default function UndoToast({ show, subjectCode, status, onUndo, onClose }: UndoToastProps) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [show, onClose]);
  return <AnimatePresence>{show && <motion.div className="undo-toast" initial={reduced ? false : { opacity: 0, y: 14, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}><span role="status">{subjectCode} marked {labels[status].toLowerCase()}</span><button type="button" onClick={() => { onUndo(); onClose(); }}>Undo</button></motion.div>}</AnimatePresence>;
}
