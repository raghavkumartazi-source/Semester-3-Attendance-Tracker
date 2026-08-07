'use client';

import { useAttendance } from '@/components/AttendanceProvider';
import { Session } from '@/lib/types';
import { motion } from 'framer-motion';

export function AttendanceHeatmap() {
  const { sessions } = useAttendance();

  if (!sessions || sessions.length === 0) return null;

  // Generate the last 90 days
  const today = new Date();
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  // Group by date
  const byDate: Record<string, Session[]> = {};
  for (const s of sessions) {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  }

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">Consistency</h2>
        <span className="text-xs text-zinc-500 font-medium">Last 90 days</span>
      </div>
      
      <div className="flex gap-1 flex-wrap">
        {days.map((dateStr, i) => {
          const daySessions = byDate[dateStr] || [];
          let color = 'bg-white/5 border border-white/5'; // default/no class

          if (daySessions.length > 0) {
            let hasAbsent = false;
            let hasPresent = false;
            let hasCancelled = false;

            for (const s of daySessions) {
              if (s.status === 'ABSENT') hasAbsent = true;
              else if (s.status === 'PRESENT') hasPresent = true;
              else if (s.status === 'CANCELLED') hasCancelled = true;
            }

            if (hasAbsent && hasPresent) {
              color = 'bg-amber-500/80 border border-amber-400/50'; // mixed
            } else if (hasAbsent) {
              color = 'bg-red-500/80 border border-red-400/50';
            } else if (hasPresent) {
              color = 'bg-emerald-500/80 border border-emerald-400/50';
            } else if (hasCancelled) {
              color = 'bg-zinc-500/80 border border-zinc-400/50';
            } else {
              color = 'bg-white/10 border border-white/10'; // unmarked
            }
          }

          return (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.005 }}
              className={`w-[14px] h-[14px] rounded-sm ${color} relative group cursor-pointer`}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[10px] text-zinc-400 uppercase font-medium">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-white/5 border border-white/5" /> None</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-emerald-500/80" /> Present</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-500/80" /> Mixed</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-500/80" /> Absent</div>
      </div>
    </div>
  );
}
