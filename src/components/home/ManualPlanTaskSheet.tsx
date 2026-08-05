'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '@/lib/types';
import { useWorkSessions } from '../WorkSessionProvider';

export function ManualPlanTaskSheet({ task, onClose }: { task: Task, onClose: () => void }) {
  const { addSession } = useWorkSessions();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const defaultDate = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    addSession({
      task_id: task.id,
      planned_start: start.toISOString(),
      planned_end: end.toISOString(),
      status: 'PLANNED',
    });

    onClose();
  };

  if (!mounted) return null;

  const content = (
    <div 
      className="fixed inset-0 z-[110] flex sm:items-center items-end justify-center animate-fade-in-up" 
      style={{ animationDuration: '0.2s' }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#0a0d14] sm:rounded-[28px] rounded-t-[28px] shadow-2xl sm:border border-t border-white/10 slide-up flex flex-col min-w-0">
        
        <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />

        <form onSubmit={handleSubmit} className="flex flex-col">
          
          <div className="pt-8 sm:pt-6 px-6 pb-4 flex items-center justify-between border-b border-white/5">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Plan Session</h2>
              <p className="text-xs text-white/50 truncate max-w-[200px] mt-1">{task.title}</p>
            </div>
            <button type="button" onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/5">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Start Time</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">End Time</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-6 pt-4 bg-[#0a0d14] sm:rounded-b-[28px] border-t border-white/5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <button
              type="submit"
              className="w-full bg-emerald-500 text-[#07080b] font-bold text-sm tracking-wide py-4 rounded-xl active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Save Session
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
