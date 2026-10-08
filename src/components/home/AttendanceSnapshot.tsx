'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { animate, createScope } from 'animejs';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { useAttendance } from '../AttendanceProvider';
import { getSubjectAttendance } from '@/lib/calculations';
import { SUBJECTS } from '@/lib/config';
import { timeUtils } from '@/lib/timeUtils';
import './attendance-snapshot.css';

const SEGMENT_COUNT = 40;
const RADIUS = 66;
const CENTER = { x: 96, y: 84 };
const shortDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const fullDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

function pointOnGauge(angle: number, radius = RADIUS) {
  const radians = angle * Math.PI / 180;
  return {
    x: +(CENTER.x + radius * Math.cos(radians)).toFixed(2),
    y: +(CENTER.y + radius * Math.sin(radians)).toFixed(2),
  };
}

function arcPath(start: number, end: number) {
  const from = pointOnGauge(start);
  const to = pointOnGauge(end);
  return `M ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 ${end - start > 180 ? 1 : 0} 1 ${to.x} ${to.y}`;
}

const gaugeSegments = Array.from({ length: SEGMENT_COUNT }, (_, index) => {
  const start = 135 + index * 270 / SEGMENT_COUNT + .9;
  return arcPath(start, start + 270 / SEGMENT_COUNT - 1.8);
});
const gaugeArc = arcPath(135, 405);
const targetStart = pointOnGauge(135 + 270 * .75, 54);
const targetEnd = pointOnGauge(135 + 270 * .75, 78);

function formatDate(date: string, long = false) {
  return (long ? fullDate : shortDate).format(new Date(`${date}T12:00:00`));
}

function percentageLabel(percentage: number) {
  return `${Math.round(percentage * 10) / 10}`;
}

