'use client';

import { useTasks } from '../TaskProvider';
import { useAttendance } from '../AttendanceProvider';
import { timeUtils } from '@/lib/timeUtils';

export function TodayProgress() {
  const { tasks, updateTask } = useTasks();
  const { sessions } = useAttendance();

  const completedTasksToday = tasks.filter(t => t.completed && timeUtils.isToday(t.completed_at));
  
  const d = new Date();
  const localDate = d.toLocaleDateString('en-CA'); 
  const todaySessions = sessions.filter(s => s.date === localDate && s.status !== 'CANCELLED');
  const presentSessions = todaySessions.filter(s => s.status === 'PRESENT');
  const absentSessions = todaySessions.filter(s => s.status === 'ABSENT');

  const activityFeed: Array<{id: string, text: string, time: number, type: 'task' | 'class', task?: any}> = [
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
      time: s.updatedAt || new Date().getTime(),
      type: 'class' as const
    }))
  ].sort((a, b) => b.time - a.time);

  const tasksDueToday = tasks.filter(t => !t.completed && timeUtils.isToday(t.due_at));
  
  // Total denominator includes today's classes + incomplete tasks due today + tasks completed today
  const totalItems = todaySessions.length + tasksDueToday.length + completedTasksToday.length;
  // Completed items includes PRESENT classes + ABSENT classes (processed for scheduling but not in the activity feed) + completed tasks
  const completedItems = presentSessions.length + absentSessions.length + completedTasksToday.length;
  
  const percentage = totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

  return (
    <div className="mb-6 animate-fade-in-up stagger-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
          Today&apos;s Progress
        </h2>
        {totalItems > 0 && (
          <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">
            {completedItems} / {totalItems} COMPLETED
          </span>
        )}
      </div>

      <div className="glass-surface rounded-[22px] p-5">
        {activityFeed.length === 0 ? (
          <p className="text-sm font-medium text-white/40 text-center py-2">No progress yet today.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {activityFeed.slice(0, 5).map(item => (
              <div 
                key={item.id} 
                className={`flex items-center gap-3 ${item.type === 'task' ? 'cursor-pointer hover:opacity-80 active:scale-[0.98] transition-all' : ''}`}
                onClick={() => {
                  if (item.type === 'task' && item.task) {
                    updateTask(item.task.id, { completed: false, completed_at: null });
                  }
                }}
                title={item.type === 'task' ? 'Tap to uncomplete' : undefined}
              >
                <span className="text-emerald-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-zinc-200 line-through decoration-emerald-500/30">{item.text}</span>
              </div>
            ))}
            {activityFeed.length > 5 && (
              <p className="text-[11px] font-bold text-white/30 pl-7 uppercase tracking-widest">
                + {activityFeed.length - 5} more
              </p>
            )}
          </div>
        )}

        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mt-4">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
