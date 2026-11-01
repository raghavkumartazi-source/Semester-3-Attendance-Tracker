'use client';

import { useTasks } from '../TaskProvider';
import { useAttendance } from '../AttendanceProvider';
import { timeUtils } from '@/lib/timeUtils';
import { Task } from '@/lib/types';
import { motion, useReducedMotion } from 'framer-motion';

export function TodayProgress() {
  const { tasks, updateTask } = useTasks();
  const { sessions } = useAttendance();

  const reduced = useReducedMotion();
  const completedTasksToday = tasks.filter(t => !t.deleted_at && t.completed && timeUtils.isToday(t.completed_at));
  
  const d = new Date();
  const localDate = timeUtils.getLocalISODate(d);
  const todaySessions = sessions.filter(s => s.date === localDate && s.status !== 'CANCELLED');
  const presentSessions = todaySessions.filter(s => s.status === 'PRESENT');
  const absentSessions = todaySessions.filter(s => s.status === 'ABSENT');

  const activityFeed: Array<{id: string, text: string, time: number, type: 'task' | 'class', task?: Task}> = [
    ...completedTasksToday.map(t => ({
      id: t.id,
      text: `Completed ${t.title}`,
      time: new Date(t.completed_at!).getTime(),
      type: 'task' as const,
      task: t
    })),
    ...presentSessions.map(s => ({
      id: s.id,
      text: `Attended ${s.subjectCode}`,
      time: s.updatedAt ? new Date(s.updatedAt).getTime() : d.getTime(),
      type: 'class' as const
    }))
  ].sort((a, b) => b.time - a.time);

  const tasksDueToday = tasks.filter(t => !t.deleted_at && !t.completed && timeUtils.isToday(t.due_at));
  
  const totalItems = todaySessions.length + tasksDueToday.length + completedTasksToday.length;
  const completedItems = presentSessions.length + absentSessions.length + completedTasksToday.length;
  
  const percentage = totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

  return (
    <section className="daily-progress">
      <div className="section-heading">
        <h2>Today&apos;s progress</h2>
        {totalItems > 0 && (
          <span className="progress-count">
            {completedItems} <span>/ {totalItems} done</span>
          </span>
        )}
      </div>

      <motion.div 
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="daily-progress-card"
      >
        {activityFeed.length === 0 ? (
          <div className="progress-empty"><span className="progress-empty-icon" aria-hidden="true">✓</span><div><strong>Your first win is waiting.</strong><p>Mark a class or finish a task to start.</p></div></div>
        ) : (
          <ul className="space-y-2.5 mb-4">
            {activityFeed.slice(0, 5).map((item, i) => (
              <motion.li
                key={item.id} 
                initial={reduced ? false : { opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduced ? 0 : 0.08 * i, duration: reduced ? 0 : 0.3 }}
                className="progress-activity"
              >
                <motion.span 
                  className="text-emerald-400 shrink-0"
                  initial={reduced ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: reduced ? 0 : 0.1 * i, duration: reduced ? 0 : undefined }}
                  aria-hidden="true"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.span>
                {item.type === 'task' && item.task ? (
                  <><span className="progress-activity-text">{item.text}</span><button
                    type="button"
                    className="progress-undo"
                    aria-label={`Undo completion of ${item.task.title}`}
                    onClick={() => updateTask(item.task!.id, { completed: false, completed_at: null })}
                  >
                    Undo
                  </button></>
                ) : (
                  <span className="progress-activity-text">{item.text}</span>
                )}
              </motion.li>
            ))}
            {activityFeed.length > 5 && (
              <li className="text-[11px] font-bold text-white/30 pl-7 uppercase tracking-widest">
                + {activityFeed.length - 5} more
              </li>
            )}
          </ul>
        )}

        <div className="daily-progress-track" role="progressbar" aria-label="Today’s completed classes and tasks" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentage)}>
          <motion.div 
            className="h-full rounded-full relative progress-glow"
            style={{
              background: 'linear-gradient(90deg, #b78396, #edbbad, #f6d0bc)',
            }}
            initial={reduced ? false : { width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: reduced ? 0 : .8, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : .15 }}
          />
        </div>
      </motion.div>
    </section>
  );
}
