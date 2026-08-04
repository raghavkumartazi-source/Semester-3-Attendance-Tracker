'use client';

import { useState, useEffect } from 'react';
import { useAttendance } from '../AttendanceProvider';
import { SUBJECTS, DAY_NAMES } from '@/lib/config';
import { timeUtils } from '@/lib/timeUtils';
import AttendanceButtons from '../AttendanceButtons';
import { Session } from '@/lib/types';

export function TodayTimeline() {
  const { sessions, updateSessionStatus } = useAttendance();
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [dayName, setDayName] = useState('');

  useEffect(() => {
    // Initial setup
    const today = new Date().getDay();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDayName(DAY_NAMES[today] || '');

    const update = () => {
      setCurrentMinutes(timeUtils.getCurrentMinutes());
      
      const d = new Date();
      const localDate = d.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
      
      const filtered = sessions.filter(s => s.date === localDate);
      
      // Sort chronologically
      filtered.sort((a, b) => {
        const [ah] = a.startTime.split(':').map(Number);
        const [bh] = b.startTime.split(':').map(Number);
        return ah - bh;
      });
      
      setTodaySessions(filtered);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [sessions]);

  return (
    <div className="mb-6 animate-fade-in-up stagger-2">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
          Today&apos;s Timeline
        </h2>
        <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">{dayName}</span>
      </div>

      {todaySessions.length === 0 ? (
        <div className="glass-surface rounded-[18px] p-6 text-center">
          <p className="text-sm font-medium text-white/40">No classes scheduled today</p>
        </div>
      ) : (
        <div className="space-y-3 relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[20px] top-4 bottom-4 w-px bg-white/10 z-0" />
          
          {todaySessions.map((session, i) => {
            const subject = SUBJECTS.find(s => s.code === session.subjectCode);
            const [h, m] = session.startTime.split(':').map(Number);
            const startTotal = h * 60 + m;
            const endTotal = startTotal + (session.classType === 'Lab' ? 120 : 60);
            
            const isNow = currentMinutes >= startTotal && currentMinutes <= endTotal;
            const isPast = currentMinutes > endTotal;

            return (
              <div
                key={session.id}
                className={`animate-slide-in-right stagger-${Math.min(i + 3, 8)} flex items-center relative z-10 ${
                  isPast ? 'opacity-60' : ''
                }`}
              >
                {/* Timeline node */}
                <div className={`w-[40px] flex justify-center shrink-0`}>
                  <div className={`w-2.5 h-2.5 rounded-full outline outline-4 outline-[#07080b] ${
                    isNow ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]' :
                    session.status === 'PRESENT' ? 'bg-emerald-500' :
                    session.status === 'ABSENT' ? 'bg-amber-500' :
                    session.status === 'CANCELLED' ? 'bg-zinc-500' :
                    'bg-white/20'
                  }`} />
                </div>
                
                <div className={`flex-1 glass-elevated rounded-[18px] px-4 py-3 relative overflow-hidden transition-all duration-300 ${
                  isNow ? 'border-red-500/20 bg-red-500/5' : ''
                }`}>
                  {isNow && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-20" />
                  )}
                  
                  <div className="flex items-center justify-between z-10 relative">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200 tracking-wide drop-shadow-sm">
                          {session.subjectCode}
                        </span>
                        {isNow && (
                          <span className="text-[9px] rounded-full border px-1.5 py-0.5 font-bold bg-red-500/20 text-red-300 border-red-500/30">
                            NOW
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium text-white/50 truncate">
                        {session.startTime} · {subject?.name}
                      </p>
                    </div>
                    
                    <div className="shrink-0 ml-3">
                      <AttendanceButtons
                        status={session.status}
                        onMark={(status) => updateSessionStatus(session.id, status)}
                        compact
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
