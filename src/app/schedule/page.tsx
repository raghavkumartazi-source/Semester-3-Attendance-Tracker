'use client';

import { useState, useEffect } from 'react';
import { TIMETABLE, SUBJECTS, DAY_NAMES } from '@/lib/config';

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon-Fri

export default function SchedulePage() {
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const today = new Date().getDay();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-8 pb-24">
      <h1 className="text-lg font-bold text-white animate-fade-in-up stagger-1 px-1">Weekly Schedule</h1>

      {WEEKDAYS.map(day => {
        const daySlots = TIMETABLE
          .filter(s => s.day === day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        const isToday = day === today;

        if (daySlots.length === 0) return null;

        return (
          <div key={day} className={`animate-fade-in-up stagger-${Math.min(day, 8)}`}>
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <h2 className={`text-[11px] font-bold tracking-widest uppercase ${
                isToday ? 'text-white' : 'text-white/40'
              }`}>
                {DAY_NAMES[day]}
              </h2>
              {isToday && (
                <span className="glass-control-active rounded-full px-2.5 py-0.5 text-[9px] font-bold text-white tracking-wider shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                  TODAY
                </span>
              )}
            </div>

            <div className={`relative pl-4 ml-2 border-l-2 ${isToday ? 'border-white/20' : 'border-white/5'} py-2`}>
              <div className="space-y-6">
                {daySlots.map((slot) => {
                  const subject = SUBJECTS.find(s => s.code === slot.subjectCode);
                  const [h, m] = slot.startTime.split(':').map(Number);
                  const startMins = h * 60 + m;
                  const endMins = startMins + (slot.classType === 'Lab' ? 120 : 60);
                  
                  const isNow = isToday && currentMinutes >= startMins && currentMinutes <= endMins;
                  const isPast = isToday && currentMinutes > endMins;

                  return (
                    <div
                      key={`${slot.subjectCode}-${slot.startTime}`}
                      className={`relative flex items-start gap-4 transition-all duration-300 ${isPast ? 'opacity-40 grayscale-[50%]' : ''}`}
                    >
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[21px] mt-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                        isNow ? 'bg-red-500 border-red-500 now-pulse' :
                        isToday && !isPast ? 'bg-white border-white' :
                        'bg-[#07080b] border-white/20'
                      }`} />

                      <div className="w-12 pt-0.5 shrink-0">
                        <span className={`text-[11px] font-semibold tabular-nums ${isNow ? 'text-red-400' : 'text-white/60'}`}>
                          {slot.startTime}
                        </span>
                      </div>

                      <div className={`flex-1 glass-elevated rounded-[16px] p-4 relative overflow-hidden ${
                        isNow ? 'border-red-500/30 bg-red-500/[0.03]' : ''
                      }`}>
                        {isNow && (
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
                        )}
                        
                        <div className="flex items-start justify-between relative z-10">
                          <div>
                            <p className={`text-[13px] font-bold ${isNow ? 'text-white' : 'text-white/90'}`}>
                              {slot.subjectCode}
                            </p>
                            <p className="text-[11px] text-white/50 mt-0.5 leading-tight pr-2">
                              {subject?.name}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wider border shrink-0 ${
                            slot.classType === 'Lab' ? 'bg-purple-400/10 text-purple-300/80 border-purple-500/15' :
                            slot.classType === 'Tutorial' ? 'bg-blue-400/10 text-blue-300/80 border-blue-500/15' :
                            'bg-white/[0.06] text-white/50 border-white/[0.08]'
                          }`}>
                            {slot.classType}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
