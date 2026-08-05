'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';
import { timeUtils } from '@/lib/timeUtils';
import { SUBJECTS } from '@/lib/config';

export function TaskItem({ task, onComplete, onEdit, onDelete }: { task: Task, onComplete: () => void, onEdit: () => void, onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isOverdue = timeUtils.isOverdue(task.due_at);
  const isToday = timeUtils.isToday(task.due_at);
  const isTomorrow = timeUtils.isTomorrow(task.due_at);
  const subject = SUBJECTS.find(s => s.code === task.subject_id);

  let dateLabel = '';
  if (isOverdue) dateLabel = 'Overdue';
  else if (isToday) dateLabel = 'Today';
  else if (isTomorrow) dateLabel = 'Tomorrow';
  else if (task.due_at) {
    const d = new Date(task.due_at);
    dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className={`relative glass-elevated rounded-2xl p-3 flex items-start gap-3 transition-all duration-300 ${
      isOverdue ? 'border-red-500/20 bg-red-500/5' : ''
    }`}>
      <button 
        onClick={onComplete}
        className="shrink-0 mt-0.5 w-6 h-6 rounded-md border-2 border-white/20 flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-transparent hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
      
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <h3 className="text-sm font-bold text-zinc-100 truncate pr-6">{task.title}</h3>
        
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
      </div>

      <div className="absolute top-3 right-3">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1 text-white/30 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-32 bg-[#1a1d24] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up" style={{ animationDuration: '0.15s' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit();
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
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
