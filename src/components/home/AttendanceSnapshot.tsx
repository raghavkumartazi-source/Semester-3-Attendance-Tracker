'use client';

import Link from 'next/link';
import { useAttendance } from '../AttendanceProvider';
import { getOverallAttendance, getSubjectAttendance } from '@/lib/calculations';
import { SUBJECTS } from '@/lib/config';
import { motion } from 'framer-motion';

function AnimatedRing({ percentage, level }: { percentage: number; level: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap: Record<string, string> = {
    SAFE: '#10b981',
    WARNING: '#f59e0b',
    DANGER: '#ef4444',
  };

  const color = colorMap[level] || '#71717a';

  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
        />
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-black text-white tabular-nums">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

export function AttendanceSnapshot() {
  const { sessions } = useAttendance();

  const overall = getOverallAttendance(sessions);
  const subjectStats = SUBJECTS.map(subject => ({
    subject,
    attendance: getSubjectAttendance(sessions.filter(s => s.subjectCode === subject.code))
  }));

  const needsAttention = subjectStats.filter(s => s.attendance.level === 'WARNING' || s.attendance.level === 'DANGER');

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
          Attendance Snapshot
        </h2>
        <Link 
          href="/subjects" 
          className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider active:scale-95 transition-transform border border-emerald-500/20"
        >
          View Full →
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-surface rounded-[22px] p-5"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
              overall.level === 'SAFE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
              overall.level === 'WARNING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
              overall.level === 'DANGER' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
              'text-zinc-400 bg-white/5 border-white/10'
            }`}>
              {overall.level}
            </span>
            
            <div className="flex gap-5 mt-4">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Present</p>
                <p className="text-xl font-black text-emerald-400 tabular-nums">{overall.totalPresent}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Absent</p>
                <p className="text-xl font-black text-red-400 tabular-nums">{overall.totalAbsent}</p>
              </div>
            </div>
          </div>
          
          <AnimatedRing percentage={overall.percentage || 0} level={overall.level} />
        </div>

        {needsAttention.length > 0 ? (
          <div>
            <h3 className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest mb-3 pb-2 border-b border-white/5">
              Needs Attention
            </h3>
            <div className="space-y-3">
              {needsAttention.map(({ subject, attendance }, i) => (
                <motion.div 
                  key={subject.code} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm font-bold text-zinc-200">{subject.code}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full ${attendance.level === 'DANGER' ? 'bg-red-500' : 'bg-amber-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${attendance.percentage || 0}%` }}
                        transition={{ duration: 1, delay: 0.2 + 0.1 * i }}
                      />
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${attendance.level === 'DANGER' ? 'text-red-400' : 'text-amber-400'}`}>
                      {Math.round(attendance.percentage || 0)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest mb-3 pb-2 border-b border-white/5">
              Status
            </h3>
            <p className="text-sm font-medium text-white/40">✅ All subjects are above 75%.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
