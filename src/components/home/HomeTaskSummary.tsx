'use client';

import { useTasks } from '../TaskProvider';
import { timeUtils } from '@/lib/timeUtils';
import Link from 'next/link';
import { TaskItem } from '../tasks/TaskItem';
import { useState } from 'react';
import { AddTaskSheet } from './AddTaskSheet';
import { Task } from '@/lib/types';

export function HomeTaskSummary() {
  const { tasks, updateTask, deleteTask } = useTasks();
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined);

  const incompleteTasks = tasks.filter(t => !t.completed);

  if (incompleteTasks.length === 0) {
    return null;
  }

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

  const mostUrgentTask = sortedTasks[0];
  const overdueCount = incompleteTasks.filter(t => timeUtils.isOverdue(t.due_at)).length;
  const highPriorityCount = incompleteTasks.filter(t => t.priority === 'HIGH').length;

  let subtitle = `${incompleteTasks.length} task${incompleteTasks.length !== 1 ? 's' : ''} remaining`;
  if (overdueCount > 0) {
    subtitle += ` · ${overdueCount} overdue`;
  } else if (highPriorityCount > 0) {
    subtitle += ` · ${highPriorityCount} high priority`;
  }

  return (
    <div className="mb-6 animate-fade-in-up stagger-3">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
          {subtitle}
        </h2>
        <Link 
          href="/tasks"
          className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider active:scale-95 transition-transform"
        >
          View Tasks →
        </Link>
      </div>

      <div className="space-y-2">
        <TaskItem 
          task={mostUrgentTask} 
          onComplete={() => updateTask(mostUrgentTask.id, { completed: true, completed_at: new Date().toISOString() })} 
          onEdit={() => {
            setTaskToEdit(mostUrgentTask);
            setIsAddSheetOpen(true);
          }}
          onDelete={() => setTaskToDelete(mostUrgentTask)}
        />
      </div>

      {isAddSheetOpen && (
        <AddTaskSheet 
          onClose={() => {
            setIsAddSheetOpen(false);
            setTaskToEdit(undefined);
          }} 
          taskToEdit={taskToEdit} 
        />
      )}

      {taskToDelete && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTaskToDelete(undefined)} />
          <div className="relative w-full max-w-sm bg-[#0a0d14] sm:rounded-[28px] rounded-t-[28px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl border border-white/10 slide-up">
            <h3 className="text-lg font-bold text-white mb-2">Delete Task?</h3>
            <p className="text-sm text-white/60 mb-6">Are you sure you want to delete &quot;{taskToDelete.title}&quot;?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setTaskToDelete(undefined)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteTask(taskToDelete.id);
                  setTaskToDelete(undefined);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
