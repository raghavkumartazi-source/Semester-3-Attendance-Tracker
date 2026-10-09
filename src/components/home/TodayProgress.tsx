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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
          Today&apos;s Progress
        </h2>
        {totalItems > 0 && (
          <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase tabular-nums">
            {completedItems} / {totalItems} completed
          </span>
        )}
      </div>

      <motion.div 
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-surface rounded-[22px] p-5"
      >
        {activityFeed.length === 0 ? (
          <p className="text-sm font-medium text-white/40 text-center py-2">No progress yet today.</p>
        ) : (
          <ul className="space-y-2.5 mb-4">
            {activityFeed.slice(0, 5).map((item, i) => (
              <motion.li
                key={item.id} 
                initial={reduced ? false : { opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduced ? 0 : 0.08 * i, duration: reduced ? 0 : 0.3 }}
                className="flex items-center gap-3 min-h-11"
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
                  <button
                    type="button"
                    className="flex-1 min-h-11 text-left text-sm font-medium text-zinc-200 line-through decoration-emerald-500/30 hover:opacity-80"
                    aria-label={`Undo completion of ${item.task.title}`}
                    onClick={() => updateTask(item.task!.id, { completed: false, completed_at: null })}
                  >
                    {item.text}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-zinc-200">{item.text}</span>
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

        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mt-4 shadow-inner">
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
    </div>
  );
}
