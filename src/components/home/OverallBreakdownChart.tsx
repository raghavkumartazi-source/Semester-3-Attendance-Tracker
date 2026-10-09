'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Session } from '@/lib/types';
import { timeUtils } from '@/lib/timeUtils';
import '../charts/attendance-charts.css';

const ease = [.22, 1, .36, 1] as const;

export function OverallBreakdownChart({ sessions }: { sessions: Session[] }) {
  const root = useRef<HTMLElement>(null);
  const revealed = useInView(root, { once: true, amount: .15 });
  const visible = useInView(root, { amount: .15 });
  const reduced = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const today = timeUtils.getLocalISODate();
  const totals = useMemo(() => {
    const past = sessions.filter(session => session.date <= today);
    return { present: past.filter(session => session.status === 'PRESENT').length, absent: past.filter(session => session.status === 'ABSENT').length, cancelled: past.filter(session => session.status === 'CANCELLED').length };
  }, [sessions, today]);
  const total = totals.present + totals.absent;
  const data = [{ name: 'Present', value: totals.present, color: 'var(--after-chart-coral)', radius: 74 }, { name: 'Absent', value: totals.absent, color: 'var(--after-chart-rose)', radius: 58 }];
  const active = hovered ?? selected;
  const entry = data.find(item => item.name === active);
  const centreValue = total ? (entry?.value ?? totals.present) / total * 100 : null;
  const choose = (name: string) => setSelected(selected === name ? null : name);

  return <section ref={root} className="after-chart-card after-breakdown-card" aria-labelledby={`${id}-title`}>
    <div className="after-chart-heading"><div><span className="after-chart-eyebrow">Your recorded classes</span><h3 id={`${id}-title`}>Status breakdown</h3></div><span className="after-chart-badge">All time</span></div>
    <div className="after-breakdown-body">
      <div className="after-breakdown-rings" role="img" aria-label={total ? `${totals.present} present and ${totals.absent} absent of ${total} marked classes. ${(totals.present / total * 100).toFixed(1)} percent attendance.` : 'No marked attendance yet.'}>
        <svg viewBox="0 0 180 180" aria-hidden="true">
          {data.map((item, index) => <motion.g key={item.name} initial={false} animate={{ scale: active === item.name && !reduced ? 1.035 : 1, opacity: active && active !== item.name ? .32 : 1 }} style={{ transformOrigin: '90px 90px' }} transition={{ duration: reduced || !visible ? 0 : .22, ease }} onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(item.name); }} onPointerLeave={() => setHovered(null)} onClick={() => choose(item.name)}>
            <circle className="after-ring-track" cx="90" cy="90" r={item.radius} fill="none" strokeWidth="10" />
            <motion.circle cx="90" cy="90" r={item.radius} fill="none" stroke={item.color} strokeWidth="10" strokeLinecap="round" pathLength="100" strokeDasharray="100" transform="rotate(-90 90 90)" initial={false}
              animate={{ strokeDashoffset: 100 - ((revealed || reduced) && total ? item.value / total * 100 : 0), opacity: item.value ? 1 : 0 }}
              transition={{ duration: reduced || !visible ? 0 : 1.2, delay: reduced || !visible ? 0 : index * .13, ease }} style={{ filter: active === item.name ? `drop-shadow(0 0 7px ${item.color})` : 'none' }} />
          </motion.g>)}
        </svg>
        <div className="after-ring-center" aria-hidden="true"><strong>{centreValue === null ? '—' : centreValue.toFixed(1)}{centreValue !== null && <small>%</small>}</strong><span>{entry?.name ?? 'attendance'}</span></div>
      </div>
      <div className="after-breakdown-legend">
        <p><strong>{total || '—'}</strong><span>marked {total === 1 ? 'class' : 'classes'}</span></p>
        {data.map(item => <button key={item.name} type="button" aria-pressed={selected === item.name} aria-label={`${item.name}: ${item.value} classes${total ? `, ${(item.value / total * 100).toFixed(1)} percent of marked classes` : ''}`} className={active === item.name ? 'is-active' : ''} onClick={() => choose(item.name)} onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(item.name); }} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(item.name)} onBlur={() => setHovered(null)}>
          <i style={{ background: item.color }} /><span>{item.name}</span><strong>{total ? item.value : '—'}</strong>
        </button>)}
      </div>
    </div>
    <div className="after-breakdown-footer" aria-live="polite">{total ? <p>{entry ? `${entry.value} of ${total} marked classes were ${entry.name.toLowerCase()}.` : 'Tap a ring or a status to explore the totals.'}</p> : <p>Mark your first class to bring these rings to life.</p>}{totals.cancelled > 0 && <span>{totals.cancelled} cancelled · excluded</span>}</div>
  </section>;
}
