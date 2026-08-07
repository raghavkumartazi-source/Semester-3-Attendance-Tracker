'use client';

import { useAttendance } from '@/components/AttendanceProvider';
import { calculateCurrentStreak } from '@/lib/calculations';
import { motion } from 'framer-motion';

export default function StreakWidget() {
  const { sessions } = useAttendance();
  
  if (!sessions || sessions.length === 0) return null;
  
  const streak = calculateCurrentStreak(sessions);
  
  // Don't show if there's no streak yet
  if (streak === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="glass-panel p-4 flex items-center justify-between mb-4 border border-orange-500/20 bg-orange-500/5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-center gap-4 z-10">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.2)]">
          <span className="text-2xl filter drop-shadow-md">🔥</span>
        </div>
        <div>
          <h3 className="text-orange-400 font-bold text-sm tracking-wide uppercase mb-0.5">Perfect Streak</h3>
          <div className="text-white text-xl font-medium">
            {streak} {streak === 1 ? 'Day' : 'Days'}
          </div>
        </div>
      </div>
      
      <div className="text-right z-10">
        <div className="text-xs text-orange-200/60 font-medium">Keep it going!</div>
      </div>
    </motion.div>
  );
}
