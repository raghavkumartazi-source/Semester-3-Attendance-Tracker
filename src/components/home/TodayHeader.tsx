'use client';

import { useEffect, useRef } from 'react';
import { createScope, createTimeline, stagger } from 'animejs';
import { timeUtils } from '@/lib/timeUtils';
import { SemesterInstrument } from '../ui/SemesterInstrument';
import { LiquidButton } from '../ui/LiquidButton';
import { SparklesIcon } from '@heroicons/react/24/outline';

export function TodayHeader({ now }: { now: Date }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const scope = createScope({ root, mediaQueries: { reduced: '(prefers-reduced-motion: reduce)' } }).add(self => {
      if (!self || self.matches.reduced) return;
      createTimeline({ defaults: { ease: 'out(4)' } })
        .add('.greeting-copy', { y: [14, 0], opacity: [.25, 1], duration: 550 }, 0)
        .add('.date-chip', { y: [10, 0], opacity: [.25, 1], duration: 550 }, 100)
        .add('.hero-copy > *', { y: [20, 0], opacity: [.2, 1], duration: 700, delay: stagger(70) }, 170);
    });
    return () => scope.revert();
  }, []);
  const progress = timeUtils.getSemesterProgress(now);
  return (
    <header ref={root} className="today-intro">
      <div className="greeting-row">
        <div className="greeting-copy"><p className="greeting-eyebrow">{timeUtils.getGreeting(now)}</p><h1>Make today <em>count.</em></h1></div>
        <span className="date-chip">{now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>
      <section className="semester-hero" aria-label={`Semester ${Math.round(progress.percentage)} percent complete`}>
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-copy">
          <span className="hero-kicker"><span /> SEMESTER IN PROGRESS</span>
          <h2>One day closer.<br /><span>You’ve got this.</span></h2>
          <p>Day {progress.currentDay} <span>of {progress.totalDays}</span></p>
          <LiquidButton href="/planner" variant="quiet" className="hero-link" aria-label="Plan what’s next">Plan what’s next <span aria-hidden="true">↗</span></LiquidButton>
        </div>
        <SemesterInstrument percentage={progress.percentage} currentDay={progress.currentDay} totalDays={progress.totalDays} className="semester-instrument" />
        <div className="hero-footer"><SparklesIcon aria-hidden="true" /><span>Small steps. Every day.</span><span className="hero-footer-line" /></div>
      </section>
    </header>
  );
}
