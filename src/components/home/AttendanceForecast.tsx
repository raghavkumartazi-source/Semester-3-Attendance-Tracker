'use client';

import { Subject, Session } from '@/lib/types';
import { getSubjectAttendance, calculateStatus, getStatusColor } from '@/lib/calculations';
import { useMemo } from 'react';
import { SEMESTER_END } from '@/lib/config';

interface Props {
  subjects: Subject[];
  sessions: Session[];
}

export default function AttendanceForecast({ subjects, sessions }: Props) {
  const forecasts = useMemo(() => {
    return subjects.map(subject => {
      const subjectSessions = sessions.filter(s => s.subjectCode === subject.code);
      const stats = getSubjectAttendance(subjectSessions);
      const unmarkedCount = sessions.filter(
        s => s.subjectCode === subject.code && s.status === 'UNMARKED'
      ).length;
      
      const totalFuture = stats.totalConducted + unmarkedCount;
      
      // Best case: attend all remaining
      const bestCasePresent = stats.present + unmarkedCount;
      const bestCase = totalFuture > 0 ? Math.round((bestCasePresent / totalFuture) * 100) : 0;
      
      // Worst case: miss all remaining
      const worstCase = totalFuture > 0 ? Math.round((stats.present / totalFuture) * 100) : 0;
      
      // Trend case: continue at current percentage
      const currentRate = stats.totalConducted > 0 ? (stats.present / stats.totalConducted) : 0;
      const trendCasePresent = stats.present + Math.round(unmarkedCount * currentRate);
      const trendCase = totalFuture > 0 ? Math.round((trendCasePresent / totalFuture) * 100) : 0;

      return {
        subject,
        stats,
        unmarkedCount,
        bestCase,
        worstCase,
        trendCase,
        trendStatus: calculateStatus(trendCasePresent, totalFuture - trendCasePresent)
      };
    }).filter(f => f.unmarkedCount > 0);
  }, [subjects, sessions]);

  if (forecasts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
          End of Semester Forecast
        </h2>
        <span className="text-[10px] text-white/40">By {SEMESTER_END.split('-').reverse().slice(0,2).join('/')}</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {forecasts.map(f => {
          const statusColor = getStatusColor(f.trendStatus);
          const currentPercentage = f.stats.percentage ?? 0;
          
          return (
            <div key={f.subject.code} className="glass-elevated rounded-[18px] p-4 relative overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-r ${statusColor.replace('bg-', 'from-').replace('500', '500/5')} to-transparent pointer-events-none`} />
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white drop-shadow-sm flex items-center gap-2">
                    {f.subject.code}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      f.trendStatus === 'SAFE' ? 'bg-emerald-500/10 text-emerald-400' :
                      f.trendStatus === 'WARNING' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {f.trendCase}% Projected
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/50 mt-1">
                    At your current rate ({currentPercentage}%), you will end the semester at {f.trendCase}%.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between bg-white/[0.02] rounded-xl px-3 py-2">
                  <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Best Case</span>
                  <span className="text-xs font-bold text-emerald-400">{f.bestCase}%</span>
                </div>
                <div className="flex items-center justify-between bg-white/[0.02] rounded-xl px-3 py-2">
                  <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Worst Case</span>
                  <span className="text-xs font-bold text-red-400">{f.worstCase}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
