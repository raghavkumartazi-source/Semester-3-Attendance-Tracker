'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { AttendanceStatus } from '@/lib/types';

/* ============================================================
   CelebrationBurst
   ------------------------------------------------------------
   Imperative, decoupled celebration system.

   Usage anywhere in the app:
     import { triggerCelebration } from '@/components/CelebrationBurst';
     triggerCelebration('PRESENT', e.clientX, e.clientY);

   Then mount <CelebrationLayer /> once (layout.tsx) so the
   fixed overlay can render the emoji + particle bursts.
   ============================================================ */

type CelebrationEvent = {
  id: number;
  status: AttendanceStatus;
  x: number;
  y: number;
};

type Listener = (event: CelebrationEvent) => void;

let listeners: Listener[] = [];
let eventCounter = 0;

/** Fire a burst at a screen coordinate. Safe to call from any client component. */
export function triggerCelebration(status: AttendanceStatus, x: number, y: number) {
  if (typeof window === 'undefined') return;
  const event: CelebrationEvent = { id: ++eventCounter, status, x, y };
  listeners.forEach((fn) => fn(event));
}

function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((fn) => fn !== listener);
  };
}

/* ---------- Per-status flavour ---------- */

interface BurstFlavour {
  emojis: string[];
  particleColor: string;
  ringColor: string;
  particleCount: number;
}

const FLAVOURS: Record<AttendanceStatus, BurstFlavour> = {
  PRESENT: {
    emojis: ['🎉', '✅', '⭐', '🎓', '💫'],
    particleColor: 'rgb(52, 211, 153)',
    ringColor: 'rgb(52, 211, 153)',
    particleCount: 14,
  },
  ABSENT: {
    emojis: ['❌', '😢', '📉', '💔'],
    particleColor: 'rgb(248, 113, 113)',
    ringColor: 'rgb(248, 113, 113)',
    particleCount: 10,
  },
  CANCELLED: {
    emojis: ['🚫', '🛑', '🧹'],
    particleColor: 'rgb(161, 161, 170)',
    ringColor: 'rgb(161, 161, 170)',
    particleCount: 8,
  },
  UNMARKED: {
    emojis: ['↩️'],
    particleColor: 'rgb(161, 161, 170)',
    ringColor: 'rgb(161, 161, 170)',
    particleCount: 6,
  },
};

function seededRandom(seed: number) {
  const value = Math.sin(seed * 9999.7) * 10000;
  return value - Math.floor(value);
}

function Burst({ event, onDone }: { event: CelebrationEvent; onDone: () => void }) {
  const flavour = FLAVOURS[event.status];
  const emojiCount = event.status === 'PRESENT' ? 6 : event.status === 'ABSENT' ? 4 : 3;

  // Pre-compute particle trajectories once per burst
  const particles = Array.from({ length: flavour.particleCount }, (_, i) => {
    const angle = (i / flavour.particleCount) * Math.PI * 2 + seededRandom(event.id + i) * 0.5;
    const distance = 40 + seededRandom(event.id * 3 + i) * 70;
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 20, // slight upward bias
      size: 4 + seededRandom(event.id * 7 + i) * 6,
    };
  });

  const emojis = Array.from({ length: emojiCount }, (_, i) => {
    const angle = -Math.PI / 2 + (i / emojiCount) * Math.PI - Math.PI / 2 + (seededRandom(event.id * 11 + i) - 0.5) * 1.2;
    const distance = 55 + seededRandom(event.id * 13 + i) * 65;
    return {
      char: flavour.emojis[Math.floor(seededRandom(event.id * 17 + i) * flavour.emojis.length)],
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 25,
      rot: (seededRandom(event.id * 19 + i) - 0.5) * 120,
      delay: i * 0.04,
    };
  });

  useEffect(() => {
    const timer = setTimeout(onDone, 1600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="celebration-layer"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {/* Shockwave ring */}
      <span
        className="celebration-ring"
        style={{ left: event.x, top: event.y, color: flavour.ringColor }}
      />

      {/* Particle dots */}
      {particles.map((p, i) => (
        <span
          key={`p-${i}`}
          className="celebration-particle"
          style={
            {
              left: event.x,
              top: event.y,
              width: p.size,
              height: p.size,
              background: flavour.particleColor,
              boxShadow: `0 0 6px ${flavour.particleColor}`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
            } as CSSProperties
          }
        />
      ))}

      {/* Flying emojis */}
      {emojis.map((e, i) => (
        <span
          key={`e-${i}`}
          className="celebration-emoji"
          style={
            {
              left: event.x,
              top: event.y,
              marginLeft: '-12px',
              '--dx': `${e.dx}px`,
              '--dy': `${e.dy}px`,
              '--rot': `${e.rot}deg`,
              animationDelay: `${e.delay}s`,
            } as CSSProperties
          }
        >
          {e.char}
        </span>
      ))}
    </div>
  );
}

/** Mount once near the app root. Renders celebration bursts on demand. */
export function CelebrationLayer() {
  const [bursts, setBursts] = useState<CelebrationEvent[]>([]);

  useEffect(() => {
    return subscribe((event) => {
      setBursts((prev) => [...prev, event]);
    });
  }, []);

  return (
    <>
      {bursts.map((event) => (
        <Burst
          key={event.id}
          event={event}
          onDone={() => setBursts((prev) => prev.filter((b) => b.id !== event.id))}
        />
      ))}
    </>
  );
}
