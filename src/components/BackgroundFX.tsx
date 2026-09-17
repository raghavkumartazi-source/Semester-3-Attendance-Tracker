'use client';

import { useEffect, useRef } from 'react';
import { useAttendance } from '@/components/AttendanceProvider';
import { getOverallAttendance } from '@/lib/calculations';
import { getTodaySlots } from '@/lib/sessions';
import {
  SUBJECT_COLORS,
  DEFAULT_WASH_COLOR,
  horizonColorForLevel,
  semesterDurationSeconds,
  semesterDelaySeconds,
  todayGridColumnPx,
  auroraTriadForHour,
  complementOf,
} from '@/lib/theme';
import { initParticleCanvas, destroyParticleCanvas } from '@/lib/backgroundParticles';
import type { TimetableSlot } from '@/lib/types';

const GLOW_THRESHOLD = 75;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * The subject whose accent colors the wash:
 * the class happening now, else the next one today, else the first of the day.
 */
function pickAccentSubject(slots: TimetableSlot[]): string | null {
  if (slots.length === 0) return null;

  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const sorted = [...slots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  const current = sorted.find((s) => {
    const start = toMinutes(s.startTime);
    const end = start + (s.classType === 'Lab' ? 120 : 60);
    return now >= start && now <= end;
  });
  if (current) return current.subjectCode;

  const next = sorted.find((s) => toMinutes(s.startTime) > now);
  if (next) return next.subjectCode;

  return sorted[0].subjectCode;
}

export default function BackgroundFX() {
  const { sessions } = useAttendance();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync live domain vars: attendance %, horizon color, today's column.
  useEffect(() => {
    const root = document.documentElement;

    const overall = getOverallAttendance(sessions);
    const pct = overall.percentage ?? 0;

    root.style.setProperty('--attendance-pct', String(pct));
    root.style.setProperty('--horizon-color', horizonColorForLevel(overall.level));
    root.style.setProperty('--today-col', `${todayGridColumnPx()}px`);

    // Show the sun marker only once there is real attendance data.
    root.style.setProperty('--horizon-marker-opacity', overall.totalConducted > 0 ? '1' : '0');

    // Ignite the horizon above threshold.
    const horizon = document.querySelector('.bg-horizon');
    horizon?.classList.toggle('glowing', pct > GLOW_THRESHOLD);
  }, [sessions]);

  // Aurora + semester breath + subject wash: recompute on mount and as the day advances.
  useEffect(() => {
    const root = document.documentElement;

    const syncSemester = () => {
      root.style.setProperty('--semester-duration', `${semesterDurationSeconds()}s`);
      root.style.setProperty('--semester-delay', `${semesterDelaySeconds()}s`);
    };

    const syncAurora = () => {
      const triad = auroraTriadForHour();
      root.style.setProperty('--aurora-a', triad.a);
      root.style.setProperty('--aurora-b', triad.b);
      root.style.setProperty('--aurora-c', triad.c);
    };

    const syncWash = () => {
      const accent = pickAccentSubject(getTodaySlots());
      const wash = (accent && SUBJECT_COLORS[accent]) || DEFAULT_WASH_COLOR;
      root.style.setProperty('--subject-wash-color', wash);
      // Tint one aurora lobe with the subject accent for cohesion.
      root.style.setProperty('--aurora-c', complementOf(wash));
    };

    syncSemester();
    syncAurora();
    syncWash();

    const interval = setInterval(() => {
      syncAurora();
      syncWash();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Layer 5: bind the particle canvas for its lifetime.
  useEffect(() => {
    if (!canvasRef.current) return;
    initParticleCanvas(canvasRef.current);
    return () => destroyParticleCanvas();
  }, []);

  return (
    <div className="bg-layers" aria-hidden="true">
      <div className="bg-aurora" />
      <div className="bg-breath" />
      <div className="bg-stars" />
      <div className="bg-grid" />
      <div className="bg-horizon" />
      <div className="bg-wash" />
      <canvas className="bg-particles" ref={canvasRef} />
    </div>
  );
}
