'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '@/lib/types';
import { timeUtils } from '@/lib/timeUtils';
import { SUBJECTS } from '@/lib/config';
import { useWorkSessions } from '../WorkSessionProvider';
import './task-item.css';

const taskTypeLabels = {
  STUDY: 'Study', ASSIGNMENT: 'Assignment', PRACTICE: 'Practice',
  REVISION: 'Revision', PROJECT: 'Project', QUIZ_PREP: 'Quiz prep', OTHER: 'Personal',
};

export function TaskItem({ task, onComplete, onEdit, onDelete }: { task: Task, onComplete: () => void, onEdit: () => void, onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const closeForViewportChange = () => {
      setMenuOpen(false);
      menuButtonRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener('resize', closeForViewportChange);
    window.addEventListener('scroll', closeForViewportChange, true);
    return () => {
      window.removeEventListener('resize', closeForViewportChange);
      window.removeEventListener('scroll', closeForViewportChange, true);
    };
  }, [menuOpen]);
  const isOverdue = !task.completed && timeUtils.isOverdue(task.due_at);
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
  if (task.completed && task.completed_at) dateLabel = `Finished ${new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  else if (isOverdue) dateLabel = 'Overdue';
  else if (isToday) dateLabel = 'Today';
  else if (isTomorrow) dateLabel = 'Tomorrow';
  else if (task.due_at) {
    const d = new Date(task.due_at);
    dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className={`task-item${isOverdue ? ' is-overdue' : ''}${task.completed ? ' is-completed' : ''}`} onKeyDown={event => {
      if (event.key === 'Escape' && menuOpen) {
        event.stopPropagation();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }}>
      <button 
        type="button"
        onClick={onComplete}
        aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
        aria-pressed={task.completed}
        className="task-item-check"
      >
        <span>
          <svg aria-hidden="true" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      </button>
      
      <div className="task-item-content">
        <h3 className="task-item-heading">
          <button type="button" onClick={onEdit} aria-label={`Edit ${task.title}`}>{task.title}</button>
        </h3>
        <div className="task-item-meta">
          <span className="task-item-subject">{subject ? subject.code : taskTypeLabels[task.type] || 'Task'}</span>
          {dateLabel && <span className={`task-item-date${isOverdue ? ' is-overdue' : !task.completed && isToday ? ' is-today' : ''}`}>{dateLabel}</span>}
          {task.priority === 'HIGH' && !task.completed && <span className="task-item-priority"><svg aria-hidden="true" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.3}><path d="M6 2v5m0 2v.5" strokeLinecap="round" /></svg>High priority</span>}
        </div>

        {task.estimated_minutes && !task.completed ? (
          <div className="task-item-plan">
            <div className="task-item-plan-track" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(0, plannedMinutes / task.estimated_minutes * 100))}%` }} /></div>
            <span><strong>{timeUtils.formatDuration(plannedMinutes)}</strong> planned <i aria-hidden="true">/</i> {timeUtils.formatDuration(task.estimated_minutes)}</span>
          </div>
        ) : null}
      </div>

      <div className="task-item-actions">
        <button 
          ref={menuButtonRef}
          type="button"
          aria-label={`Actions for ${task.title}`}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (!menuOpen) {
              const bounds = e.currentTarget.getBoundingClientRect();
              const menuWidth = Math.min(160, window.innerWidth - 40);
              const menuHeight = 98;
              const dock = document.querySelector<HTMLElement>('.bottom-nav-inner');
              const visibleBottom = dock && window.getComputedStyle(dock).visibility !== 'hidden'
                ? Math.min(window.innerHeight - 12, dock.getBoundingClientRect().top - 12)
                : window.innerHeight - 12;
              setMenuPosition({
                top: bounds.bottom + menuHeight + 4 <= visibleBottom ? bounds.bottom + 4 : Math.max(12, bounds.top - menuHeight - 4),
                right: Math.max(20, Math.min(window.innerWidth - menuWidth - 20, window.innerWidth - bounds.right)),
              });
            }
            setMenuOpen(!menuOpen);
          }}
          className="task-item-menu-toggle"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          </svg>
        </button>

        {menuOpen && createPortal(
          <>
            <button type="button" tabIndex={-1} aria-label="Close task actions" className="fixed inset-0 z-40" onPointerDown={event => event.preventDefault()} onClick={() => {
              setMenuOpen(false);
              menuButtonRef.current?.focus({ preventScroll: true });
            }} />
            <div ref={menuRef} id={menuId} role="group" aria-label={`Actions for ${task.title}`} className="task-item-menu" style={menuPosition} onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
            }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  menuButtonRef.current?.focus({ preventScroll: true });
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  menuButtonRef.current?.focus({ preventScroll: true });
                  setMenuOpen(false);
                  onDelete();
                }}
                className="is-destructive"
              >
                Delete
              </button>
            </div>
          </>, document.body
        )}
      </div>
    </div>
  );
}
