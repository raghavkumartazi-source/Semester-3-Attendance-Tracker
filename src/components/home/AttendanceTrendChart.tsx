'use client';

import { useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Session } from '@/lib/types';
import { timeUtils } from '@/lib/timeUtils';
import { attendanceInRange, dateLabel, offsetDate, recordedAttendanceHistory, trendGeometry } from '../charts/attendance-chart-data';
import '../charts/attendance-charts.css';

const ranges = [{ label: '7D', days: 7 }, { label: '30D', days: 30 }, { label: '90D', days: 90 }, { label: 'All', days: null }] as const;
const ease = [.22, 1, .36, 1] as const;

export function AttendanceTrendChart({ sessions }: { sessions: Session[] }) {
  const root = useRef<HTMLElement>(null);
  const visible = useInView(root, { amount: .15 });
  const revealed = useInView(root, { once: true, amount: .15 });
  const reduced = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const [range, setRange] = useState<number | null>(30);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = timeUtils.getLocalISODate();
  const history = useMemo(() => recordedAttendanceHistory(sessions, today), [sessions, today]);
  const data = useMemo(() => attendanceInRange(history, today, range), [history, range, today]);
  const start = range === null ? history[0]?.date ?? today : offsetDate(today, 1 - range);
  const geometry = useMemo(() => trendGeometry(data, start, today), [data, start, today]);
  const matchingIndex = selectedDate ? data.findIndex(day => day.date === selectedDate) : -1;
  const selectedIndex = matchingIndex >= 0 ? matchingIndex : data.length - 1;
  const current = data[selectedIndex];
  const point = geometry.points[selectedIndex];
  const change = data.length > 1 ? data.at(-1)!.percentage - data[0].percentage : null;
  const duration = reduced || !visible ? 0 : .65;
  const selectPoint = (event: PointerEvent<SVGSVGElement>) => {
    if (!data.length) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 420;
    const closest = geometry.points.reduce((best, point, index) => Math.abs(point.x - x) < Math.abs(geometry.points[best].x - x) ? index : best, 0);
    setSelectedDate(data[closest].date);
  };

  return (
    <section ref={root} className="after-chart-card after-trend-card" aria-labelledby={`${id}-title`}>
      <div className="after-chart-heading">
        <div><span className="after-chart-eyebrow">The bigger picture</span><h3 id={`${id}-title`}>Attendance trend</h3></div>
        <span className="after-chart-badge"><i />Cumulative</span>
      </div>
      <div className="after-trend-stat">
        <div><strong>{current ? current.percentage.toFixed(1) : '—'}{current && <small>%</small>}</strong><span>{current ? `Through ${dateLabel(current.date)}` : 'Your history starts here'}</span></div>
        {change !== null && <span className={`after-chart-change${change < 0 ? ' is-down' : ''}`}>{change > 0 ? '+' : ''}{change.toFixed(1)}<small> pts in view</small></span>}
      </div>
      <div className="after-chart-ranges" aria-label="Trend date range">
        {ranges.map(option => <button key={option.label} type="button" aria-pressed={range === option.days} onClick={() => { setRange(option.days); setSelectedDate(null); }}>
          {range === option.days && <motion.span className="after-range-active" layoutId={`${id}-range`} transition={{ duration: reduced ? 0 : .28, ease }} />}
          <span>{option.label}</span>
        </button>)}
      </div>
      {current ? <>
        <div className="after-trend-plot">
          <svg viewBox="0 0 420 212" role="img" aria-label={`Cumulative attendance from ${dateLabel(start)} to ${dateLabel(today)}. ${data.length} recorded days. Use the date slider below to explore.`}
            onPointerMove={selectPoint} onPointerDown={selectPoint} onPointerLeave={event => { if (event.pointerType === 'mouse') setSelectedDate(null); }}>
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--after-chart-coral)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--after-chart-coral)" stopOpacity="0" /></linearGradient>
              <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="var(--after-chart-rose)" /><stop offset="100%" stopColor="var(--after-chart-coral)" /></linearGradient>
              <clipPath id={`${id}-reveal`}><motion.rect x="31" y="0" height="192" initial={false} animate={{ width: revealed || reduced ? 367 : 0 }} transition={{ duration: reduced || !visible ? 0 : 1.15, ease }} /></clipPath>
            </defs>
            {[0, 25, 50, 75, 100].map(value => <g key={value} className={value === 75 ? 'after-trend-target' : 'after-trend-grid'}>
              <line x1="34" x2="394" y1={176 - value * 1.56} y2={176 - value * 1.56} />
              <text x="23" y={180 - value * 1.56} textAnchor="end">{value}</text>
            </g>)}
            <text x="390" y="54" textAnchor="end" className="after-trend-target-copy">75% target</text>
            <g clipPath={`url(#${id}-reveal)`}>
              <motion.path initial={false} animate={{ d: geometry.area }} transition={{ duration, ease }} fill={`url(#${id}-fill)`} />
              <motion.path className="after-trend-line" initial={false} animate={{ d: geometry.line }} transition={{ duration, ease }} fill="none" stroke={`url(#${id}-stroke)`} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              {data.length === 1 && <circle cx={point.x} cy={point.y} r="4" fill="var(--after-chart-coral)" />}
            </g>
            {point && <motion.g initial={false} animate={{ x: point.x, y: point.y }} transition={{ duration: reduced || !visible ? 0 : .18, ease }} className="after-trend-indicator">
              <line y1={12 - point.y} y2={176 - point.y} strokeDasharray="3 5" />
              <circle r="9" className="after-trend-dot-halo" /><circle r="4.5" className="after-trend-dot" />
            </motion.g>}
            <text x="34" y="202" className="after-trend-date">{dateLabel(start)}</text><text x="394" y="202" textAnchor="end" className="after-trend-date">{dateLabel(today)}</text>
          </svg>
        </div>
        <div className="after-chart-detail" aria-live="polite" aria-atomic="true"><div><strong>{dateLabel(current.date)}</strong><span>{current.present} present · {current.absent} absent that day</span></div><span className="after-chart-detail-total">{current.totalPresent}/{current.totalPresent + current.totalAbsent}<small> attended overall</small></span></div>
        {data.length > 1 ? <div className="after-chart-scrubber">
          <label className="after-chart-sr-only" htmlFor={`${id}-scrub`}>Explore cumulative attendance by recorded date</label>
          <input id={`${id}-scrub`} type="range" min="0" max={data.length - 1} value={selectedIndex} step="1" aria-valuetext={`${dateLabel(current.date, true)}: ${current.percentage.toFixed(1)} percent`} onChange={event => setSelectedDate(data[Number(event.target.value)].date)} />
          <span>Slide through your recorded days</span>
        </div> : <p className="after-chart-note">One recorded day. Your next class adds to the picture.</p>}
      </> : <div className="after-chart-empty"><div className="after-empty-trend" aria-hidden="true"><svg viewBox="0 0 120 40"><path d="M 2 34 L 118 34" /></svg></div><strong>{history.length ? 'No records in this window' : 'A story waiting to begin'}</strong><p>{history.length ? 'Choose All to explore your earlier attendance.' : 'Mark a class to start your attendance trend.'}</p></div>}
      <p className="after-chart-note">Present and absent classes count toward attendance.</p>
    </section>
  );
}
