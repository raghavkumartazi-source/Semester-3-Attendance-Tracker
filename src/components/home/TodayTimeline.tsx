'use client';

import { useState, useEffect } from 'react';
import { useAttendance } from '../AttendanceProvider';
import { useWorkSessions } from '../WorkSessionProvider';
import { useTasks } from '../TaskProvider';
import { SUBJECTS, DAY_NAMES } from '@/lib/config';
import { timeUtils } from '@/lib/timeUtils';
import AttendanceButtons from '../AttendanceButtons';
import { Session, WorkSession, Task } from '@/lib/types';
import { generateSmartPlan, SuggestedPlan } from '@/lib/plannerAlgorithm';
import { SmartPlanReviewSheet } from './SmartPlanReviewSheet';

type TimelineEvent = {
  type: 'CLASS' | 'WORK';
  id: string;
  startString: string;
  startTotal: number;
  endTotal: number;
  classData?: Session;
  workData?: WorkSession;
  taskData?: Task;
};

export function TodayTimeline() {
  const { sessions: classSessions, updateSessionStatus } = useAttendance();
  const { sessions: workSessions, updateSession: updateWorkSession } = useWorkSessions();
  const { tasks } = useTasks();
  
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [dayName, setDayName] = useState('');
  
  const [planToReview, setPlanToReview] = useState<SuggestedPlan | null>(null);

  useEffect(() => {
    // Initial setup
    const today = new Date().getDay();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDayName(DAY_NAMES[today] || '');

    const update = () => {
      setCurrentMinutes(timeUtils.getCurrentMinutes());
      
      const d = new Date();
      const localDate = timeUtils.getLocalISODate(d);
      
      const classEvents: TimelineEvent[] = classSessions
        .filter(s => s.date === localDate)
        .map(s => {
          const [h, m] = s.startTime.split(':').map(Number);
          const startTotal = h * 60 + m;
          const endTotal = startTotal + (s.classType === 'Lab' ? 120 : 60);
          return {
            type: 'CLASS',
            id: `class-${s.id}`,
            startString: s.startTime,
            startTotal,
            endTotal,
            classData: s
          };
        });

      const workEvents: TimelineEvent[] = workSessions
        .filter(s => s.planned_start.startsWith(localDate) && !s.deleted_at && s.status !== 'CANCELLED')
        .map(s => {
          const start = new Date(s.planned_start);
          const end = new Date(s.planned_end);
          const startTotal = start.getHours() * 60 + start.getMinutes();
          const endTotal = end.getHours() * 60 + end.getMinutes();
          return {
            type: 'WORK',
            id: `work-${s.id}`,
            startString: start.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            startTotal,
            endTotal,
            workData: s,
            taskData: tasks.find(t => t.id === s.task_id)
          };
        });
      
      const combined = [...classEvents, ...workEvents].sort((a, b) => a.startTotal - b.startTotal);
      setTimelineEvents(combined);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [classSessions, workSessions, tasks]);

  return (
    <div className="mb-6 animate-fade-in-up stagger-2">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
          Today&apos;s Timeline
        </h2>
        <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">{dayName}</span>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="glass-surface rounded-[18px] p-6 text-center">
          <p className="text-sm font-medium text-white/40">No timeline events today</p>
        </div>
      ) : (
        <div className="space-y-3 relative">
          <div className="absolute left-[20px] top-4 bottom-4 w-px bg-white/10 z-0" />
          
          {timelineEvents.map((event, i) => {
            const isNow = currentMinutes >= event.startTotal && currentMinutes <= event.endTotal;
            const isPast = currentMinutes > event.endTotal;

            if (event.type === 'CLASS' && event.classData) {
              const session = event.classData;
              const subject = SUBJECTS.find(s => s.code === session.subjectCode);

              return (
                <div key={event.id} className={`animate-slide-in-right stagger-${Math.min(i + 3, 8)} flex items-center relative z-10 ${isPast ? 'opacity-60' : ''}`}>
                  <div className={`w-[40px] flex justify-center shrink-0`}>
                    <div className={`w-2.5 h-2.5 rounded-full outline outline-4 outline-[#07080b] ${
                      isNow ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]' :
                      session.status === 'PRESENT' ? 'bg-emerald-500' :
                      session.status === 'ABSENT' ? 'bg-amber-500' :
                      session.status === 'CANCELLED' ? 'bg-zinc-500' :
                      'bg-white/20'
                    }`} />
                  </div>
                  
                  <div className={`flex-1 glass-elevated rounded-[18px] px-4 py-3 relative overflow-hidden transition-all duration-300 ${isNow ? 'border-red-500/20 bg-red-500/5' : ''}`}>
                    {isNow && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-20" />}
                    <div className="flex items-center justify-between z-10 relative">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-200 tracking-wide drop-shadow-sm">{session.subjectCode}</span>
                          {isNow && <span className="text-[9px] rounded-full border px-1.5 py-0.5 font-bold bg-red-500/20 text-red-300 border-red-500/30">NOW</span>}
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-white/50 truncate">{event.startString} · {subject?.name}</p>
                      </div>
                      <div className="shrink-0 ml-3">
                        <AttendanceButtons status={session.status} onMark={(status) => updateSessionStatus(session.id, status)} compact />
                      </div>
                    </div>
                  </div>
                </div>
              );
            } else if (event.type === 'WORK' && event.workData && event.taskData) {
              const session = event.workData;
              const task = event.taskData;
              const duration = event.endTotal - event.startTotal;
              
              return (
                <div key={event.id} className={`animate-slide-in-right stagger-${Math.min(i + 3, 8)} flex items-center relative z-10 ${isPast ? 'opacity-60' : ''}`}>
                  <div className={`w-[40px] flex justify-center shrink-0`}>
                    <div className={`w-2.5 h-2.5 rounded-full outline outline-4 outline-[#07080b] ${
                      isNow ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]' :
                      session.status === 'COMPLETED' ? 'bg-indigo-400' :
                      session.status === 'CANCELLED' ? 'bg-white/10' :
                      'bg-indigo-500/50'
                    }`} />
                  </div>
                  
                  <div className={`flex-1 glass-surface rounded-[18px] px-4 py-3 relative overflow-hidden transition-all duration-300 border border-indigo-500/10 ${isNow ? 'border-indigo-500/30 bg-indigo-500/5' : ''}`}>
                    {isNow && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] z-20" />}
                    <div className="flex items-center justify-between z-10 relative">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-300 tracking-wide drop-shadow-sm truncate pr-2">{task.title}</span>
                          {isNow && <span className="text-[9px] rounded-full border px-1.5 py-0.5 font-bold bg-indigo-500/20 text-indigo-300 border-indigo-500/30">NOW</span>}
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-indigo-200/50 truncate">
                          {event.startString} · Planned Work ({duration}m)
                        </p>
                      </div>
                      <div className="shrink-0 ml-3 flex gap-1">
                        {session.status !== 'COMPLETED' && (
                          <button onClick={() => updateWorkSession(session.id, { status: 'COMPLETED' })} className="p-1.5 rounded-md text-white/30 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </button>
                        )}
                        {session.status !== 'CANCELLED' && (
                          <button onClick={() => updateWorkSession(session.id, { status: 'CANCELLED' })} className="p-1.5 rounded-md text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
      
      <div className="mt-4">
        <button 
          onClick={() => {
            const plan = generateSmartPlan(tasks, classSessions, workSessions);
            setPlanToReview(plan);
          }}
          className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <span>✨ Smart Plan My Workload</span>
        </button>
      </div>

      {planToReview && (
        <SmartPlanReviewSheet 
          plan={planToReview} 
          tasks={tasks}
          onClose={() => setPlanToReview(null)} 
        />
      )}
    </div>
  );
}
