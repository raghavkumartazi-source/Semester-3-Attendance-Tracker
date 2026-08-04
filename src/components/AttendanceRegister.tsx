'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Session, AttendanceStatus, ClassType } from '@/lib/types';
import { Subject } from '@/lib/types';
import { DAY_SHORT, MONTH_SHORT } from '@/lib/config';
import { getSubjectAttendance, formatPercentage, getStatusColor, getStatusLabel } from '@/lib/calculations';
import { parseDate, formatDate } from '@/lib/sessions';

interface Props {
  subject: Subject;
  sessions: Session[];
  onMarkAttendance: (sessionId: string, status: AttendanceStatus) => void;
}

const TYPE_SHORT: Record<ClassType, string> = {
  Lecture: 'Lec',
  Tutorial: 'Tut',
  Lab: 'Lab',
};

const STATUS_DISPLAY: Record<AttendanceStatus, string> = {
  PRESENT: 'P',
  ABSENT: 'A',
  CANCELLED: 'C',
  UNMARKED: '—',
};

function getStatusCellClass(status: AttendanceStatus): string {
  switch (status) {
    case 'PRESENT':
      return 'bg-gradient-to-b from-emerald-500/35 to-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[inset_0_1px_0_rgba(52,211,153,0.4),0_0_12px_rgba(16,185,129,0.2)] font-bold';
    case 'ABSENT':
      return 'bg-gradient-to-b from-red-500/35 to-red-500/15 text-red-300 border-red-400/40 shadow-[inset_0_1px_0_rgba(248,113,113,0.4),0_0_12px_rgba(239,68,68,0.2)] font-bold';
    case 'CANCELLED':
      return 'bg-gradient-to-b from-white/10 to-white/[0.04] text-zinc-300 border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] font-medium';
    case 'UNMARKED':
      return 'glass-recessed text-white/20 hover:bg-white/[0.06] !border-white/[0.03]';
  }
}

