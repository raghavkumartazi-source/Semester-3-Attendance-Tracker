'use client';

import { useMarks } from '@/components/MarksProvider';
import { ChartBarIcon, TrophyIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

function useCountUp(target: number, duration: number = 1000, decimals: number = 2) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const factor = Math.pow(10, decimals);
      setCount(Math.round(eased * target * factor) / factor);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, decimals]);

  return count;
}

export function MarksGlanceWidget() {
  const { isLoaded, getOverallSummary } = useMarks();
  
  if (!isLoaded) return null;
  
  const summary = getOverallSummary();
  const sgpa = summary.sgpa;

  return <MarksGlanceInner sgpa={sgpa} />;
}

function MarksGlanceInner({ sgpa }: { sgpa: number | null }) {
  const animatedSgpa = useCountUp(sgpa || 0, 1400, 2);

  return (
    <motion.div 
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass-panel p-4 rounded-3xl relative overflow-hidden group h-full flex flex-col gradient-border"
    >
      <motion.div 
        className="absolute top-0 right-0 p-3"
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <TrophyIcon className="w-16 h-16 text-emerald-400 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500" />
      </motion.div>
      
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-emerald-500/20 rounded-xl">
          <ChartBarIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="font-semibold text-white/90 text-sm">Marks & Grades</h3>
      </div>
      
      <div className="flex flex-col gap-1 z-10 relative flex-1 justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <motion.span 
              className="text-3xl font-black text-white tabular-nums"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
            >
              {sgpa ? animatedSgpa.toFixed(2) : '-'}
            </motion.span>
            <span className="text-xs font-bold text-emerald-400/80 uppercase tracking-wider">
              SGPA
            </span>
          </div>
          
          <p className="text-[11px] text-white/40 mt-1">
            Projected score
          </p>
        </div>
        
        <Link 
          href="/marks"
          className="mt-3 py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs font-bold text-center text-emerald-400/90 transition-all duration-300 inline-block w-full active:scale-95"
        >
          View Scorecard →
        </Link>
      </div>
    </motion.div>
  );
}
