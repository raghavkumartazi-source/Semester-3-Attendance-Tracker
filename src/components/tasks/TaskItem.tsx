'use client';

import { useId, useRef, useState } from 'react';
import { Task } from '@/lib/types';
import { timeUtils } from '@/lib/timeUtils';
import { SUBJECTS } from '@/lib/config';
import { useWorkSessions } from '../WorkSessionProvider';

export function TaskItem({ task, onComplete, onEdit, onDelete }: { task: Task, onComplete: () => void, onEdit: () => void, onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isOverdue = timeUtils.isOverdue(task.due_at);
  const isToday = timeUtils.isToday(task.due_at);
  const isTomorrow = timeUtils.isTomorrow(task.due_at);
  const subject = SUBJECTS.find(s => s.code === task.subject_id);
  const { sessions } = useWorkSessions();
  
  const taskSessions = sessions.filter(s => s.task_id === task.id && s.status === 'PLANNED' && !s.deleted_at);
  const plannedMinutes = taskSessions.reduce((total, s) => {
    const start = new Date(s.planned_start).getTime();
    const end = new Date(s.planned_end).getTime();
    return total + Math.round((end - start) / 60000);
  }, 0);

  let dateLabel = '';
  if (isOverdue) dateLabel = 'Overdue';
  else if (isToday) dateLabel = 'Today';
  else if (isTomorrow) dateLabel = 'Tomorrow';
  else if (task.due_at) {
    const d = new Date(task.due_at);
    dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className={`relative glass-elevated rounded-2xl p-3 flex items-start gap-2 transition-all duration-300 ${
      isOverdue ? 'border-red-500/20 bg-red-500/5' : ''
    }`} onKeyDown={event => {
      if (event.key === 'Escape' && menuOpen) {
        event.stopPropagation();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }}>
      <button 
        type="button"
        onClick={onComplete}
        aria-label={`Mark ${task.title} as complete`}
        className="group shrink-0 w-11 h-11 rounded-xl flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
      >
        <span className="w-6 h-6 rounded-md border-2 border-white/20 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
          <svg aria-hidden="true" className="w-3.5 h-3.5 text-transparent group-hover:text-emerald-400 group-focus-visible:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      </button>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-zinc-100">
          <button type="button" onClick={onEdit} aria-label={`Edit ${task.title}`} className="block w-full min-h-11 rounded-lg text-left leading-5 [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]">{task.title}</button>
        </h3>
        
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          {subject && (
            <span className="text-[10px] font-medium text-white/50">{subject.code}</span>
          )}
          
          {(subject && (dateLabel || task.priority === 'HIGH')) && (
            <span className="text-[10px] text-white/20">·</span>
          )}

          {dateLabel && (
            <span className={`text-[10px] font-bold ${
              isOverdue ? 'text-red-400' : 
              isToday ? 'text-emerald-400' : 'text-white/50'
            }`}>
              {dateLabel}
            </span>
          )}

          {(dateLabel && task.priority === 'HIGH') && (
            <span className="text-[10px] text-white/20">·</span>
          )}

          {task.priority === 'HIGH' && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 rounded-sm">
              HIGH
            </span>
          )}
        </div>

        {task.estimated_minutes ? (
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${plannedMinutes >= task.estimated_minutes ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(100, (plannedMinutes / task.estimated_minutes) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] leading-4 font-medium text-white/40 [overflow-wrap:anywhere]">
              {timeUtils.formatDuration(plannedMinutes)} planned for {timeUtils.formatDuration(task.estimated_minutes)} estimate
            </span>
          </div>
        ) : null}
      </div>

      <div className="relative shrink-0">
        <button 
          ref={menuButtonRef}
          type="button"
          aria-label={`Actions for ${task.title}`}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors rounded-xl hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          </svg>
        </button>

        {menuOpen && (
          <>
            <button type="button" tabIndex={-1} aria-label="Close task actions" className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div id={menuId} role="group" aria-label={`Actions for ${task.title}`} className="absolute right-0 top-full mt-1 w-40 max-w-[calc(100vw-40px)] bg-[#1a1d24] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up" style={{ animationDuration: '0.15s' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit();
                }}
                className="w-full min-h-11 text-left px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5 transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full min-h-11 text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
