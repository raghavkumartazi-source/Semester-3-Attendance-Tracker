'use client';

import { useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useAttendance } from '@/components/AttendanceProvider';
import { SUBJECTS } from '@/lib/config';
import { timeUtils } from '@/lib/timeUtils';
import { attendanceHeatmap, chartDate, dateLabel, type HeatmapDay } from '../charts/attendance-chart-data';
import '../charts/attendance-charts.css';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ease = [.22, 1, .36, 1] as const;

function dayDescription(day: HeatmapDay) {
  return `${dateLabel(day.date, true)}. ${day.present} present, ${day.absent} absent${day.cancelled ? `, ${day.cancelled} cancelled` : ''}${day.unmarked ? `, ${day.unmarked} unmarked` : ''}.`;
}

export function AttendanceHeatmap() {
  const { sessions } = useAttendance();
  const root = useRef<HTMLElement>(null);
  const visible = useInView(root, { amount: .15 });
  const revealed = useInView(root, { once: true, amount: .15 });
  const reduced = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const [range, setRange] = useState(90);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const today = timeUtils.getLocalISODate();
  const { cells, columns, start } = useMemo(() => attendanceHeatmap(sessions, today, range), [sessions, today, range]);
  const lastRecorded = cells.filter(day => day.inRange && day.present + day.absent > 0).at(-1);
  const current = cells.find(day => day.inRange && day.date === (hoveredDate ?? selectedDate ?? lastRecorded?.date ?? today)) ?? cells.find(day => day.date === today)!;
  const activeDate = hoveredDate ?? selectedDate;
  const totalPresent = cells.reduce((sum, day) => sum + day.present, 0);
  const totalAbsent = cells.reduce((sum, day) => sum + day.absent, 0);
  const recordedDays = cells.filter(day => day.present + day.absent > 0).length;
  const monthLabels = cells.filter(day => day.inRange && (day.date === start || chartDate(day.date).getDate() === 1)).map(day => ({ column: day.column, label: chartDate(day.date).toLocaleDateString('en-IN', { month: 'short' }) }));
  const daySessions = sessions.filter(session => session.date === current.date && (session.status === 'PRESENT' || session.status === 'ABSENT'));
  const keyboardSelect = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const offset: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    let next = event.key === 'Home' ? cells.findIndex(day => day.inRange) : event.key === 'End' ? cells.findLastIndex(day => day.inRange) : index + (offset[event.key] ?? 0);
    if (!(event.key in offset) && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    next = Math.max(0, Math.min(cells.length - 1, next));
    while (next >= 0 && next < cells.length && !cells[next].inRange) next += next < index ? -1 : 1;
    if (!cells[next]?.inRange) return;
    setHoveredDate(null);
    setSelectedDate(cells[next].date);
    root.current?.querySelector<HTMLButtonElement>(`[data-date="${cells[next].date}"]`)?.focus();
  };

  return <section ref={root} className="after-chart-card after-heatmap-card" aria-labelledby={`${id}-title`}>
    <div className="after-chart-heading"><div><span className="after-chart-eyebrow">One day at a time</span><h3 id={`${id}-title`}>Consistency</h3></div><span className="after-chart-badge">{recordedDays} recorded {recordedDays === 1 ? 'day' : 'days'}</span></div>
    <div className="after-heatmap-summary"><p><strong>{totalPresent + totalAbsent ? `${totalPresent}/${totalPresent + totalAbsent}` : '—'}</strong><span>classes attended in view</span></p><div className="after-chart-ranges after-heatmap-ranges" aria-label="Heatmap date range">{[30, 90].map(days => <button type="button" key={days} aria-pressed={range === days} onClick={() => { setRange(days); setSelectedDate(null); setHoveredDate(null); }}>
      {range === days && <motion.span className="after-range-active" layoutId={`${id}-range`} transition={{ duration: reduced ? 0 : .28, ease }} />}<span>{days}D</span>
    </button>)}</div></div>
    <div className="after-heatmap-layout" style={{ '--heatmap-columns': columns } as CSSProperties}>
      <div className="after-heatmap-months" aria-hidden="true">{monthLabels.map((month, index) => <span key={index} style={{ gridColumn: `${month.column + 1} / span ${Math.min(3, columns - month.column)}` }}>{month.label}</span>)}</div>
      <div className="after-heatmap-weekdays" aria-hidden="true">{weekdays.map((day, index) => <span key={day} className={index > 4 ? 'is-weekend' : ''}>{day}</span>)}</div>
      <div className="after-heatmap-cells" role="group" aria-label={`Daily attendance from ${dateLabel(start)} to ${dateLabel(today)}. Use arrow keys to move between dates.`} onPointerLeave={() => setHoveredDate(null)}>
        {cells.map((day, index) => {
          const isActive = hoveredLevel === null && activeDate === day.date;
          const dimmed = hoveredLevel !== null ? hoveredLevel !== day.level : activeDate !== null && !isActive;
          return day.inRange ? <motion.button type="button" key={day.date} data-date={day.date} className={`after-heatmap-cell after-heatmap-level-${day.level}${isActive ? ' is-selected' : ''}${day.row > 4 ? ' is-weekend' : ''}`}
            aria-label={dayDescription(day)} aria-pressed={selectedDate === day.date} tabIndex={day.date === (selectedDate ?? lastRecorded?.date ?? today) ? 0 : -1}
            initial={false} animate={{ opacity: reduced || revealed ? dimmed ? .34 : 1 : 0, scale: isActive && !reduced ? 1.12 : 1 }}
            transition={{ duration: reduced || !visible ? 0 : .45, delay: !reduced && visible && !activeDate && hoveredLevel === null && revealed ? day.column * .019 + day.row * .013 : 0, ease }}
            onPointerEnter={event => { if (event.pointerType === 'mouse') setHoveredDate(day.date); }} onFocus={() => { setHoveredDate(null); setSelectedDate(day.date); }} onClick={() => setSelectedDate(day.date)} onKeyDown={event => keyboardSelect(event, index)} />
            : <span key={day.date} className="after-heatmap-ghost" aria-hidden="true" />;
        })}
      </div>
    </div>
    <div className="after-heatmap-legend" aria-label="Cell colors show the share of attended classes"><span><i className="after-heatmap-level-0" />No record</span><div onPointerLeave={() => setHoveredLevel(null)}><span>Missed</span>{[1, 2, 3, 4].map(level => <button type="button" key={level} className={`after-heatmap-level-${level}`} aria-label={['', 'All marked classes missed', 'Fewer than half attended', 'At least half attended', 'All marked classes attended'][level]} onPointerEnter={() => setHoveredLevel(level)} onFocus={() => setHoveredLevel(level)} onBlur={() => setHoveredLevel(null)} onClick={() => setHoveredLevel(hoveredLevel === level ? null : level)} aria-pressed={hoveredLevel === level} />)}<span>Attended</span></div></div>
    <div className="after-heatmap-preview" aria-live="polite" aria-atomic="true">
      <div className="after-heatmap-preview-heading"><strong>{dateLabel(current.date)}</strong><span>{current.present + current.absent ? `${current.present} present · ${current.absent} absent` : current.cancelled ? `${current.cancelled} cancelled${current.unmarked ? ` · ${current.unmarked} unmarked` : ''}` : current.unmarked ? `${current.unmarked} unmarked` : 'No classes recorded'}</span></div>
      {daySessions.length ? <div className="after-heatmap-subjects">{daySessions.map(session => <span key={session.id}><i className={session.status === 'ABSENT' ? 'is-absent' : ''} />{SUBJECTS.find(subject => subject.code === session.subjectCode)?.shortName ?? session.subjectCode}<small>{session.status === 'PRESENT' ? 'Present' : 'Absent'}</small></span>)}</div> : <p>{current.unmarked ? 'Mark the classes from this day to add to your history.' : current.cancelled ? 'Cancelled classes are excluded from attendance.' : 'Only recorded classes add color to your calendar.'}</p>}
    </div>
    <p className="after-chart-note">Tap a day to see its classes.{!recordedDays && ' Your first record starts the picture.'}</p>
  </section>;
}
