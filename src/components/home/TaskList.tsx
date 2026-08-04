'use client';

import { useState } from 'react';
import { useTasks } from '../TaskProvider';
import { Task } from '@/lib/types';
import { timeUtils } from '@/lib/timeUtils';
import { SUBJECTS } from '@/lib/config';
import { AddTaskSheet } from './AddTaskSheet';

export function TaskList() {
  const { tasks, updateTask } = useTasks();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const incompleteTasks = tasks.filter(t => !t.completed);

  const sortedTasks = [...incompleteTasks].sort((a, b) => {
    const getRank = (t: Task) => {
      if (timeUtils.isOverdue(t.due_at)) return 1;
      if (timeUtils.isToday(t.due_at)) return 2;
      if (t.priority === 'HIGH') return 3;
      if (timeUtils.isTomorrow(t.due_at)) return 4;
      if (t.due_at) return 5;
      return 6;
    };
    
    const rankA = getRank(a);
    const rankB = getRank(b);

    if (rankA !== rankB) return rankA - rankB;

    if (a.due_at && b.due_at) {
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    }
    
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className="mb-6 animate-fade-in-up stagger-3">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
          To Do
        </h2>
        <button 
          onClick={() => setIsAddSheetOpen(true)}
          className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider active:scale-95 transition-transform"
        >
          + Add Task
        </button>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="glass-surface rounded-[18px] p-6 text-center">
          <p className="text-sm font-medium text-white/40">Nothing on your list.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onComplete={() => updateTask(task.id, { completed: true, completed_at: new Date().toISOString() })} 
            />
          ))}
        </div>
      )}

      {isAddSheetOpen && (
        <AddTaskSheet onClose={() => setIsAddSheetOpen(false)} />
      )}
    </div>
  );
}

function TaskItem({ task, onComplete }: { task: Task, onComplete: () => void }) {
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
    <div className={`glass-elevated rounded-2xl p-3 flex items-start gap-3 transition-all duration-300 ${
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
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-zinc-100 truncate">{task.title}</h3>
        
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
    </div>
  );
}
