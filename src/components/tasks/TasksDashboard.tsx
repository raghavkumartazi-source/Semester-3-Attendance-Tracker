'use client';

import { useState } from 'react';
import { useTasks } from '../TaskProvider';
import { Task } from '@/lib/types';
import { timeUtils } from '@/lib/timeUtils';
import { TaskItem } from './TaskItem';
import { AddTaskSheet } from '../home/AddTaskSheet';
import Dialog from '../Dialog';
import { LiquidButton } from '../ui/LiquidButton';
import './tasks-polish.css';

export default function TasksDashboard() {
  const { tasks, updateTask, deleteTask } = useTasks();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeTasks = tasks.filter(task => !task.deleted_at);
  const incompleteTasks = activeTasks.filter(task => !task.completed);
  const completedTasks = activeTasks.filter(task => task.completed).sort((a, b) =>
    new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime()
  );
  const completionRate = activeTasks.length ? Math.round(completedTasks.length / activeTasks.length * 100) : 0;
  const dueTodayCount = incompleteTasks.filter(task => timeUtils.isToday(task.due_at)).length;

  const overdue: Task[] = [];
  const today: Task[] = [];
  const tomorrow: Task[] = [];
  const thisWeek: Task[] = [];
  const later: Task[] = [];
  const noDate: Task[] = [];
  incompleteTasks.forEach(task => {
    if (!task.due_at) noDate.push(task);
    else if (timeUtils.isOverdue(task.due_at)) overdue.push(task);
    else if (timeUtils.isToday(task.due_at)) today.push(task);
    else if (timeUtils.isTomorrow(task.due_at)) tomorrow.push(task);
    else {
      const diffDays = Math.ceil((new Date(task.due_at).getTime() - new Date().getTime()) / 86400000);
      if (diffDays <= 7) thisWeek.push(task);
      else later.push(task);
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

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const openNewTask = () => { setTaskToEdit(undefined); setIsAddSheetOpen(true); };
  const editTask = (task: Task) => { setTaskToEdit(task); setIsAddSheetOpen(true); };

  return (
    <div className="tasks-workspace">
      <div className="tasks-page-header page-header">
        <div>
          <p className="tasks-eyebrow">Your workspace</p>
          <h1>Tasks</h1>
          <p className="page-subtitle">{dateLabel}</p>
        </div>
        <LiquidButton variant="starfield" onClick={openNewTask} aria-label="Add task" className="task-add-action">
          <svg aria-hidden="true" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M12 5v14m7-7H5" />
          </svg>
          <span>New task</span>
        </LiquidButton>
      </div>

      <section className="tasks-overview" aria-label="Task overview">
        <div className="tasks-overview-heading">
          <div>
            <span className="tasks-eyebrow">A little progress, every day</span>
            <h2>{incompleteTasks.length ? 'Make room for what matters.' : 'A little room to breathe.'}</h2>
          </div>
          <span className="tasks-completion-label">{completionRate}% done</span>
        </div>
        <div className="tasks-overview-track" role="progressbar" aria-label="All task completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionRate}>
          <span style={{ width: `${completionRate}%` }} />
        </div>
        <dl className="tasks-metrics">
          <div><dt>Open</dt><dd>{incompleteTasks.length}</dd></div>
          <div><dt>Due today</dt><dd>{dueTodayCount}</dd></div>
          <div><dt>Completed</dt><dd>{completedTasks.length}</dd></div>
        </dl>
      </section>

      <div className="tasks-list-toolbar">
        <p className="sr-only" role="status">{incompleteTasks.length} open tasks, {completedTasks.length} completed.</p>
        <div className="tasks-view-switch" aria-label="Task view">
          <button type="button" aria-pressed={!showCompleted} onClick={() => setShowCompleted(false)}>
            Open <span>{incompleteTasks.length}</span>
          </button>
          <button type="button" aria-pressed={showCompleted} onClick={() => setShowCompleted(true)}>
            Completed <span>{completedTasks.length}</span>
          </button>
        </div>
        <span className="tasks-list-hint">{showCompleted ? 'Most recent first' : 'Organised by due date'}</span>
      </div>

      <div className="tasks-view-content" key={showCompleted ? 'completed' : 'open'}>
        {showCompleted ? (
          completedTasks.length ? (
            <TaskGroup title="Completed work" description="Every checked box counts." tasks={completedTasks} onUpdate={updateTask} onEdit={editTask} onDelete={setTaskToDelete} />
          ) : (
            <TaskEmptyState completed onAdd={openNewTask} />
          )
        ) : incompleteTasks.length === 0 ? (
          <TaskEmptyState allDone={completedTasks.length > 0} onAdd={openNewTask} />
        ) : (
          <div className="tasks-groups">
            {overdue.length > 0 && <TaskGroup title="Overdue" description="Pick one to move forward." tasks={overdue} urgent onUpdate={updateTask} onEdit={editTask} onDelete={setTaskToDelete} />}
            {today.length > 0 && <TaskGroup title="Today" description="Your next small wins." tasks={today} onUpdate={updateTask} onEdit={editTask} onDelete={setTaskToDelete} />}
            {tomorrow.length > 0 && <TaskGroup title="Tomorrow" tasks={tomorrow} onUpdate={updateTask} onEdit={editTask} onDelete={setTaskToDelete} />}
            {thisWeek.length > 0 && <TaskGroup title="This week" tasks={thisWeek} onUpdate={updateTask} onEdit={editTask} onDelete={setTaskToDelete} />}
            {later.length > 0 && <TaskGroup title="Later" tasks={later} onUpdate={updateTask} onEdit={editTask} onDelete={setTaskToDelete} />}
            {noDate.length > 0 && <TaskGroup title="Someday" description="Ideas without a deadline." tasks={noDate} onUpdate={updateTask} onEdit={editTask} onDelete={setTaskToDelete} />}
          </div>
        )}
      </div>

      {isAddSheetOpen && <AddTaskSheet onClose={() => { setIsAddSheetOpen(false); setTaskToEdit(undefined); }} taskToEdit={taskToEdit} />}

      {taskToDelete && (
        <Dialog label="Delete task" onClose={() => setTaskToDelete(undefined)}>
          <div className="task-delete-dialog">
            <span className="tasks-eyebrow">Task actions</span>
            <h3>Delete this task?</h3>
            <p>&ldquo;{taskToDelete.title}&rdquo; will be removed from your list.</p>
            <div className="task-delete-actions">
              <button type="button" onClick={() => setTaskToDelete(undefined)}>Keep task</button>
              <button type="button" className="is-destructive" onClick={() => { deleteTask(taskToDelete.id); setTaskToDelete(undefined); }}>Delete task</button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function TaskEmptyState({ completed = false, allDone = false, onAdd }: { completed?: boolean; allDone?: boolean; onAdd: () => void }) {
  return (
    <div className="tasks-empty">
      <div className="tasks-empty-icon" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d={allDone ? 'M5 12l4 4L19 6' : 'M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M9 2h6v4H9V2zm-1 9h8m-8 5h5'} />
        </svg>
      </div>
      <h2>{completed ? 'Your wins will live here.' : allDone ? 'All caught up.' : 'A clear list. A fresh start.'}</h2>
      <p>{completed ? 'Finish a task and come back to see your progress.' : allDone ? 'You’ve finished everything on your list. Enjoy the breathing room.' : 'Add an assignment, a study goal or one thing you want to finish.'}</p>
      {!completed && <LiquidButton onClick={onAdd}>{allDone ? 'Add another task' : 'Add your first task'}</LiquidButton>}
    </div>
  );
}

function TaskGroup({ title, description, tasks, urgent = false, onUpdate, onEdit, onDelete }: {
  title: string;
  description?: string;
  tasks: Task[];
  urgent?: boolean;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  return (
    <section className={`task-group${urgent ? ' is-urgent' : ''}`} aria-label={`${title} tasks`}>
      <div className="task-group-heading">
        <div><h2>{title} <span>{tasks.length}</span></h2>{description && <p>{description}</p>}</div>
        {urgent && <span className="task-group-alert"><i />Needs attention</span>}
      </div>
      <div className="task-group-list">
        {tasks.map(task => <TaskItem key={task.id} task={task}
          onComplete={() => onUpdate(task.id, { completed: !task.completed, completed_at: task.completed ? null : new Date().toISOString() })}
          onEdit={() => onEdit(task)} onDelete={() => onDelete(task)} />)}
      </div>
    </section>
  );
}
