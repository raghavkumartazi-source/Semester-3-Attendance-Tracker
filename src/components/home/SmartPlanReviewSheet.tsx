'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '@/lib/types';
import { SuggestedPlan } from '@/lib/plannerAlgorithm';
import { useWorkSessions } from '../WorkSessionProvider';

export function SmartPlanReviewSheet({ 
  plan, 
  tasks,
  onClose 
}: { 
  plan: SuggestedPlan, 
  tasks: Task[],
  onClose: () => void 
}) {
  const { bulkAddSessions } = useWorkSessions();
  const [mounted, setMounted] = useState(false);
  const [activeSessions, setActiveSessions] = useState(plan.sessions);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleRemove = (index: number) => {
    setActiveSessions(prev => prev.filter((_, i) => i !== index));
  };

  const handleAccept = () => {
    bulkAddSessions(activeSessions);
    onClose();
  };

  if (!mounted) return null;

  // Group by date
  const grouped: Record<string, typeof activeSessions> = {};
  activeSessions.forEach(s => {
    const d = new Date(s.planned_start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(s);
  });

  const content = (
    <div 
      className="fixed inset-0 z-[110] flex sm:items-center items-end justify-center animate-fade-in-up" 
      style={{ animationDuration: '0.2s' }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#0a0d14] sm:rounded-[28px] rounded-t-[28px] shadow-2xl sm:border border-t border-white/10 slide-up flex flex-col max-h-[90dvh] sm:max-h-[min(760px,85dvh)] min-w-0">
        
        <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />

        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          <div className="shrink-0 pt-8 sm:pt-6 px-6 pb-4 flex items-center justify-between border-b border-white/5">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Suggested Plan</h2>
              <p className="text-xs text-white/50 truncate max-w-[200px] mt-1">{activeSessions.length} sessions proposed</p>
            </div>
            <button type="button" onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/5">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 hide-scrollbar min-h-0">
            {plan.overloadedTasks.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <h3 className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Overload Warning</h3>
                <p className="text-xs text-red-300/80 mb-2">The following tasks cannot fit before their deadlines based on your current preferences and schedule:</p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-red-300">
                  {plan.overloadedTasks.map(t => (
                    <li key={t.id}>{t.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(grouped).length === 0 && (
              <p className="text-white/40 text-center text-sm py-10">No sessions planned.</p>
            )}

            {Object.entries(grouped).map(([date, sessions]) => (
              <div key={date}>
                <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">{date}</h3>
                <div className="space-y-2">
                  {sessions.map((s, i) => {
                    const originalIndex = activeSessions.indexOf(s);
                    const task = tasks.find(t => t.id === s.task_id);
                    const start = new Date(s.planned_start);
                    const end = new Date(s.planned_end);
                    const duration = Math.round((end.getTime() - start.getTime()) / 60000);
                    
                    return (
                      <div key={i} className={`flex items-center justify-between glass-surface rounded-xl p-3 border ${task && new Date(task.due_at || '').getTime() < new Date().getTime() ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-zinc-200 truncate">{task?.title || 'Unknown Task'}</p>
                            {task && new Date(task.due_at || '').getTime() < new Date().getTime() && (
                              <span className="shrink-0 text-[9px] font-bold tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full uppercase">
                                Overdue
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${task && new Date(task.due_at || '').getTime() < new Date().getTime() ? 'text-red-300/80' : 'text-indigo-300/80'}`}>
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} ({duration}m)
                          </p>
                        </div>
                        <button 
                          onClick={() => handleRemove(originalIndex)}
                          className="shrink-0 p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-3"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <div className="h-4"></div>
          </div>

          <div className="shrink-0 p-6 pt-4 bg-[#0a0d14] sm:rounded-b-[28px] border-t border-white/5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <button
              onClick={handleAccept}
              className="w-full bg-emerald-500 text-[#07080b] font-bold text-sm tracking-wide py-4 rounded-xl active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Accept Plan ({activeSessions.length} Sessions)
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
