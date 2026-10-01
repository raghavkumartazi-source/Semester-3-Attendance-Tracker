'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { timeUtils } from '@/lib/timeUtils';
import { AnimatedNumber, TiltCard } from '../ui/Motion';

export function TodayHeader() {
  const reduced = useReducedMotion();
  const [info, setInfo] = useState<{ greeting: string; date: string; progress: ReturnType<typeof timeUtils.getSemesterProgress> } | null>(null);
  useEffect(() => {
    const update = () => setInfo({ greeting: timeUtils.getGreeting(), date: new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), progress: timeUtils.getSemesterProgress() });
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  const progress = info?.progress.percentage ?? 0;
  return (
    <div className="today-intro">
      <div className="greeting-row">
        <div><p className="greeting-eyebrow">{info?.greeting ?? 'Welcome back'} <span className="greeting-spark">✦</span></p><h1>Make today <em>count.</em></h1></div>
        <span className="date-chip">{info?.date ?? 'Semester III'}</span>
      </div>
      <TiltCard className="semester-hero">
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-copy">
          <span className="hero-kicker"><span /> SEMESTER IN PROGRESS</span>
          <h2>One day closer.<br /><span>You’ve got this.</span></h2>
          <p>Day {info?.progress.currentDay ?? '—'} <span>of {info?.progress.totalDays ?? '—'}</span></p>
          <Link className="hero-link" href="/planner">Plan what’s next<ArrowUpRightIcon aria-hidden="true" /></Link>
        </div>
        <div className="orbital-scene" aria-hidden="true">
          <div className="orbital-shadow" />
          <div className="orbital-float">
            <div className="orbital-body">
              <div className="orbital-edge" />
              <svg className="orbital-ring" viewBox="0 0 160 160">
                <defs><linearGradient id="semester-ring" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e5ffb0" /><stop offset=".5" stopColor="#b6ed79" /><stop offset="1" stopColor="#68a64a" /></linearGradient></defs>
                <circle cx="80" cy="80" r="63" fill="none" stroke="#343551" strokeWidth="13" />
                <motion.circle cx="80" cy="80" r="63" fill="none" stroke="url(#semester-ring)" strokeWidth="13" strokeLinecap="round" pathLength="100" strokeDasharray="100" initial={reduced ? false : { strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - progress }} transition={{ duration: 1.6, ease: [.22, 1, .36, 1], delay: .15 }} />
              </svg>
              <div className="orbital-center"><strong><AnimatedNumber value={progress} /><small>%</small></strong><span>of the journey</span></div>
              <span className="orbital-glint" />
            </div>
          </div>
          <span className="orbit-star star-one">✦</span><span className="orbit-star star-two">✧</span>
        </div>
        <span className="sr-only">Semester {Math.round(progress)} percent complete.</span>
        <div className="hero-footer"><SparklesIcon aria-hidden="true" /><span>Small steps. Every day.</span><span className="hero-footer-line" /></div>
      </TiltCard>
    </div>
  );
}