export function AttendanceSnapshot() {
  const { sessions } = useAttendance();
  const root = useRef<HTMLElement>(null);
  const previousPercentage = useRef(0);
  const componentId = useId().replace(/:/g, '');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = timeUtils.getLocalISODate(new Date());

  const history = useMemo(() => {
    const byDate = new Map<string, { present: number; absent: number }>();
    for (const session of sessions) {
      if (session.date > today || (session.status !== 'PRESENT' && session.status !== 'ABSENT')) continue;
      const day = byDate.get(session.date) ?? { present: 0, absent: 0 };
      if (session.status === 'PRESENT') day.present += 1;
      else day.absent += 1;
      byDate.set(session.date, day);
    }

    const snapshots: { date: string; present: number; absent: number; percentage: number }[] = [];
    for (const date of [...byDate.keys()].sort()) {
      const day = byDate.get(date)!;
      const previous = snapshots.at(-1);
      const present = (previous?.present ?? 0) + day.present;
      const absent = (previous?.absent ?? 0) + day.absent;
      snapshots.push({ date, present, absent, percentage: present / (present + absent) * 100 });
    }
    return snapshots.slice(-7);
  }, [sessions, today]);

  const dateIndex = selectedDate === null ? -1 : history.findIndex(day => day.date === selectedDate);
  const selectedIndex = dateIndex >= 0 ? dateIndex : history.length - 1;
  const current = history[selectedIndex];
  const percentage = current?.percentage ?? 0;
  const hasData = current !== undefined;
  const date = current?.date;

  const lowestSubject = useMemo(() => {
    if (!date) return null;
    let lowest: { code: string; name: string; percentage: number; needed: number } | null = null;
    for (const subject of SUBJECTS) {
      const stats = getSubjectAttendance(sessions.filter(session => session.subjectCode === subject.code && session.date <= date));
      if (stats.percentage === null || stats.percentage >= 75) continue;
      if (!lowest || stats.percentage < lowest.percentage) {
        lowest = { code: subject.code, name: subject.shortName, percentage: stats.percentage, needed: stats.needToAttend };
      }
    }
    return lowest;
  }, [sessions, date]);

  useEffect(() => {
    const from = previousPercentage.current;
    const scope = createScope({
      root,
      mediaQueries: { reduceMotion: '(prefers-reduced-motion: reduce)' },
    }).add(self => {
      animate('.pulse-gauge-fill', {
        strokeDashoffset: [100 - from, 100 - percentage],
        duration: self?.matches.reduceMotion ? 0 : 720,
        ease: 'out(4)',
      });
    });
    previousPercentage.current = percentage;
    return () => scope.revert();
  }, [percentage]);

  const gaugeLabel = hasData
    ? `${percentageLabel(percentage)} percent attendance through ${formatDate(current.date, true)}. ${current.present} present and ${current.absent} absent.`
    : 'No attendance recorded yet.';

  return (
    <section ref={root} className="pulse-attendance-card" aria-labelledby={`${componentId}-title`}>
      <div className="pulse-attendance-heading">
        <h2 id={`${componentId}-title`}>Attendance</h2>
        <Link href="/subjects" aria-label="Open attendance register" className="pulse-register-link">
          Register <ArrowUpRightIcon aria-hidden="true" />
        </Link>
      </div>

      <div className="pulse-attendance-body">
        <div
          className="pulse-attendance-gauge"
          role={hasData ? 'meter' : 'img'}
          aria-label={gaugeLabel}
          aria-valuemin={hasData ? 0 : undefined}
          aria-valuemax={hasData ? 100 : undefined}
          aria-valuenow={hasData ? percentage : undefined}
        >
          <svg viewBox="0 0 192 160" aria-hidden="true">
            <defs>
              <mask id={`${componentId}-segments`}>
                {gaugeSegments.map((path, index) => <path key={index} d={path} fill="none" stroke="white" strokeWidth="12" />)}
              </mask>
            </defs>
            <g className="pulse-gauge-track">
              {gaugeSegments.map((path, index) => <path key={index} d={path} fill="none" strokeWidth="12" />)}
            </g>
            <path
              className="pulse-gauge-fill"
              d={gaugeArc}
              pathLength="100"
              fill="none"
              strokeWidth="14"
              strokeDasharray="100"
              strokeDashoffset={100 - percentage}
              mask={`url(#${componentId}-segments)`}
            />
            <path className="pulse-gauge-target" d={`M ${targetStart.x} ${targetStart.y} L ${targetEnd.x} ${targetEnd.y}`} strokeWidth="1.5" />
          </svg>
          <div className="pulse-gauge-copy" aria-hidden="true">
            <strong>{hasData ? percentageLabel(percentage) : '—'}{hasData ? <small>%</small> : null}</strong>
            <span>{hasData ? 'attendance' : 'No records yet'}</span>
          </div>
          <span className="pulse-gauge-target-label" aria-hidden="true">75% target</span>
        </div>

        <div className="pulse-attendance-details">
          <span className={`pulse-attendance-status${hasData && percentage < 75 ? ' pulse-status-attention' : ''}`}>
            <i aria-hidden="true" />{!hasData ? 'Start with one class' : percentage >= 75 ? 'On target' : 'Below the target'}
          </span>
          <dl className="pulse-attendance-counts">
            <div><dt><i className="pulse-present-dot" aria-hidden="true" />Present</dt><dd>{current?.present ?? '—'}</dd></div>
            <div><dt><i className="pulse-absent-dot" aria-hidden="true" />Absent</dt><dd>{current?.absent ?? '—'}</dd></div>
          </dl>
          <p className="pulse-attendance-through">{date ? `Through ${formatDate(date)}` : 'Your history starts here'}</p>
        </div>
      </div>

      {history.length > 1 ? (
        <div className="pulse-history-scrubber">
          <label className="pulse-visually-hidden" htmlFor={`${componentId}-history`}>Attendance through a recorded date</label>
          <input
            id={`${componentId}-history`}
            type="range"
            min="0"
            max={history.length - 1}
            step="1"
            value={selectedIndex}
            aria-valuetext={`${formatDate(current.date, true)}: ${percentageLabel(percentage)} percent cumulative attendance`}
            onChange={event => {
              const index = Number(event.target.value);
              setSelectedDate(index === history.length - 1 ? null : history[index].date);
            }}
          />
          <div className="pulse-history-labels" aria-hidden="true">
            <span>{formatDate(history[0].date)}</span><span>Drag to explore</span><span>{formatDate(history[history.length - 1].date)}</span>
          </div>
        </div>
      ) : (
        <p className="pulse-history-empty">{hasData ? 'A little history, one class at a time.' : 'Mark a class to see your attendance grow.'}</p>
      )}

      <div className="pulse-attendance-footer">
        {lowestSubject ? (
          <Link href={`/subjects/${lowestSubject.code}`} className="pulse-attendance-risk" aria-label={`${lowestSubject.name} is at ${percentageLabel(lowestSubject.percentage)} percent. Attend ${lowestSubject.needed} more classes to reach 75 percent.`}>
            <span><i aria-hidden="true" />{lowestSubject.name} needs {lowestSubject.needed} {lowestSubject.needed === 1 ? 'class' : 'classes'}</span>
            <ArrowUpRightIcon aria-hidden="true" />
          </Link>
        ) : (
          <p>{hasData ? 'Every recorded subject is at 75% or above.' : 'Build your streak from today.'}</p>
        )}
      </div>
      <p className="pulse-visually-hidden" aria-live="polite" aria-atomic="true">{gaugeLabel}</p>
    </section>
  );
}
