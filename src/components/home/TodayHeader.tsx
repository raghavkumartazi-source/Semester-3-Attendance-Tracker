'use client';

import { useState, useEffect } from 'react';
import { timeUtils } from '@/lib/timeUtils';

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

  return (
    <div className="mb-6 animate-fade-in-up">
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1 drop-shadow-sm">
        {greeting}
      </h1>
      <p className="text-sm text-zinc-400 font-medium tracking-wide">
        {dateStr}
      </p>

      <div className="mt-4 glass-recessed p-3 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
        <div className="flex justify-between items-center z-10 relative">
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
            Semester III
          </span>
          <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">
            Day {progress.currentDay} / {progress.totalDays}
          </span>
        </div>
        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden z-10 relative shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
