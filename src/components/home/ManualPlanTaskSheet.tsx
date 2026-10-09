'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '@/lib/types';
import { useWorkSessions } from '../WorkSessionProvider';

export function ManualPlanTaskSheet({ task, onClose }: { task: Task, onClose: () => void }) {
  const { addSession } = useWorkSessions();
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const formId = useId();

  useEffect(() => { close.current = onClose; }, [onClose]);
  
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      // Keep the parent sheet's lock; do not overwrite a parent already unmounted.
      if (document.body.style.overflow === 'hidden') document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const focusable = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? []).filter(element => element.getClientRects().length > 0);
    (focusable()[0] ?? panel.current)?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (event.defaultPrevented || dialogs[dialogs.length - 1] !== panel.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = focusable();
      const first = controls[0], last = controls[controls.length - 1];
      const index = controls.indexOf(document.activeElement as HTMLElement);
      if (!first) { event.preventDefault(); panel.current?.focus(); }
      else if (index < 0 || (event.shiftKey && index === 0) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mounted]);

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
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${formId}-heading`} aria-describedby={`${formId}-task`} tabIndex={-1} className="relative w-full max-w-lg bg-[#111320] sm:rounded-[28px] rounded-t-[28px] shadow-2xl sm:border border-t border-white/10 slide-up flex flex-col min-w-0 focus:outline-none">
        
        <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />

        <form onSubmit={handleSubmit} className="flex flex-col">
          
          <div className="pt-8 sm:pt-6 px-6 pb-4 flex items-center justify-between border-b border-white/5">
            <div>
              <h2 id={`${formId}-heading`} className="text-xl font-bold text-white tracking-tight">Plan Session</h2>
              <p id={`${formId}-task`} className="text-xs text-white/50 truncate max-w-[200px] mt-1">{task.title}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close dialog" className="min-w-11 min-h-11 grid place-items-center text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/5">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div>
              <label htmlFor={`${formId}-date`} className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Date</label>
              <input
                id={`${formId}-date`}
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${formId}-start`} className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Start Time</label>
                <input
                  id={`${formId}-start`}
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>
              <div>
                <label htmlFor={`${formId}-end`} className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">End Time</label>
                <input
                  id={`${formId}-end`}
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-6 pt-4 bg-[#111320] sm:rounded-b-[28px] border-t border-white/5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <button
              type="submit"
              className="w-full bg-emerald-500 text-[#040406] font-bold text-sm tracking-wide py-4 rounded-xl active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
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
