'use client';

import { TIMETABLE, SUBJECTS, DAY_NAMES } from '@/lib/config';

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon-Fri

export default function SchedulePage() {
  const today = new Date().getDay();

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24">
      <h1 className="text-lg font-bold text-white animate-fade-in-up stagger-1">Weekly Schedule</h1>

      {WEEKDAYS.map(day => {
        const daySlots = TIMETABLE
          .filter(s => s.day === day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        const isToday = day === today;

        return (
          <div key={day} className={`animate-fade-in-up stagger-${Math.min(day, 5)}`}>
            <div className="flex items-center gap-2.5 mb-2.5 px-1">
              <h2 className={`text-[11px] font-bold tracking-widest uppercase ${
                isToday ? 'text-white' : 'text-white/40'
              }`}>
                {DAY_NAMES[day]}
              </h2>
              {isToday && (
                <span className="glass-control-active rounded-full px-2.5 py-0.5 text-[9px] font-bold text-white tracking-wider">
                  TODAY
                </span>
              )}
            </div>

            <div className={`rounded-[18px] overflow-hidden transition-all duration-300 ${
              isToday ? 'glass-surface' : 'glass-elevated'
            }`}>
              {daySlots.map((slot, i) => {
                const subject = SUBJECTS.find(s => s.code === slot.subjectCode);
                return (
                  <div
                    key={`${slot.subjectCode}-${slot.startTime}`}
                    className={`flex items-center justify-between px-4 py-3.5 relative z-10 ${
                      i !== daySlots.length - 1 ? 'border-b border-white/[0.06]' : ''
                    } hover:bg-white/[0.03] transition-colors`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-semibold text-white/60 tabular-nums w-12">
                        {slot.startTime}
                      </span>
                      <div>
                        <p className="text-[12px] font-bold text-white/90">{slot.subjectCode}</p>
                        <p className="text-[10px] text-white/40 truncate max-w-[180px]">{subject?.name}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wider border ${
                      slot.classType === 'Lab' ? 'bg-purple-400/10 text-purple-300/80 border-purple-500/15' :
                      slot.classType === 'Tutorial' ? 'bg-blue-400/10 text-blue-300/80 border-blue-500/15' :
                      'bg-white/[0.06] text-white/50 border-white/[0.08]'
                    }`}>
                      {slot.classType}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
