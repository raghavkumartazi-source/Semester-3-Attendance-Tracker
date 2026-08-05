'use client';

import { useState } from 'react';
import { useTasks } from '../TaskProvider';
import { Task } from '@/lib/types';
import { timeUtils } from '@/lib/timeUtils';
import { TaskItem } from './TaskItem';
import { AddTaskSheet } from '../home/AddTaskSheet';

export default function TasksDashboard() {
  const { tasks, updateTask, deleteTask } = useTasks();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined);
  const [showCompleted, setShowCompleted] = useState(false);

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed).sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

  const overdue: Task[] = [];
  const today: Task[] = [];
  const tomorrow: Task[] = [];
  const thisWeek: Task[] = [];
  const later: Task[] = [];
  const noDate: Task[] = [];

  incompleteTasks.forEach(task => {
    if (!task.due_at) {
      noDate.push(task);
    } else if (timeUtils.isOverdue(task.due_at)) {
      overdue.push(task);
    } else if (timeUtils.isToday(task.due_at)) {
      today.push(task);
    } else if (timeUtils.isTomorrow(task.due_at)) {
      tomorrow.push(task);
    } else {
      const d = new Date(task.due_at);
      const now = new Date();
      const diffTime = d.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        thisWeek.push(task);
      } else {
        later.push(task);
      }
    }
  });

  const sortByPriority = (a: Task, b: Task) => {
    if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
    if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  };

  overdue.sort(sortByPriority);
  today.sort(sortByPriority);
  tomorrow.sort(sortByPriority);
  thisWeek.sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());
  later.sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());
  noDate.sort(sortByPriority);

  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="max-w-lg mx-auto pb-24 relative z-0 px-4 pt-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tasks</h1>
          <p className="text-[13px] text-white/50 font-medium mt-1">{todayDateStr}</p>
        </div>
        <button 
          onClick={() => {
            setTaskToEdit(undefined);
            setIsAddSheetOpen(true);
          }}
          className="w-10 h-10 rounded-[14px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 active:scale-90 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Overview */}
      <div className="glass-surface rounded-[20px] p-5 mb-8 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-emerald-500/50" 
            style={{ width: `${tasks.length === 0 ? 0 : (completedTasks.length / tasks.length) * 100}%` }}
          />
        </div>
        <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Today Overview</h2>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-white">{incompleteTasks.length}</span>
          <span className="text-sm font-medium text-white/60 mb-1">remaining</span>
          {overdue.length > 0 && (
            <>
              <span className="text-sm font-medium text-white/30 mb-1">·</span>
              <span className="text-sm font-medium text-red-400 mb-1">{overdue.length} overdue</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {overdue.length > 0 && (
          <TaskGroup 
            title="Overdue" 
            tasks={overdue} 
            count={overdue.length} 
            badgeColor="bg-red-500/20 text-red-400"
            onUpdate={updateTask} 
            onEdit={(t) => { setTaskToEdit(t); setIsAddSheetOpen(true); }} 
            onDelete={setTaskToDelete} 
          />
        )}
        
        {today.length > 0 && (
          <TaskGroup 
            title="Today" 
            tasks={today} 
            onUpdate={updateTask} 
            onEdit={(t) => { setTaskToEdit(t); setIsAddSheetOpen(true); }} 
            onDelete={setTaskToDelete} 
          />
        )}

        {(tomorrow.length > 0 || thisWeek.length > 0 || later.length > 0 || noDate.length > 0) && (
          <div className="pt-4 border-t border-white/5 space-y-6">
            <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest px-1">Upcoming</h2>
            {tomorrow.length > 0 && (
              <TaskGroup 
                title="Tomorrow" 
                tasks={tomorrow} 
                onUpdate={updateTask} 
                onEdit={(t) => { setTaskToEdit(t); setIsAddSheetOpen(true); }} 
                onDelete={setTaskToDelete} 
              />
            )}
            {thisWeek.length > 0 && (
              <TaskGroup 
                title="This Week" 
                tasks={thisWeek} 
                onUpdate={updateTask} 
                onEdit={(t) => { setTaskToEdit(t); setIsAddSheetOpen(true); }} 
                onDelete={setTaskToDelete} 
              />
            )}
            {later.length > 0 && (
              <TaskGroup 
                title="Later" 
                tasks={later} 
                onUpdate={updateTask} 
                onEdit={(t) => { setTaskToEdit(t); setIsAddSheetOpen(true); }} 
                onDelete={setTaskToDelete} 
              />
            )}
            {noDate.length > 0 && (
              <TaskGroup 
                title="Someday" 
                tasks={noDate} 
                onUpdate={updateTask} 
                onEdit={(t) => { setTaskToEdit(t); setIsAddSheetOpen(true); }} 
                onDelete={setTaskToDelete} 
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-12 pt-6 border-t border-white/5 flex justify-center">
        <button 
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-xs font-bold text-white/40 uppercase tracking-widest hover:text-white/60 transition-colors"
        >
          {showCompleted ? 'Hide Completed Work' : 'View Completed Work'}
        </button>
      </div>

      {showCompleted && completedTasks.length > 0 && (
        <div className="mt-6 space-y-2 opacity-50">
          {completedTasks.map(task => (
             <TaskItem 
               key={task.id} 
               task={task} 
               onComplete={() => updateTask(task.id, { completed: false, completed_at: null })} 
               onEdit={() => {}} 
               onDelete={() => setTaskToDelete(task)}
             />
          ))}
        </div>
      )}

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

function TaskGroup({ 
  title, 
  tasks, 
  count, 
  badgeColor,
  onUpdate, 
  onEdit, 
  onDelete 
}: { 
  title: string, 
  tasks: Task[], 
  count?: number,
  badgeColor?: string,
  onUpdate: (id: string, updates: Partial<Task>) => void,
  onEdit: (t: Task) => void,
  onDelete: (t: Task) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3 px-1">
        <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">{title}</h3>
        {count !== undefined && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${badgeColor || 'bg-white/10 text-white/60'}`}>
            {count}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onComplete={() => onUpdate(task.id, { completed: true, completed_at: new Date().toISOString() })} 
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task)}
          />
        ))}
      </div>
    </div>
  );
}
