'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRightIcon, CalendarDaysIcon, SparklesIcon, ChevronDownIcon, CheckIcon, XMarkIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useAttendance } from '../AttendanceProvider';
import { useWorkSessions } from '../WorkSessionProvider';
import { useTasks } from '../TaskProvider';
import { SUBJECTS } from '@/lib/config';
import { timeUtils } from '@/lib/timeUtils';
import { timeInMinutes } from '@/lib/focusClass';
import AttendanceButtons from '../AttendanceButtons';
import { generateSmartPlan, SuggestedPlan } from '@/lib/plannerAlgorithm';
import { SmartPlanReviewSheet } from './SmartPlanReviewSheet';

const statusLabels = { PRESENT: 'Present', ABSENT: 'Absent', CANCELLED: 'Cancelled', UNMARKED: 'Mark attendance' };
const statusIcons = { PRESENT: CheckIcon, ABSENT: XMarkIcon, CANCELLED: MinusIcon, UNMARKED: null };

export function TodayTimeline({ now }: { now: Date }) {
  const { sessions: classes, updateSessionStatus } = useAttendance();
  const { sessions: work, updateSession } = useWorkSessions();
  const { tasks } = useTasks();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const reduced = useReducedMotion();
  const [plan, setPlan] = useState<SuggestedPlan | null>(null);

  const today = timeUtils.getLocalISODate(now);
  const displayedDate = selectedDate ?? today;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (now.getDay() + 6) % 7);
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return { date: timeUtils.getLocalISODate(day), number: day.getDate(), label: day.toLocaleDateString('en-GB', { weekday: 'short' }), full: day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) };
  });
  const current = now.getHours() * 60 + now.getMinutes();
  const events = [
    ...classes.filter(s => s.date === displayedDate).map(s => ({ id: s.id, start: timeInMinutes(s.startTime), end: timeInMinutes(s.endTime), time: `${s.startTime} – ${s.endTime}`, classSession: s, workSession: null })),
    ...work.filter(s => timeUtils.getLocalISODate(new Date(s.planned_start)) === displayedDate && !s.deleted_at && s.status !== 'CANCELLED').map(s => {
      const start = new Date(s.planned_start), end = new Date(s.planned_end);
      return { id: s.id, start: start.getHours() * 60 + start.getMinutes(), end: end.getHours() * 60 + end.getMinutes(), time: `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, classSession: null, workSession: s };
    })
  ].sort((a, b) => a.start - b.start);
  const dayClasses = classes.filter(s => s.date === displayedDate);
  const marked = dayClasses.filter(s => s.status !== 'UNMARKED').length;

  const toggleExpanded = (id: string) => setExpanded(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <section className="daily-schedule">
      <div className="section-heading"><div><h2>{displayedDate === today ? "Today’s schedule" : new Date(`${displayedDate}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</h2><p className="schedule-caption">{dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'} · {marked} recorded</p></div><Link href="/schedule" className="section-link">Full week<ArrowUpRightIcon aria-hidden="true" /></Link></div>
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
                const recorded = s ? s.status !== 'UNMARKED' : event.workSession?.status === 'COMPLETED';
                const showActions = !recorded || expanded.has(event.id);
                const subject = s ? SUBJECTS.find(sub => sub.code === s.subjectCode) : null;
                const title = s ? subject?.name ?? s.subjectCode : tasks.find(t => t.id === event.workSession?.task_id)?.title ?? 'Study session';
                const StatusIcon = s ? statusIcons[s.status] : CheckIcon;
                return (
                  <motion.article key={event.id} layout={reduced ? false : 'position'} data-status={s?.status} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25, delay: index * .025 }} className={`timeline-row${isNow ? ' is-now' : ''}${recorded ? ' is-recorded' : ''}${showActions ? ' is-expanded' : ''}`}>
                    <div className="timeline-row-top">
                      <div className="timeline-subject">
                        <div className="timeline-time">{event.time}{isNow && <span className="now-label">Now</span>}</div>
                        <h3 className="timeline-title">{recorded && !showActions ? subject?.shortName ?? title : title}</h3>
                        <p className="timeline-meta">{s ? `${s.subjectCode} · ${s.classType}` : 'Planned focus time'}</p>
                      </div>
                      {recorded && <div className="recorded-controls"><motion.span key={s?.status ?? 'done'} className={`recorded-badge status-${s?.status.toLowerCase() ?? 'present'}`} initial={reduced ? false : { scale: .75 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>{StatusIcon && <StatusIcon aria-hidden="true" />}<span>{s ? statusLabels[s.status] : 'Done'}</span></motion.span><button type="button" className="edit-attendance" onClick={() => toggleExpanded(event.id)} aria-expanded={showActions} aria-controls={`actions-${event.id}`} aria-label={`${showActions ? 'Close' : 'Edit'} attendance for ${title}, ${event.time}`}><ChevronDownIcon aria-hidden="true" /></button></div>}
                    </div>
                    <AnimatePresence initial={false}>
                      {showActions && <motion.div id={`actions-${event.id}`} className="timeline-action-wrap" initial={reduced ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={reduced ? undefined : { height: 0, opacity: 0 }} transition={{ duration: .22 }}>
                        {s ? <div className="timeline-marking"><span>{statusLabels[s.status]}</span><AttendanceButtons status={s.status} onMark={status => { updateSessionStatus(s.id, status); setExpanded(previous => { const next = new Set(previous); next.delete(s.id); return next; }); }} compact /></div> : event.workSession && <div className="timeline-marking"><span>{event.workSession.status === 'COMPLETED' ? 'Completed' : 'Ready when you are'}</span><div className="flex gap-2">{event.workSession.status !== 'COMPLETED' && <button className="ink-btn px-3 py-2 text-xs" onClick={() => updateSession(event.id, { status: 'COMPLETED' })}>Complete</button>}<button className="ink-btn-ghost px-3 py-2 text-xs" onClick={() => updateSession(event.id, { status: 'CANCELLED' })}>Cancel</button></div></div>}
                      </motion.div>}
                    </AnimatePresence>
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
