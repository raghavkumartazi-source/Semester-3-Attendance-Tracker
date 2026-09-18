'use client';

import { useEffect, useRef } from 'react';
import { useAttendance } from '@/components/AttendanceProvider';
import { getOverallAttendance } from '@/lib/calculations';
import { ambientColorsForHour, SUBJECT_COLORS } from '@/lib/theme';
import { initParticleCanvas, destroyParticleCanvas } from '@/lib/backgroundParticles';

export default function BackgroundFX() {
  const { sessions } = useAttendance();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drive 3D ambient colors from time of day + attendance.
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const overall = getOverallAttendance(sessions);
      const { primary, secondary } = ambientColorsForHour();

      // Set geometric shape colors
      root.style.setProperty('--geo-1', primary);
      root.style.setProperty('--geo-2', secondary);
      root.style.setProperty('--geo-3', SUBJECT_COLORS['MA-201'] || '#ffaa00');
      root.style.setProperty('--geo-4', SUBJECT_COLORS['MO-201'] || '#ff6600');
      root.style.setProperty('--geo-5', SUBJECT_COLORS['HLM'] || '#aa00ff');

      // Attendance health tint
      if (overall.level === 'DANGER') {
        root.style.setProperty('--geo-3', '#ff3344');
        root.style.setProperty('--geo-4', '#ff3344');
      } else if (overall.level === 'WARNING') {
        root.style.setProperty('--geo-3', '#ffaa00');
        root.style.setProperty('--geo-4', '#ffaa00');
      } else {
        root.style.setProperty('--geo-3', '#00ff88');
        root.style.setProperty('--geo-4', '#00ffff');
      }
    };

    sync();
    const interval = setInterval(sync, 60000);
    return () => clearInterval(interval);
  }, [sessions]);

  // Particle canvas for interaction feedback.
  useEffect(() => {
    if (!canvasRef.current) return;
    initParticleCanvas(canvasRef.current);
    return () => destroyParticleCanvas();
  }, []);

  return (
    <div className="bg-3d-layers" aria-hidden="true">
      {/* Floating geometric shapes in 3D */}
      <div className="bg-geo-shape bg-geo-1" style={{ background: 'var(--geo-1)' }} />
      <div className="bg-geo-shape bg-geo-2" style={{ background: 'var(--geo-2)' }} />
      <div className="bg-geo-shape bg-geo-3" style={{ background: 'var(--geo-3)' }} />
      <div className="bg-geo-shape bg-geo-4" style={{ background: 'var(--geo-4)' }} />
      <div className="bg-geo-shape bg-geo-5" style={{ background: 'var(--geo-5)' }} />
      
      {/* Grid pattern with 3D depth */}
      <div className="grid-3d" />
      
      {/* Particle stream canvas */}
      <canvas className="bg-particles particles-3d" ref={canvasRef} />
    </div>
  );
}