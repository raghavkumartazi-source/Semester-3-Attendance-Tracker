'use client';

import { useState, useEffect } from 'react';
import { TIMETABLE, SUBJECTS } from '@/lib/config';
import { timeUtils } from '@/lib/timeUtils';
import { motion, AnimatePresence } from 'framer-motion';

export function NextClass() {
  const [nextInfo, setNextInfo] = useState<{
    subjectName?: string;
    subjectCode?: string;
    type?: string;
    timeStr?: string;
    statusStr?: string;
    isNow?: boolean;
    progressPercent?: number;
    state: 'no-classes' | 'finished' | 'active';
  } | null>(null);

  useEffect(() => {
    const update = () => {
      const todayDay = new Date().getDay();
      const todayClasses = TIMETABLE.filter(t => t.day === todayDay);
      
      if (todayClasses.length === 0) {
        setNextInfo({ state: 'no-classes' });
        return;
      }

      const currentMinutes = timeUtils.getCurrentMinutes();
      
      const sorted = [...todayClasses].sort((a, b) => {
        const [ah] = a.startTime.split(':').map(Number);
        const [bh] = b.startTime.split(':').map(Number);
        return ah - bh;
      });

      let activeOrNext = null;
      let isNow = false;

      for (const cls of sorted) {
        const [sh, sm] = cls.startTime.split(':').map(Number);
        const startTotal = sh * 60 + sm;
        const [eh, em] = cls.endTime.split(':').map(Number);
        const endTotal = eh * 60 + em;

        if (currentMinutes >= startTotal && currentMinutes <= endTotal) {
          activeOrNext = cls;
          isNow = true;
          break;
        }
        
        if (currentMinutes < startTotal) {
          if (!activeOrNext) {
            activeOrNext = cls;
          }
        }
      }

      if (!activeOrNext) {
        setNextInfo({ state: 'finished' });
        return;
      }

      const subject = SUBJECTS.find(s => s.code === activeOrNext.subjectCode);
      const [sh, sm] = activeOrNext.startTime.split(':').map(Number);
      const startTotal = sh * 60 + sm;
      const [eh, em] = activeOrNext.endTime.split(':').map(Number);
      const endTotal = eh * 60 + em;

      let statusStr = '';
      let progressPercent = 0;
      
      if (isNow) {
        const endsIn = endTotal - currentMinutes;
        const totalDuration = endTotal - startTotal;
        progressPercent = ((currentMinutes - startTotal) / totalDuration) * 100;
        statusStr = `Ends in ${endsIn} min`;
      } else {
        const startsIn = startTotal - currentMinutes;
        if (startsIn < 60) {
          statusStr = `Starts in ${startsIn} min`;
        } else {
          const hrs = Math.floor(startsIn / 60);
          const mins = startsIn % 60;
          statusStr = `Starts in ${hrs}h ${mins}m`;
        }
      }

      setNextInfo({
        state: 'active',
        subjectCode: activeOrNext.subjectCode,
        subjectName: subject?.name || '',
        type: activeOrNext.classType,
        timeStr: `${activeOrNext.startTime} – ${activeOrNext.endTime}`,
        statusStr,
        isNow,
        progressPercent
      });
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!nextInfo) return null;

  if (nextInfo.state === 'no-classes') {
    return (
      <div className="mb-6">
        <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-3">
          Next Class
        </h2>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface rounded-2xl p-5 text-center"
        >
          <p className="text-sm font-medium text-white/40">🌴 No classes today</p>
        </motion.div>
      </div>
    );
  }

  if (nextInfo.state === 'finished') {
    return (
      <div className="mb-6">
        <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-3">
          Next Class
        </h2>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface rounded-2xl p-5 text-center"
        >
          <p className="text-sm font-medium text-white/40 flex items-center justify-center gap-2">
            Classes finished for today <span className="text-emerald-400">✓</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-3">
        {nextInfo.isNow ? 'Current Class' : 'Next Class'}
      </h2>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className={`glass-elevated rounded-[22px] p-5 relative overflow-hidden transition-all duration-300 ${
          nextInfo.isNow ? 'border-red-500/20 bg-red-500/5' : ''
        }`}
      >
        {/* Active class side accent */}
        <AnimatePresence>
          {nextInfo.isNow && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              className="absolute top-0 left-0 w-1.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]" 
            />
          )}
        </AnimatePresence>
        
        <div className="flex justify-between items-start mb-1">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-200 tracking-wide drop-shadow-sm">
              {nextInfo.subjectCode}
            </span>
            <span className="text-lg font-bold text-white tracking-tight drop-shadow-md">
              {nextInfo.subjectName}
            </span>
          </div>
          {nextInfo.isNow ? (
            <span className="text-[10px] font-bold rounded-full border px-2.5 py-1 bg-red-500/20 text-red-300 border-red-500/30 now-badge">
              NOW
            </span>
          ) : (
            <span className="text-[10px] font-bold rounded-full border px-2.5 py-1 bg-white/10 text-zinc-300 border-white/5">
              {nextInfo.type}
            </span>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
          <span className="text-[11px] font-medium text-white/50 tracking-wider">
            {nextInfo.timeStr}
          </span>
          <motion.span 
            className={`text-[11px] font-bold tracking-wider ${nextInfo.isNow ? 'text-red-400' : 'text-emerald-400'}`}
            key={nextInfo.statusStr}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {nextInfo.statusStr}
          </motion.span>
        </div>

        {/* Progress bar for current class */}
        {nextInfo.isNow && nextInfo.progressPercent !== undefined && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3"
          >
            <div className="h-1 w-full bg-black/30 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full progress-glow"
                initial={{ width: 0 }}
                animate={{ width: `${nextInfo.progressPercent}%` }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
