'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Session, Subject, AttendanceStatus } from '@/lib/types';
import { DAY_SHORT, MONTH_SHORT } from '@/lib/config';
import { getSubjectAttendance, formatPercentage } from '@/lib/calculations';
import { parseDate, formatDate } from '@/lib/sessions';
import Link from 'next/link';
import StatusPopover from './StatusPopover';
import { STATUS_DISPLAY } from '@/lib/uiUtils';
import SubjectCard from './SubjectCard';
import './attendance-polish.css';

interface Props {
  subjects: Subject[];
  sessions: Session[];
  onMarkAttendance: (sessionId: string, status: AttendanceStatus) => void;
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
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }, []);

  const scrollToStart = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }, []);

  const scrollBy = useCallback((direction: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction * 400,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }, []);

  // Close popover on outside click — handled by StatusPopover
  useEffect(() => {
    if (!activePopover) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        popoverAnchor?.focus({ preventScroll: true });
        setActivePopover(null);
        setPopoverAnchor(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activePopover, popoverAnchor]);

  const handleStatusChange = (sessionId: string, status: AttendanceStatus) => {
    onMarkAttendance(sessionId, status);
    popoverAnchor?.focus({ preventScroll: true });
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
        <div className="page-header">
          <h1>Attendance</h1>
          <p className="page-subtitle">Your subjects, attendance and room to miss a class.</p>
        </div>
        <div className="register-controls register-controls-desktop">
          <button type="button" onClick={scrollToStart} aria-label="Scroll register to semester start">
            Start
          </button>
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Previous dates">
            ‹
          </button>
          <button type="button" onClick={scrollToToday} className="register-today">
            Today
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Next dates">
            ›
          </button>
        </div>
      </div>

      {/* Semester Status Bar */}
      <section className="attendance-overview" aria-label="Semester attendance summary" data-page-reveal>
        <div className="attendance-overview-top">
          <div>
            <p className="attendance-overview-eyebrow">Semester III · Overall attendance</p>
            <p className="attendance-overview-number">{overallConducted === 0 ? '—' : overallPercentage}</p>
          </div>
          <span className="attendance-target-badge"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></svg>75% target</span>
        </div>
        <p className="attendance-overview-caption">{overallConducted === 0 ? 'Open a subject to record your first class.' : `${rowData.filter(row => row.stats.needToAttend > 0).length} of ${subjects.length} subjects below the required attendance.`}</p>
        <div className="attendance-overview-stats">
          <div><strong style={{ color: 'var(--success)' }}>{overallPresent}</strong><span>Present</span></div>
          <div><strong style={{ color: 'var(--danger)' }}>{overallAbsent}</strong><span>Absent</span></div>
          <div><strong>{overallConducted}</strong><span>Recorded classes</span></div>
        </div>
      </section>

      <div className="attendance-section-heading">
        <h2>Your subjects</h2>
        <p>{subjects.length} subjects · tap to open</p>
      </div>
      <div className="register-guide register-guide-desktop" aria-label="Register legend">
        <span><i className="attendance-dot present" /><strong>P</strong> Present</span>
        <span><i className="attendance-dot absent" /><strong>A</strong> Absent</span>
        <span><i className="attendance-dot cancelled" /><strong>C</strong> Cancelled</span>
        <span><i className="attendance-dot unmarked" /><strong>—</strong> Unmarked</span>
      </div>

      {/* Glass Slab Container (Desktop Only) */}
      <div className="hidden md:block relative glass-surface rounded-[20px] overflow-hidden text-sm">
        <div ref={scrollRef} className="register-scroller overflow-x-auto scrollbar-thin max-h-[75vh]" tabIndex={0} role="region" aria-label="Semester attendance register, scroll horizontally for more dates">
          <div className="inline-block min-w-max">
            
            {/* Frosted Header Row */}
            <div className="sticky top-0 z-30 flex border-b border-white/[0.08]" style={{ background: 'var(--bg-elevated)' }}>
              
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
                    className={`flex w-[60px] flex-col items-center justify-center border-r border-white/[0.06] py-1 ${
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
                <StatHeader label="Present" sub="" width="w-12" />
                <StatHeader label="Absent" sub="" width="w-12" />
                <StatHeader label="%" sub="Rate" width="w-14" />
                <StatHeader label="Buffer" sub="/ Attend" width="w-12" />
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
                    <Link href={`/subjects/${encodeURIComponent(row.subject.code)}`} className="flex min-h-11 flex-col justify-center" aria-label={`Open ${row.subject.name} register`}>
                      <span className="text-[12px] font-semibold text-white/95">{row.subject.code}</span>
                      <span className="text-[11px] text-white/60 font-medium leading-snug" title={row.subject.name}>{row.subject.name}</span>
                    </Link>
                  </div>

                  {/* Date Cells */}
                  {uniqueDates.map((date) => {
                    const daySessions = row.sessionsByDate[date] || [];
                    const isToday = date === todayStr;
                    
                    return (
                      <div 
                        key={date} 
                        className={`flex w-[60px] flex-col items-center justify-center gap-1 border-r border-white/[0.05] p-1.5 ${
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
                              type="button"
                              className={`register-cell status-${session.status.toLowerCase()} flex h-11 w-full items-center justify-center rounded-[8px] text-[12px]`}
                              aria-label={`${row.subject.name}, ${date}, ${session.startTime}, ${session.classType}, ${session.status.toLowerCase()}. Change attendance.`}
                              aria-expanded={activePopover === session.id}
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
      <div className="attendance-subject-grid md:hidden">
        {rowData.map((row) => <SubjectCard key={row.subject.code} subject={row.subject} attendance={row.stats} />)}
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
