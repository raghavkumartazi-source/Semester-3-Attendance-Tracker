'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { timeUtils } from '@/lib/timeUtils';
import { AnimatedNumber, TiltCard } from '../ui/Motion';

export function TodayHeader({ now }: { now: Date }) {
  const reduced = useReducedMotion();
  const progress = timeUtils.getSemesterProgress(now);
  return (
    <div className="today-intro compact-intro">
      <div className="intro-copy">
        <p className="greeting-eyebrow">{timeUtils.getGreeting(now)} <span className="greeting-spark" aria-hidden="true">✦</span></p>
        <h1>Your day, <em>in focus.</em></h1>
        <p className="intro-date">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}<span aria-hidden="true">·</span>Day {progress.currentDay}</p>
      </div>
      <Link href="/planner" className="intro-progress" aria-label={`Semester ${Math.round(progress.percentage)} percent complete. Open exam planner`}>
        <TiltCard className="mini-orbit">
          <div className="orbital-body" aria-hidden="true">
            <div className="orbital-edge" />
            <svg className="orbital-ring" viewBox="0 0 160 160">
              <defs><linearGradient id="semester-ring" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e5ffb0" /><stop offset=".5" stopColor="#b6ed79" /><stop offset="1" stopColor="#68a64a" /></linearGradient></defs>
              <circle cx="80" cy="80" r="63" fill="none" stroke="#343551" strokeWidth="13" />
              <motion.circle cx="80" cy="80" r="63" fill="none" stroke="url(#semester-ring)" strokeWidth="13" strokeLinecap="round" pathLength="100" strokeDasharray="100" initial={reduced ? false : { strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - progress.percentage }} transition={{ duration: 1.2, ease: [.22, 1, .36, 1] }} />
            </svg>
            <div className="orbital-center"><strong><AnimatedNumber value={progress.percentage} /><small>%</small></strong></div>
          </div>
        </TiltCard>
        <span className="intro-progress-label">Semester</span>
      </Link>
    </div>
  );
}
