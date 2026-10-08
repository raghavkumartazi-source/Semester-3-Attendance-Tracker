'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, createScope } from 'animejs';
import { AttendanceStatus } from '@/lib/types';
import './ui/celebration.css';

type CelebrationEvent = { id: number; status: AttendanceStatus; x: number; y: number };
type Listener = (event: CelebrationEvent) => void;
const listeners = new Set<Listener>();
let eventCounter = 0;

/** A short, quiet confirmation burst shared by attendance controls. */
export function triggerCelebration(status: AttendanceStatus, x: number, y: number) {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const event = { id: ++eventCounter, status, x, y };
  listeners.forEach(listener => listener(event));
}

const colors: Record<AttendanceStatus, string> = {
  PRESENT: '#3159f5', ABSENT: '#bc344f', CANCELLED: '#90601d', UNMARKED: '#70737c',
};

function Burst({ event, onDone }: { event: CelebrationEvent; onDone: (id: number) => void }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scope = createScope({ root }).add(() => {
      root.current?.querySelectorAll('.confirmation-dot').forEach((dot, index) => {
        const angle = index * Math.PI / 3 - Math.PI / 2;
        const distance = 30 + (index % 2) * 9;
        animate(dot, { x: [0, Math.cos(angle) * distance], y: [0, Math.sin(angle) * distance], opacity: [1, 0], scale: [1, .3], duration: 550, ease: 'out(3)' });
      });
      animate('.confirmation-ring', { scale: [1, 3], opacity: [.4, 0], duration: 450, ease: 'out(3)' });
    });
    const timer = window.setTimeout(() => onDone(event.id), 600);
    return () => { window.clearTimeout(timer); scope.revert(); };
  }, [event, onDone]);
  return <div ref={root} className="confirmation-burst" style={{ left: event.x, top: event.y, color: colors[event.status] }} aria-hidden="true">
    <span className="confirmation-ring" />
    {Array.from({ length: 6 }, (_, index) => <span key={index} className="confirmation-dot" />)}
  </div>;
}

export function CelebrationLayer() {
  const [bursts, setBursts] = useState<CelebrationEvent[]>([]);
  const remove = useCallback((id: number) => setBursts(previous => previous.filter(burst => burst.id !== id)), []);
  useEffect(() => {
    const listener: Listener = event => setBursts(previous => [...previous.slice(-7), event]);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return <div className="confirmation-layer" aria-hidden="true">{bursts.map(event => <Burst key={event.id} event={event} onDone={remove} />)}</div>;
}