export default function AttendanceRegister({ subject, sessions, onMarkAttendance }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLDivElement>(null);
  const [activePopover, setActivePopover] = useState<string | null>(null);

  const todayStr = formatDate(new Date());

  // Sort sessions chronologically
  const sorted = useMemo(() =>
    [...sessions].sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
    }),
    [sessions]
  );

  const attendance = useMemo(() => getSubjectAttendance(sessions), [sessions]);

  // Auto-scroll to today on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayColRef.current && scrollRef.current) {
        const container = scrollRef.current;
        const todayEl = todayColRef.current;
        // Scroll so today is visible with some previous context
        const offset = todayEl.offsetLeft - 200;
        container.scrollLeft = Math.max(0, offset);
      } else if (scrollRef.current) {
        // If no class today, scroll to the nearest future session
        const container = scrollRef.current;
        const futureCol = container.querySelector('[data-future="first"]') as HTMLElement;
        if (futureCol) {
          container.scrollLeft = Math.max(0, futureCol.offsetLeft - 200);
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToToday = useCallback(() => {
    if (todayColRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const todayEl = todayColRef.current;
      container.scrollTo({
        left: Math.max(0, todayEl.offsetLeft - 200),
        behavior: 'smooth',
      });
    }
  }, []);

  const scrollBy = useCallback((direction: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction * 300,
        behavior: 'smooth',
      });
    }
  }, []);

  const scrollToStart = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleStatusChange = useCallback((sessionId: string, status: AttendanceStatus) => {
    onMarkAttendance(sessionId, status);
    setActivePopover(null);
  }, [onMarkAttendance]);

  // Close popover on outside click
  useEffect(() => {
    if (!activePopover) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-popover]')) {
        setActivePopover(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [activePopover]);

  // Determine first future session for auto-scroll fallback
  const firstFutureSession = sorted.find(s => s.date > todayStr);
  const firstFutureId = firstFutureSession?.id;
  const { percentage, present, absent, totalConducted, canBunk, needToAttend, level } = attendance;
  const isUndefinedLTP = subject.lectures === 0 && subject.tutorials === 0 && subject.practicals === 0;
  const ltp = isUndefinedLTP ? '-' : `${subject.lectures}-${subject.tutorials}-${subject.practicals}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-surface rounded-[20px] p-6">
        <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
          {subject.code}
        </p>
        <h1 className="mt-1 text-xl font-bold text-white">{subject.name}</h1>
        <p className="mt-2 inline-block rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-medium text-white/60">
          L-T-P: {ltp}
        </p>
      </div>

      {/* Compact Stats Bar */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <StatBox
          label="Attendance"
          value={formatPercentage(percentage)}
          color={getStatusColor(level)}
        />
        <StatBox label="Present" value={String(present)} color="text-emerald-400 drop-shadow-sm" />
        <StatBox label="Absent" value={String(absent)} color="text-red-400 drop-shadow-sm" />
        <StatBox label="Conducted" value={String(totalConducted)} color="text-zinc-300 drop-shadow-sm" />
        <StatBox
          label={needToAttend > 0 ? 'Attend Next' : 'Can Bunk'}
          value={totalConducted === 0 ? '—' : String(needToAttend > 0 ? needToAttend : canBunk)}
          color={needToAttend > 0 ? 'text-red-400 drop-shadow-sm' : 'text-emerald-400 drop-shadow-sm'}
        />
        <div className="glass-elevated flex flex-col items-center justify-center rounded-[16px] px-2 py-2.5">
          <span className={`text-[10px] font-bold tracking-[0.15em] uppercase ${getStatusColor(level)}`}>
            {getStatusLabel(level)}
          </span>
          <span className="text-[8px] text-white/40 uppercase tracking-widest mt-0.5">Status</span>
        </div>
      </div>

      {/* Register Navigation */}
      <div className="flex items-center justify-between">
        <div className="glass-elevated rounded-[14px] flex items-center gap-px p-1">
          <button onClick={scrollToStart} className="glass-control rounded-[10px] px-3 py-1.5 text-[10px] font-semibold text-white/60 hover:text-white tracking-wide">Start</button>
          <button onClick={() => scrollBy(-1)} className="glass-control rounded-[10px] px-3 py-1.5 text-[10px] font-semibold text-white/60 hover:text-white">‹</button>
        </div>
        <div className="glass-elevated rounded-[14px] flex items-center gap-px p-1">
          <button onClick={scrollToToday} className="glass-control-active rounded-[10px] px-4 py-1.5 text-[10px] font-bold text-white tracking-wider">TODAY</button>
          <button onClick={() => scrollBy(1)} className="glass-control rounded-[10px] px-3 py-1.5 text-[10px] font-semibold text-white/60 hover:text-white">›</button>
        </div>
      </div>

      {/* === THE REGISTER === */}
      <div className="glass-surface rounded-[20px] overflow-hidden">
        <div ref={scrollRef} className="overflow-x-auto scrollbar-thin">
          <div className="flex min-w-max">
            {/* Sticky Left Labels */}
            <div className="sticky left-0 z-20 flex-shrink-0 glass-frozen">
              <RowLabel text="DATE" isHeader />
              <RowLabel text="DAY" />
              <RowLabel text="TIME" />
              <RowLabel text="TYPE" />
              <RowLabel text="ME" isBold isLast />
            </div>

            {/* Session Columns */}
            {sorted.map((session) => {
              const d = parseDate(session.date);
              const dateLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
              const dayLabel = DAY_SHORT[d.getDay()];
              const isToday = session.date === todayStr;
              const isFuture = session.date > todayStr;
              const isFirstFuture = session.id === firstFutureId;

              const colBg = isToday
                ? 'bg-white/5'
                : isFuture
                ? 'bg-white/[0.02]'
                : '';

              const textMuted = isFuture ? 'text-white/40' : 'text-white/60';

              return (
                <div
                  key={session.id}
                  ref={isToday ? todayColRef : undefined}
                  data-future={isFirstFuture ? 'first' : undefined}
                  className={`flex-shrink-0 border-r border-white/[0.05] ${colBg} ${
                    isToday ? '' : ''
                  }`}
                  style={{ width: '60px' }}
                >
                  {/* Date */}
                  <div className={`flex h-9 items-center justify-center border-b border-white/[0.06] text-[11px] font-semibold ${
                    isToday ? 'text-white' : textMuted
                  }`}
                  style={isToday ? {
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                  } : undefined}
                  >
                    {dateLabel}
                  </div>
                  {/* Day */}
                  <div className={`flex h-8 items-center justify-center border-b border-white/[0.06] text-[10px] ${textMuted}`}>
                    {dayLabel}
                  </div>
                  {/* Time */}
                  <div className={`flex h-8 items-center justify-center border-b border-white/[0.06] text-[10px] tabular-nums ${textMuted}`}>
                    {session.startTime}
                  </div>
                  {/* Type */}
                  <div className={`flex h-8 items-center justify-center border-b border-white/[0.08] text-[10px] ${
                    session.classType === 'Lab' ? 'text-purple-400' :
                    session.classType === 'Tutorial' ? 'text-blue-400' :
                    textMuted
                  }`}>
                    {TYPE_SHORT[session.classType]}
                  </div>
                  {/* Attendance Cell */}
                  <div className="relative flex h-11 items-center justify-center" data-popover>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopover(activePopover === session.id ? null : session.id);
                      }}
                      className={`flex h-9 w-[52px] items-center justify-center rounded-[6px] border text-sm transition-all duration-200 hover:brightness-110 active:scale-90 cursor-pointer ${getStatusCellClass(session.status)}`}
                      title={`${subject.code}\n${String(d.getDate()).padStart(2, '0')} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}\n${session.startTime}–${session.endTime}\n${session.classType}`}
                    >
                      {STATUS_DISPLAY[session.status]}
                    </button>

                    {/* Popover */}
                    {activePopover === session.id && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 z-30 mt-1 flex flex-col gap-0.5 glass-floating rounded-xl p-1.5" data-popover>
                        {(['PRESENT', 'ABSENT', 'CANCELLED', 'UNMARKED'] as AttendanceStatus[]).map(s => (
                          <button
                            key={s}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(session.id, s);
                            }}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                              session.status === s
                                ? 'bg-white/10 text-white shadow-inner'
                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className={`inline-block h-2 w-2 rounded-full shadow-sm ${
                              s === 'PRESENT' ? 'bg-emerald-500 shadow-emerald-500/50' :
                              s === 'ABSENT' ? 'bg-red-500 shadow-red-500/50' :
                              s === 'CANCELLED' ? 'bg-zinc-400' :
                              'bg-white/20 border border-white/30'
                            }`} />
                            {s === 'PRESENT' ? 'Present' :
                             s === 'ABSENT' ? 'Absent' :
                             s === 'CANCELLED' ? 'Cancelled' :
                             'Unmarked'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-elevated flex flex-col items-center justify-center rounded-[16px] px-2 py-2.5">
      <span className={`text-lg font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-[8px] text-white/40 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

function RowLabel({ text, isHeader, isBold, isLast }: { text: string; isHeader?: boolean; isBold?: boolean; isLast?: boolean }) {
  return (
    <div className={`flex items-center justify-end pr-3 pl-3 border-b text-[10px] tracking-widest uppercase ${
      isHeader ? 'h-9 font-bold text-white/60 border-white/[0.06]' :
      isLast ? 'h-11 border-transparent' :
      'h-8 border-white/[0.06]'
    } ${isBold ? 'font-bold text-white/80' : 'text-white/40 font-medium'}`}
    style={{ minWidth: '60px' }}>
      {text}
    </div>
  );
}
