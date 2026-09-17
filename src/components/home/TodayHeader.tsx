'use client';

import { useState, useEffect, useRef } from 'react';
import { timeUtils } from '@/lib/timeUtils';
import { motion } from 'framer-motion';

function useCountUp(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (target === 0) { setCount(0); return; }
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

export function TodayHeader() {
  const [greeting, setGreeting] = useState('Good morning');
  const [dateStr, setDateStr] = useState('');
  const [progress, setProgress] = useState({ currentDay: 0, totalDays: 1, percentage: 0 });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(timeUtils.getGreeting());
    setDateStr(timeUtils.getFormattedDate());
    setProgress(timeUtils.getSemesterProgress());
  }, []);

  const animatedDay = useCountUp(progress.currentDay, 1500);
  const animatedPercentage = useCountUp(Math.round(progress.percentage), 1800);

  return (
    <div className="mb-6">
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-3xl font-extrabold tracking-tight gradient-text mb-1 drop-shadow-sm"
      >
        {greeting}
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-sm text-zinc-400 font-medium tracking-wide"
      >
        {dateStr}
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-4 glass-recessed p-3 rounded-2xl flex flex-col gap-2 relative overflow-hidden"
      >
        <div className="flex justify-between items-center z-10 relative">
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
            3rd Sem Tracker
          </span>
          <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase tabular-nums">
            Day <span className="text-white/70">{animatedDay}</span> / {progress.totalDays}
          </span>
        </div>
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden z-10 relative shadow-inner">
          <motion.div 
            className="h-full rounded-full relative progress-glow"
            style={{ 
              background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)',
              backgroundSize: '200% 100%',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          />
        </div>
        <div className="flex justify-end z-10 relative">
          <span className="text-[10px] font-bold text-emerald-400/60 tabular-nums">{animatedPercentage}% complete</span>
        </div>
      </motion.div>
    </div>
  );
}
