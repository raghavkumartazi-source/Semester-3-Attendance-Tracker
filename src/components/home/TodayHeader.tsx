'use client';

import { useEffect, useRef } from 'react';
import { animate, createScope, stagger } from 'animejs';
import { timeUtils } from '@/lib/timeUtils';

export function TodayHeader({ now }: { now: Date }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const scope = createScope({ root, mediaQueries: { reduced: '(prefers-reduced-motion: reduce)' } }).add(self => {
      if (!self || self.matches.reduced) return;
      animate('.day-heading-line', { y: [22, 0], opacity: [.25, 1], duration: 750, delay: stagger(90), ease: 'out(4)' });
      animate('.day-heading-star', { rotate: [-90, 0], scale: [.5, 1], duration: 1000, ease: 'outElastic(1, .7)' });
    });
    return () => scope.revert();
  }, []);
  return (
    <header ref={root} className="day-intro">
      <div className="day-dateline"><span>{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span><span className="day-term">Semester III <i aria-hidden="true" /></span></div>
      <h1><span className="day-heading-line">Make room</span><span className="day-heading-line">for <em>progress.</em><svg className="day-heading-star" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 0 24 14 36 6 28 18 40 20 26 24 34 36 22 28 20 40 16 26 4 34 12 22 0 20 14 16 6 4 18 12Z" fill="currentColor" /></svg></span></h1>
      <p>{timeUtils.getGreeting(now)}. A little focus goes a long way.</p>
    </header>
  );
}
