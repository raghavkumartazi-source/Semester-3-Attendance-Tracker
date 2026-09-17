'use client';

import { usePlanner } from '@/components/PlannerProvider';
import { CalendarDaysIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

function useCountUp(target: number, duration: number = 1000) {
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
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

export function PlannerGlanceWidget() {
  const { isLoaded, exams } = usePlanner();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);
  
  if (!isLoaded || now === null) return null;
  
  const upcomingExams = [...exams]
    .filter(e => new Date(e.exam_date).getTime() > now)
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
    
  const nextExam = upcomingExams[0];
  
  const daysUntil = nextExam 
    ? Math.ceil((new Date(nextExam.exam_date).getTime() - now) / (1000 * 60 * 60 * 24))
    : null;

  return <PlannerGlanceInner nextExam={nextExam} daysUntil={daysUntil} />;
}

function PlannerGlanceInner({ nextExam, daysUntil }: { nextExam: { exam_name: string; subject_code: string } | null; daysUntil: number | null }) {
  const animatedDays = useCountUp(daysUntil || 0, 1200);
  
  return (
    <motion.div 
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass-panel p-4 rounded-3xl relative overflow-hidden group h-full flex flex-col gradient-border"
    >
      <motion.div 
        className="absolute top-0 right-0 p-3"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AcademicCapIcon className="w-16 h-16 text-indigo-400 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500" />
      </motion.div>
      
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-indigo-500/20 rounded-xl">
          <CalendarDaysIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <h3 className="font-semibold text-white/90 text-sm">Exam Planner</h3>
      </div>
      
      <div className="flex flex-col gap-1 z-10 relative flex-1 justify-between">
        <div>
          {nextExam ? (
            <>
              <div className="flex items-baseline gap-2">
                <motion.span 
                  className="text-3xl font-black text-white tabular-nums"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
                >
                  {animatedDays}
                </motion.span>
                <span className="text-xs font-bold text-indigo-400/80 uppercase tracking-wider">
                  Days Left
                </span>
              </div>
              
              <p className="text-[11px] text-white/40 mt-1 truncate" title={`${nextExam.exam_name} (${nextExam.subject_code})`}>
                Until {nextExam.exam_name}
              </p>
            </>
          ) : (
            <div className="py-2">
              <p className="text-sm text-white/50">No upcoming exams</p>
            </div>
          )}
        </div>
        
        <Link 
          href="/planner"
          className="mt-3 py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-xs font-bold text-center text-indigo-400/90 transition-all duration-300 inline-block w-full active:scale-95"
        >
          View Planner →
        </Link>
      </div>
    </motion.div>
  );
}
