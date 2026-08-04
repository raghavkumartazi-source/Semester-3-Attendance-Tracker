'use client';

import Link from 'next/link';
import { useAttendance } from '../AttendanceProvider';
import { getOverallAttendance, getSubjectAttendance } from '@/lib/calculations';
import { SUBJECTS } from '@/lib/config';

export function AttendanceSnapshot() {
  const { sessions } = useAttendance();

  const overall = getOverallAttendance(sessions);
  const subjectStats = SUBJECTS.map(subject => ({
    subject,
    attendance: getSubjectAttendance(sessions.filter(s => s.subjectCode === subject.code))
  }));

  const needsAttention = subjectStats.filter(s => s.attendance.level === 'WARNING' || s.attendance.level === 'DANGER');

  return (
    <div className="mb-6 animate-fade-in-up stagger-5">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
          Attendance Snapshot
        </h2>
        <Link 
          href="/subjects" 
          className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider active:scale-95 transition-transform"
        >
          View Full →
        </Link>
      </div>

      <div className="glass-surface rounded-[22px] p-5">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-3xl font-extrabold text-white tracking-tight mr-2 drop-shadow-md">
              {Math.round(overall.percentage || 0)}%
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
              overall.level === 'SAFE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
              overall.level === 'WARNING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
              overall.level === 'DANGER' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
              'text-zinc-400 bg-white/5 border-white/10'
            }`}>
              {overall.level}
            </span>
          </div>
          
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Present</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums">{overall.totalPresent}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Absent</p>
              <p className="text-lg font-bold text-red-400 tabular-nums">{overall.totalAbsent}</p>
            </div>
          </div>
        </div>

        {needsAttention.length > 0 ? (
          <div>
            <h3 className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest mb-3 pb-2 border-b border-white/5">
              Needs Attention
            </h3>
            <div className="space-y-3">
              {needsAttention.map(({ subject, attendance }) => (
                <div key={subject.code} className="flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-200">{subject.code}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${attendance.level === 'DANGER' ? 'text-red-400' : 'text-amber-400'}`}>
                      {Math.round(attendance.percentage || 0)}%
                    </span>
                    <span className="text-[10px] font-medium text-white/50 w-24 text-right truncate">
                      {attendance.needToAttend > 0 ? `Attend next ${attendance.needToAttend}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest mb-3 pb-2 border-b border-white/5">
              Needs Attention
            </h3>
            <p className="text-sm font-medium text-white/40">All subjects are above 75%.</p>
          </div>
        )}
      </div>
    </div>
  );
}
