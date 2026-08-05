'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SUBJECTS } from '@/lib/config';
import { TaskType, TaskPriority, Task } from '@/lib/types';
import { timeUtils } from '@/lib/timeUtils';
import { useTasks } from '../TaskProvider';
import { ManualPlanTaskSheet } from './ManualPlanTaskSheet';

export function AddTaskSheet({ onClose, taskToEdit }: { onClose: () => void, taskToEdit?: Task }) {
  const { addTask, updateTask } = useTasks();
  const [mounted, setMounted] = useState(false);
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [subjectId, setSubjectId] = useState<string>(taskToEdit?.subject_id || '');
  const [type, setType] = useState<TaskType>(taskToEdit?.type || 'STUDY');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'MEDIUM');
  
  let initialDueAt = '';
  if (taskToEdit?.due_at) {
    if (timeUtils.isToday(taskToEdit.due_at)) initialDueAt = 'today';
    else if (timeUtils.isTomorrow(taskToEdit.due_at)) initialDueAt = 'tomorrow';
    else initialDueAt = 'custom';
  }
  
  const [dueAtMode, setDueAtMode] = useState<string>(initialDueAt);
  const [customDate, setCustomDate] = useState(taskToEdit?.due_at ? new Date(taskToEdit.due_at).toISOString().split('T')[0] : '');
  const [customTime, setCustomTime] = useState(taskToEdit?.due_at && new Date(taskToEdit.due_at).toTimeString().substring(0, 5) !== '23:59' ? new Date(taskToEdit.due_at).toTimeString().substring(0, 5) : '');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(taskToEdit?.estimated_minutes || '');
  const [notes, setNotes] = useState(taskToEdit?.notes || '');

  const initialAdvanced = Boolean(taskToEdit && (taskToEdit.type !== 'STUDY' || taskToEdit.notes || taskToEdit.estimated_minutes || initialDueAt === 'custom' || customTime));
  const [isAdvanced, setIsAdvanced] = useState(initialAdvanced);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalDueAt = null;
    if (dueAtMode === 'today') {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      finalDueAt = d.toISOString();
    } else if (dueAtMode === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(23, 59, 59, 999);
      finalDueAt = d.toISOString();
    } else if (dueAtMode === 'custom' && customDate) {
      const d = new Date(customDate);
      if (customTime) {
        const [hours, minutes] = customTime.split(':').map(Number);
        d.setHours(hours, minutes, 0, 0);
      } else {
        d.setHours(23, 59, 59, 999);
      }
      finalDueAt = d.toISOString();
    }

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        title: title.trim(),
        subject_id: subjectId || null,
        type,
        priority,
        notes: notes.trim() || null,
        due_at: finalDueAt,
        estimated_minutes: typeof estimatedMinutes === 'number' ? estimatedMinutes : null
      });
    } else {
      addTask({
        title: title.trim(),
        subject_id: subjectId || null,
        type,
        priority,
        completed: false,
        completed_at: null,
        notes: notes.trim() || null,
        due_at: finalDueAt,
        estimated_minutes: typeof estimatedMinutes === 'number' ? estimatedMinutes : null
      });
    }

    onClose();
  };

  if (!mounted) return null;

  const content = (
    <div 
      className="fixed inset-0 z-[110] flex sm:items-center items-end justify-center animate-fade-in-up" 
      style={{ animationDuration: '0.2s' }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal / Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-[#0a0d14] sm:rounded-[28px] rounded-t-[28px] shadow-2xl sm:border border-t border-white/10 slide-up flex flex-col max-h-[90dvh] sm:max-h-[min(760px,85dvh)] min-w-0">
        
        {/* Mobile Drag Handle */}
        <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          {/* Header (Sticky) */}
          <div className="shrink-0 pt-8 sm:pt-6 px-6 pb-4 flex items-center justify-between border-b border-white/5">
            <h2 className="text-xl font-bold text-white tracking-tight">{taskToEdit ? 'Edit Task' : 'New Task'}</h2>
            <button type="button" onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/5">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 hide-scrollbar min-h-0">
            {/* Title */}
            <div>
              <input
                type="text"
                autoFocus
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b-2 border-white/10 px-0 py-2 text-lg text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            {/* Quick Controls */}
            <div className="flex flex-wrap gap-2">
              <button 
                type="button"
                onClick={() => setDueAtMode(dueAtMode === 'today' ? '' : 'today')}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors ${
                  dueAtMode === 'today' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                }`}
              >
                Today
              </button>
              <button 
                type="button"
                onClick={() => setDueAtMode(dueAtMode === 'tomorrow' ? '' : 'tomorrow')}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors ${
                  dueAtMode === 'tomorrow' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                }`}
              >
                Tomorrow
              </button>
              <button 
                type="button"
                onClick={() => setPriority(priority === 'HIGH' ? 'MEDIUM' : 'HIGH')}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors flex items-center gap-1.5 ${
                  priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                }`}
              >
                {priority === 'HIGH' && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 14a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0-4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0-4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                High Priority
              </button>
            </div>

            {/* Subject Select */}
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Subject (Optional)</label>
              <div className="relative">
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 appearance-none text-sm"
                >
                  <option value="">No Subject</option>
                  {SUBJECTS.map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setIsAdvanced(!isAdvanced)}
              className="w-full py-2 flex items-center justify-between text-xs font-bold text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest"
            >
              <span>{isAdvanced ? 'Hide Options' : 'More Options'}</span>
              <svg className={`w-4 h-4 transition-transform duration-300 ${isAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isAdvanced && (
              <div className="space-y-5 animate-fade-in-up">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Type</label>
                    <div className="relative">
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as TaskType)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 appearance-none text-sm"
                      >
                        <option value="STUDY">Study</option>
                        <option value="ASSIGNMENT">Assignment</option>
                        <option value="PRACTICE">Practice</option>
                        <option value="REVISION">Revision</option>
                        <option value="PROJECT">Project</option>
                        <option value="QUIZ_PREP">Quiz Prep</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/40">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Estimate (Mins)</label>
                    <input
                      type="number"
                      placeholder="e.g. 60"
                      min="1"
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 text-sm placeholder-white/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Due Date</label>
                    <input
                      type="date"
                      value={dueAtMode === 'custom' ? customDate : ''}
                      onChange={(e) => {
                        setDueAtMode('custom');
                        setCustomDate(e.target.value);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Time</label>
                    <input
                      type="time"
                      value={dueAtMode === 'custom' ? customTime : ''}
                      onChange={(e) => {
                        setDueAtMode('custom');
                        setCustomTime(e.target.value);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Notes</label>
                  <textarea
                    placeholder="Any extra details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 resize-none h-24 text-sm"
                  />
                </div>
              </div>
            )}
            
            {taskToEdit && (
              <div className="pt-4 mt-2 border-t border-white/5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Planning</label>
                <button
                  type="button"
                  onClick={() => setShowPlanSheet(true)}
                  className="w-full py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Plan Manual Work Session</span>
                </button>
              </div>
            )}
            
            <div className="h-4"></div>
          </div>

          {/* Footer (Sticky) */}
          <div className="shrink-0 p-6 pt-4 bg-[#0a0d14] sm:rounded-b-[28px] border-t border-white/5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full bg-emerald-500 text-[#07080b] font-bold text-sm tracking-wide py-4 rounded-xl disabled:opacity-50 transition-opacity active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {taskToEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
          
        </form>
      </div>
      {showPlanSheet && taskToEdit && (
        <ManualPlanTaskSheet task={taskToEdit} onClose={() => setShowPlanSheet(false)} />
      )}
    </div>
  );

  return createPortal(content, document.body);
}
