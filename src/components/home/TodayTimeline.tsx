'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRightIcon, CalendarDaysIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAttendance } from '../AttendanceProvider';
import { useWorkSessions } from '../WorkSessionProvider';
import { useTasks } from '../TaskProvider';
import { SUBJECTS } from '@/lib/config';
import { timeUtils } from '@/lib/timeUtils';
import AttendanceButtons from '../AttendanceButtons';
import { generateSmartPlan, SuggestedPlan } from '@/lib/plannerAlgorithm';
import { SmartPlanReviewSheet } from './SmartPlanReviewSheet';

const statusLabels = { PRESENT: 'Present', ABSENT: 'Absent', CANCELLED: 'Cancelled', UNMARKED: 'Mark attendance' };
const minutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };

export function TodayTimeline() {
  const { sessions: classes, updateSessionStatus } = useAttendance();
  const { sessions: work, updateSession } = useWorkSessions();
  const { tasks } = useTasks();
  const [clock, setClock] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const [plan, setPlan] = useState<SuggestedPlan | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const today = timeUtils.getLocalISODate(clock);
  const displayedDate = selectedDate ?? today;
  const weekStart = new Date(clock);
  weekStart.setDate(clock.getDate() - (clock.getDay() + 6) % 7);
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return { date: timeUtils.getLocalISODate(day), number: day.getDate(), label: day.toLocaleDateString('en-GB', { weekday: 'short' }), full: day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) };
  });
  const current = clock.getHours() * 60 + clock.getMinutes();
  const events = [
    ...classes.filter(s => s.date === displayedDate).map(s => ({ id: s.id, start: minutes(s.startTime), end: minutes(s.endTime), time: `${s.startTime} – ${s.endTime}`, classSession: s, workSession: null })),
    ...work.filter(s => timeUtils.getLocalISODate(new Date(s.planned_start)) === displayedDate && !s.deleted_at && s.status !== 'CANCELLED').map(s => {
      const start = new Date(s.planned_start), end = new Date(s.planned_end);
      return { id: s.id, start: start.getHours() * 60 + start.getMinutes(), end: end.getHours() * 60 + end.getMinutes(), time: `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, classSession: null, workSession: s };
    })
  ].sort((a, b) => a.start - b.start);

  return (
    <section>
      <div className="section-heading"><h2>{displayedDate === today ? "Today’s schedule" : new Date(`${displayedDate}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</h2><Link href="/schedule" className="section-link">Full week<ArrowUpRightIcon aria-hidden="true" /></Link></div>
      <div className="week-strip" role="group" aria-label="Choose a day this week">
        {week.map(day => <button type="button" key={day.date} aria-label={day.full} aria-pressed={displayedDate === day.date} aria-current={day.date === today ? 'date' : undefined} className={`week-day${displayedDate === day.date ? ' selected' : ''}`} onClick={() => setSelectedDate(day.date === today ? null : day.date)}>
          {displayedDate === day.date && <motion.span className="week-selection" layoutId="selected-schedule-day" transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }} />}
          <span>{day.label}</span><strong>{day.number}</strong><i className={classes.some(s => s.date === day.date) ? 'has-classes' : ''} />
        </button>)}
      </div>
      <AnimatePresence mode="wait" initial={false}>
      <motion.div key={displayedDate} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -5 }} transition={{ duration: .18 }}>
      {events.length === 0 ? (
        <div className="empty-state"><CalendarDaysIcon aria-hidden="true" /><p>No classes or study sessions this day.</p><p>A good day to catch up or take a break.</p></div>
      ) : (
        <div className="timeline-list">
          {events.map((event, index) => {
            const s = event.classSession;
            const isNow = displayedDate === today && current >= event.start && current < event.end;
            const task = event.workSession ? tasks.find(t => t.id === event.workSession?.task_id) : null;
            return (
              <motion.article key={event.id} data-status={s?.status} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, delay: index * .045 }} className={`timeline-row${isNow ? ' is-now' : ''}`}>
                <div className="timeline-row-top">
                  <div className="min-w-0">
                    <div className="timeline-time">{event.time}{isNow && <span className="now-label">Now</span>}</div>
                    <h3 className="timeline-title">{s ? SUBJECTS.find(sub => sub.code === s.subjectCode)?.name ?? s.subjectCode : task?.title ?? 'Study session'}</h3>
                    <p className="timeline-meta">{s ? `${s.subjectCode} · ${s.classType}` : 'Planned focus time'}</p>
                  </div>
                </div>
                {s ? (
                  <div className="timeline-marking"><AnimatePresence mode="wait" initial={false}><motion.span key={s.status} initial={reduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .15 }}>{statusLabels[s.status]}</motion.span></AnimatePresence><AttendanceButtons status={s.status} onMark={status => updateSessionStatus(s.id, status)} compact /></div>
                ) : event.workSession && (
                  <div className="timeline-marking"><span>{event.workSession.status === 'COMPLETED' ? 'Completed' : 'Ready when you are'}</span>
                    <div className="flex gap-2">
                      {event.workSession.status !== 'COMPLETED' && <button className="ink-btn px-3 py-2 text-xs" onClick={() => updateSession(event.id, { status: 'COMPLETED' })}>Complete</button>}
                      <button className="ink-btn-ghost px-3 py-2 text-xs" onClick={() => updateSession(event.id, { status: 'CANCELLED' })}>Cancel</button>
                    </div>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      )}
      </motion.div>
      </AnimatePresence>
      {displayedDate === today && <motion.button whileTap={reduced ? undefined : { scale: .97 }} className="plan-action mt-3 w-full flex items-center justify-center gap-2 py-3 text-sm" onClick={() => setPlan(generateSmartPlan(tasks, classes, work))}><SparklesIcon className="w-4 h-4" aria-hidden="true" /> Plan my study time</motion.button>}
      {plan && <SmartPlanReviewSheet plan={plan} tasks={tasks} onClose={() => setPlan(null)} />}
    </section>
  );
}
