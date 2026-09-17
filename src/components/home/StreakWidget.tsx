'use client';

import { useEffect, useRef } from 'react';
import { useAttendance } from '@/components/AttendanceProvider';
import { calculateCurrentStreak } from '@/lib/calculations';
import { emitParticleBurst } from '@/lib/backgroundParticles';
import { motion } from 'framer-motion';

// Milestones: every 5 days the streak ignites the background.
const isMilestone = (streak: number) => streak >= 5 && streak % 5 === 0;

export default function StreakWidget() {
  const { sessions } = useAttendance();
  const widgetRef = useRef<HTMLDivElement>(null);
  const prevStreakRef = useRef(0);

  const streak = calculateCurrentStreak(sessions);

  // Fire an orange burst from the widget when a milestone is crossed.
  useEffect(() => {
    if (streak === prevStreakRef.current) return;
    const crossed = isMilestone(streak) && !isMilestone(prevStreakRef.current);
    prevStreakRef.current = streak;

    if (!crossed || !widgetRef.current) return;
    const r = widgetRef.current.getBoundingClientRect();
    emitParticleBurst(r.left + r.width / 2, r.top + r.height / 2, 'oklch(65% 0.20 340)', 'streak');
  }, [streak]);

  if (!sessions || sessions.length === 0) return null;

  // Don't show if there's no streak yet
  if (streak === 0) return null;

  return (
    <motion.div
      ref={widgetRef}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="glass-panel p-4 flex items-center justify-between border border-orange-500/20 bg-orange-500/5 relative overflow-hidden"
    >
      {/* Sparkle particles */}
      <div className="sparkle-container">
        <div className="sparkle-dot" />
        <div className="sparkle-dot" />
        <div className="sparkle-dot" />
        <div className="sparkle-dot" />
      </div>
      
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-center gap-4 z-10">
        <motion.div 
          className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.25)]"
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-2xl fire-bounce filter drop-shadow-md">🔥</span>
        </motion.div>
        <div>
          <h3 className="text-orange-400 font-bold text-xs tracking-widest uppercase mb-0.5">Perfect Streak</h3>
          <motion.div 
            className="text-white text-2xl font-black tabular-nums"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          >
            {streak} <span className="text-base font-semibold text-white/60">{streak === 1 ? 'Day' : 'Days'}</span>
          </motion.div>
        </div>
      </div>
      
      <div className="text-right z-10">
        <motion.div 
          className="text-xs text-orange-200/60 font-bold"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Keep it going!
        </motion.div>
      </div>
    </motion.div>
  );
}
