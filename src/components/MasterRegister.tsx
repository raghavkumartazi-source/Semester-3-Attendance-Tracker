'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Session, Subject, AttendanceStatus } from '@/lib/types';
import { DAY_SHORT, MONTH_SHORT } from '@/lib/config';
import { getSubjectAttendance, formatPercentage } from '@/lib/calculations';
import { parseDate, formatDate } from '@/lib/sessions';
import Link from 'next/link';
import StatusPopover from './StatusPopover';

interface Props {
  subjects: Subject[];
  sessions: Session[];
  onMarkAttendance: (sessionId: string, status: AttendanceStatus) => void;
}

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

export default function MasterRegister({ subjects, sessions, onMarkAttendance }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLDivElement>(null);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  const todayStr = formatDate(new Date());

  // Get all unique dates in chronological order
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(sessions.map((s) => s.date))).sort();
  }, [sessions]);

  // Pre-calculate subject stats and group sessions
  const rowData = useMemo(() => {
    return subjects.map((subject) => {
      const subjectSessions = sessions.filter((s) => s.subjectCode === subject.code);
      const stats = getSubjectAttendance(subjectSessions);
      
      // Group sessions by date
      const sessionsByDate: Record<string, Session[]> = {};
      subjectSessions.forEach((s) => {
        if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
        sessionsByDate[s.date].push(s);
      });
      
      // Sort sessions within each date by time
      Object.values(sessionsByDate).forEach((daySessions) => {
        daySessions.sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      return { subject, stats, sessionsByDate };
    });
  }, [subjects, sessions]);

  // Auto-scroll to today
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayColRef.current && scrollRef.current) {
        const offset = todayColRef.current.offsetLeft - 300;
        scrollRef.current.scrollLeft = Math.max(0, offset);
      } else if (scrollRef.current) {
        const futureCol = scrollRef.current.querySelector('[data-future="first"]') as HTMLElement;
        if (futureCol) {
          scrollRef.current.scrollLeft = Math.max(0, futureCol.offsetLeft - 300);
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToToday = useCallback(() => {
    if (todayColRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: Math.max(0, todayColRef.current.offsetLeft - 300),
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

  const scrollBy = useCallback((direction: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction * 400,
        behavior: 'smooth',
      });
    }
  }, []);

  // Close popover on outside click — handled by StatusPopover
  useEffect(() => {
    if (!activePopover) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
        setPopoverAnchor(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activePopover]);

  const handleStatusChange = (sessionId: string, status: AttendanceStatus) => {
    onMarkAttendance(sessionId, status);
    setActivePopover(null);
    setPopoverAnchor(null);
  };

  const firstFutureDate = uniqueDates.find(d => d > todayStr);

  const overallPresent = rowData.reduce((acc, row) => acc + row.stats.present, 0);
  const overallConducted = rowData.reduce((acc, row) => acc + row.stats.totalConducted, 0);
  const overallAbsent = rowData.reduce((acc, row) => acc + row.stats.absent, 0);
  const overallPercentage = overallConducted === 0 ? '--' : ((overallPresent / overallConducted) * 100).toFixed(1) + '%';

  return (
    <div className="space-y-4 pb-12 md:pb-0">
      {/* Controls & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Master Register</h1>
          <p className="text-[11px] text-white/50 font-medium mt-0.5">Semester III · Unified attendance</p>
        </div>
        <div className="glass-floating rounded-[18px] flex items-center justify-between w-full sm:w-auto gap-1 p-1.5 overflow-hidden flex-nowrap">
          <button onClick={scrollToStart} className="glass-control rounded-[12px] px-3 py-2 text-[10px] font-bold text-white/70 hover:text-white tracking-wide truncate flex-1 sm:flex-none">
            Start
          </button>
          <button onClick={() => scrollBy(-1)} className="glass-control rounded-[12px] px-3 py-2 text-[11px] font-bold text-white/70 hover:text-white">
            ‹
          </button>
          <button onClick={scrollToToday} className="glass-control-active rounded-[12px] px-3 sm:px-5 py-2 text-[10px] font-bold text-white tracking-wider flex-1 sm:flex-none">
            TODAY
          </button>
          <button onClick={() => scrollBy(1)} className="glass-control rounded-[12px] px-3 py-2 text-[11px] font-bold text-white/70 hover:text-white">
            ›
          </button>
        </div>
      </div>

      {/* Semester Status Bar */}
      <div className="glass-elevated rounded-[16px] px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between sm:justify-start gap-x-4 sm:gap-x-6 gap-y-3">
        <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest text-white/40">Semester III</span>
        {overallConducted === 0 ? (
          <span className="text-xs font-bold text-white/50">Overall -- <span className="font-medium opacity-60 ml-1">NO DATA</span></span>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-white/40">Overall</span>
              <span className="text-sm font-bold text-white">{overallPercentage}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center items-center gap-1 sm:gap-2">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40">Present</span>
              <span className="text-sm font-bold text-emerald-400">{overallPresent}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center items-center gap-1 sm:gap-2 border-l border-white/[0.05] sm:border-none pl-4 sm:pl-0">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40">Absent</span>
              <span className="text-sm font-bold text-red-400">{overallAbsent}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center items-center gap-1 sm:gap-2 border-l border-white/[0.05] sm:border-none pl-4 sm:pl-0">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40">Classes</span>
              <span className="text-sm font-bold text-white/80">{overallConducted}</span>
            </div>
            <div className="hidden sm:flex flex-1 justify-end">
              <span className="text-[10px] uppercase tracking-wider text-white/30">75% Required</span>
            </div>
          </>
        )}
      </div>

      {/* Glass Slab Container (Desktop Only) */}
      <div className="hidden md:block relative glass-surface rounded-[20px] overflow-hidden text-sm">
        <div ref={scrollRef} className="overflow-x-auto scrollbar-thin max-h-[75vh]">
          <div className="inline-block min-w-max">
            
            {/* Frosted Header Row */}
            <div className="sticky top-0 z-30 flex border-b border-white/[0.08]" style={{ background: 'linear-gradient(180deg, rgba(20,22,30,0.92), rgba(16,18,26,0.85))', backdropFilter: 'blur(20px) saturate(150%)' }}>
              
              {/* Sticky Top-Left Corner (Subject Header) */}
              <div className="sticky left-0 z-40 glass-frozen flex h-14 w-[210px] flex-col justify-end px-4 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Subject</span>
              </div>

              {/* Date Columns */}
              {uniqueDates.map((date) => {
                const d = parseDate(date);
                const isToday = date === todayStr;
                const isFuture = date > todayStr;
                
                const isFirstFuture = date === firstFutureDate;

                return (
                  <div
                    key={date}
                    ref={isToday ? todayColRef : undefined}
                    data-future={isFirstFuture ? 'first' : undefined}
                    className={`flex w-12 flex-col items-center justify-center border-r border-white/[0.06] py-1 ${
                      isToday 
                        ? 'text-white' 
                        : isFuture ? 'text-white/40' : 'text-white/80'
                    }`}
                    style={isToday ? {
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(255,255,255,0.05), 0 0 12px rgba(255,255,255,0.05)'
                    } : undefined}
                  >
                    <span className={`text-[11px] tabular-nums ${isToday ? 'font-bold' : 'font-semibold'}`}>{`${String(d.getMonth() + 1)}/${String(d.getDate()).padStart(2, '0')}`}</span>
                    <span className={`text-[9px] ${isToday ? 'font-medium' : 'opacity-70'}`}>{DAY_SHORT[d.getDay()]}</span>
                  </div>
                );
              })}

              {/* Sticky Top-Right Corner (Stats Headers) */}
              <div className="sticky right-0 z-40 flex glass-frozen-right">
                <StatHeader label="Total" sub="Class" width="w-12" />
                <StatHeader label="Pres" sub="ent" width="w-12" />
                <StatHeader label="Abs" sub="ent" width="w-12" />
                <StatHeader label="%" sub="Attnd" width="w-14" />
                <StatHeader label="Bunk" sub="/Next" width="w-12" />
              </div>
            </div>

            {/* Rows (Subjects) */}
            <div className="flex flex-col">
              {rowData.map((row, index) => (
                <div 
                  key={row.subject.code} 
                  className={`flex ${index !== rowData.length - 1 ? 'border-b border-white/[0.06]' : ''} hover:bg-white/[0.03] transition-colors`}
                  style={{ background: index % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.032)' }}
                >
                  
                  {/* Sticky Left Column (Subject Info) */}
                  <div className="sticky left-0 z-20 glass-frozen flex w-[210px] flex-col justify-center px-4 py-2">
                    <span className="truncate text-[12px] font-bold text-white/95">{row.subject.code}</span>
                    <span className="truncate text-[10px] text-white/60 font-medium" title={row.subject.name}>{row.subject.name}</span>
                  </div>

                  {/* Date Cells */}
                  {uniqueDates.map((date) => {
                    const daySessions = row.sessionsByDate[date] || [];
                    const isToday = date === todayStr;
                    
                    return (
                      <div 
                        key={date} 
                        className={`flex w-12 flex-col items-center justify-center gap-1 border-r border-white/[0.05] p-1 ${
                          isToday ? 'bg-white/[0.06]' : ''
                        }`}
                      >
                        {daySessions.map((session) => (
                          <div key={session.id} className="relative w-full">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activePopover === session.id) {
                                  setActivePopover(null);
                                  setPopoverAnchor(null);
                                } else {
                                  setActivePopover(session.id);
                                  setPopoverAnchor(e.currentTarget);
                                }
                              }}
                              className={`flex h-6 w-full items-center justify-center rounded-[5px] text-[10px] transition-all duration-200 hover:brightness-110 active:scale-90 border ${getStatusCellClass(session.status)}`}
                              title={`${row.subject.code}\n${String(parseDate(date).getDate()).padStart(2, '0')} ${MONTH_SHORT[parseDate(date).getMonth()]} ${parseDate(date).getFullYear()}\n${session.startTime}–${session.endTime}\n${session.classType}`}
                            >
                              {STATUS_DISPLAY[session.status]}
                            </button>

                            {/* Portal-based Popover */}
                            {activePopover === session.id && popoverAnchor && (
                              <StatusPopover
                                anchorEl={popoverAnchor}
                                currentStatus={session.status}
                                onSelect={(s) => handleStatusChange(session.id, s)}
                                onClose={() => {
                                  setActivePopover(null);
                                  setPopoverAnchor(null);
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Sticky Right Column (Stats) */}
                  <div className="sticky right-0 z-20 flex glass-frozen-right">
                    <StatCell width="w-12" value={String(row.stats.totalConducted)} />
                    <StatCell width="w-12" value={String(row.stats.present)} color="text-emerald-400 drop-shadow-sm" />
                    <StatCell width="w-12" value={String(row.stats.absent)} color="text-red-400 drop-shadow-sm" />
                    <StatCell width="w-14" value={formatPercentage(row.stats.percentage)} bold />
                    <StatCell 
                      width="w-12" 
                      value={row.stats.totalConducted === 0 ? '—' : String(row.stats.needToAttend > 0 ? row.stats.needToAttend : row.stats.canBunk)} 
                      color={row.stats.needToAttend > 0 ? 'text-red-400 drop-shadow-sm' : 'text-emerald-400 drop-shadow-sm'} 
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Register (< 768px) */}
      <div className="md:hidden flex flex-col space-y-3">
        {rowData.map((row) => {
          let statusClass = 'text-white border-white/10 bg-white/5';
          if (row.stats.percentage !== null) {
            if (row.stats.percentage >= 75) statusClass = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[inset_0_1px_1px_rgba(16,185,129,0.15)]';
            else if (row.stats.percentage >= 65) statusClass = 'border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[inset_0_1px_1px_rgba(245,158,11,0.15)]';
            else statusClass = 'border-red-500/20 bg-red-500/10 text-red-400 shadow-[inset_0_1px_1px_rgba(239,68,68,0.15)]';
          }

          return (
            <Link 
              key={row.subject.code}
              href={`/subjects/${encodeURIComponent(row.subject.code)}`}
              className="block glass-elevated rounded-[22px] p-4 sm:p-5 active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">{row.subject.code}</h3>
                  <p className="text-[10px] sm:text-[11px] text-white/50 font-medium truncate mt-0.5">{row.subject.name}</p>
                </div>
                <div className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-[14px] border ${statusClass} flex items-center justify-center min-w-[64px] sm:min-w-[72px]`}>
                  <span className="text-base sm:text-lg font-bold tracking-tight">
                    {formatPercentage(row.stats.percentage)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 sm:gap-2 border-t border-white/[0.06] pt-3 sm:pt-4">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Present</span>
                  <span className="text-sm font-bold text-emerald-400">{row.stats.present}</span>
                </div>
                <div className="flex flex-col items-center border-l border-white/[0.04]">
                  <span className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Absent</span>
                  <span className="text-sm font-bold text-red-400">{row.stats.absent}</span>
                </div>
                <div className="flex flex-col items-center border-l border-white/[0.04]">
                  <span className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Classes</span>
                  <span className="text-sm font-bold text-white/80">{row.stats.totalConducted}</span>
                </div>
                <div className="flex flex-col items-center border-l border-white/[0.04]">
                  <span className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">{row.stats.needToAttend > 0 ? 'Next' : 'Bunk'}</span>
                  <span className={`text-sm font-bold ${row.stats.needToAttend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {row.stats.totalConducted === 0 ? '—' : (row.stats.needToAttend > 0 ? row.stats.needToAttend : row.stats.canBunk)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatHeader({ label, sub, width }: { label: string; sub: string; width: string }) {
  return (
    <div className={`flex flex-col items-center justify-center border-r border-white/[0.06] ${width}`}>
      <span className="text-[11px] font-bold text-white/80">{label}</span>
      <span className="text-[9px] text-white/50 tracking-wide">{sub}</span>
    </div>
  );
}

function StatCell({ value, width, color = 'text-white/80', bold }: { value: string; width: string; color?: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-center border-r border-white/[0.06] ${width}`}>
      <span className={`text-[12px] tabular-nums ${color} ${bold ? 'font-bold' : 'font-semibold'}`}>
        {value}
      </span>
    </div>
  );
}
