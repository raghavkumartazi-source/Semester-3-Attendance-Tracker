'use client';

import { useState } from 'react';
import { SUBJECTS } from '@/lib/config';
import { TaskType, TaskPriority } from '@/lib/types';
import { useTasks } from '../TaskProvider';

export function AddTaskSheet({ onClose }: { onClose: () => void }) {
  const { addTask } = useTasks();
  
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [type, setType] = useState<TaskType>('STUDY');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueAt, setDueAt] = useState<string>('');

  const [isAdvanced, setIsAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalDueAt = null;
    if (dueAt === 'today') {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      finalDueAt = d.toISOString();
    } else if (dueAt === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(23, 59, 59, 999);
      finalDueAt = d.toISOString();
    }

    addTask({
      title: title.trim(),
      subject_id: subjectId || null,
      type,
      priority,
      completed: false,
      completed_at: null,
      notes: null,
      due_at: finalDueAt
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#0a0d14] sm:rounded-[28px] rounded-t-[28px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl border border-white/10 slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">New Task</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              autoFocus
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button 
              type="button"
              onClick={() => setDueAt(dueAt === 'today' ? '' : 'today')}
              className={`shrink-0 px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-colors ${
                dueAt === 'today' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50 border border-white/5'
              }`}
            >
              Today
            </button>
            <button 
              type="button"
              onClick={() => setDueAt(dueAt === 'tomorrow' ? '' : 'tomorrow')}
              className={`shrink-0 px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-colors ${
                dueAt === 'tomorrow' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50 border border-white/5'
              }`}
            >
              Tomorrow
            </button>
            <button 
              type="button"
              onClick={() => setPriority(priority === 'HIGH' ? 'MEDIUM' : 'HIGH')}
              className={`shrink-0 px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-colors ${
                priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-white/50 border border-white/5'
              }`}
            >
              High Priority
            </button>
            <button 
              type="button"
              onClick={() => setIsAdvanced(!isAdvanced)}
              className={`shrink-0 px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-colors ${
                isAdvanced ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40'
              }`}
            >
              More...
            </button>
          </div>

          {isAdvanced && (
            <div className="space-y-4 pt-2 animate-fade-in-up">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Subject (Optional)</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                >
                  <option value="">None</option>
                  {SUBJECTS.map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TaskType)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                  >
                    <option value="STUDY">Study</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="PRACTICE">Practice</option>
                    <option value="REVISION">Revision</option>
                    <option value="PROJECT">Project</option>
                    <option value="QUIZ_PREP">Quiz Prep</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full mt-4 bg-emerald-500 text-[#07080b] font-bold text-sm tracking-wide py-4 rounded-xl disabled:opacity-50 transition-opacity active:scale-[0.98]"
          >
            Save Task
          </button>
        </form>
      </div>
    </div>
  );
}
