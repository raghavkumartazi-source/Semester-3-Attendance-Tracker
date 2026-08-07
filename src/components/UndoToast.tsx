'use client';

import { useEffect, useState } from 'react';
import { AttendanceStatus } from '@/lib/types';

interface UndoToastProps {
  show: boolean;
  subjectCode: string;
  status: AttendanceStatus;
  onUndo: () => void;
  onClose: () => void;
}

export default function UndoToast({ show, subjectCode, status, onUndo, onClose }: UndoToastProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
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
    <div 
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-auto
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="glass-floating rounded-full px-4 py-3 flex items-center gap-4 shadow-2xl border-white/20">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
            status === 'PRESENT' ? 'bg-emerald-400 text-emerald-400' :
            status === 'ABSENT' ? 'bg-red-400 text-red-400' :
            status === 'CANCELLED' ? 'bg-zinc-400 text-zinc-400' :
            'bg-white/20 text-white/20'
          }`} />
          <span className="text-xs font-medium text-white">
            Marked <span className="font-bold">{
              status === 'PRESENT' ? 'Present' :
              status === 'ABSENT' ? 'Absent' :
              status === 'CANCELLED' ? 'Cancelled' : 'Unmarked'
            }</span> for {subjectCode}
          </span>
        </div>
        
        <div className="w-[1px] h-4 bg-white/10" />
        
        <button
          onClick={() => {
            onUndo();
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider flex items-center gap-1 active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Undo
        </button>
      </div>
    </div>
  );
}
