'use client';

import { useState, useEffect } from 'react';
import { TIMETABLE, SUBJECTS, DAY_NAMES } from '@/lib/config';
import '../utility-pages.css';

const WEEKDAYS = [1, 2, 3, 4, 5];
const minutes = (time: string) => { const [hours, minute] = time.split(':').map(Number); return hours * 60 + minute; };

export default function SchedulePage() {
  const [clock, setClock] = useState<Date | null>(null);
  useEffect(() => {
    const updateTime = () => setClock(new Date());
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);
  const today = clock?.getDay();
  const currentMinutes = clock ? clock.getHours() * 60 + clock.getMinutes() : -1;

  return (
    <div className="schedule-page">
      <div className="page-header" data-page-reveal>
        <span className="utility-eyebrow">Your week at a glance</span>
        <h1>Weekly schedule</h1>
        <p className="page-subtitle">Find your next class and make room for study.</p>
      </div>
      <nav className="schedule-day-nav" aria-label="Jump to a weekday">
        {WEEKDAYS.map(day => <a key={day} href={`#schedule-day-${day}`} aria-current={day === today ? 'date' : undefined}><span>{DAY_NAMES[day].slice(0, 3)}</span><small>{TIMETABLE.filter(slot => slot.day === day).length} classes</small></a>)}
      </nav>
      <div className="schedule-week-grid">
        {WEEKDAYS.map(day => {
          const slots = TIMETABLE.filter(slot => slot.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
          const isToday = day === today;
          if (!slots.length) return null;
          return (
            <section key={day} id={`schedule-day-${day}`} className="schedule-day-panel" aria-labelledby={`weekday-${day}`}>
              <div className="schedule-day-heading"><h2 id={`weekday-${day}`}>{DAY_NAMES[day]}</h2><span>{isToday ? 'Today' : `${slots.length} classes`}</span></div>
              <ol className="schedule-class-list">
                {slots.map(slot => {
                  const subject = SUBJECTS.find(item => item.code === slot.subjectCode);
                  const isNow = isToday && currentMinutes >= minutes(slot.startTime) && currentMinutes < minutes(slot.endTime);
                  const isPast = isToday && currentMinutes >= minutes(slot.endTime);
                  return (
                    <li key={`${slot.subjectCode}-${slot.startTime}`} className={`schedule-class${isNow ? ' is-now' : ''}`}>
                      <div className="schedule-class-time"><time>{slot.startTime}</time><span>{slot.endTime}</span></div>
                      <div className="schedule-class-copy"><div><span className="schedule-class-code">{slot.subjectCode}</span>{isNow && <span className="schedule-now">Now</span>}</div><h3>{subject?.name ?? slot.subjectCode}</h3><p>{slot.classType}{isPast ? ' · Finished' : ''}</p></div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
