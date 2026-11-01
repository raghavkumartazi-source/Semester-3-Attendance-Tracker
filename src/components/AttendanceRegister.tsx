'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Session, AttendanceStatus, Subject } from '@/lib/types';
import { DAY_SHORT, MONTH_SHORT } from '@/lib/config';
import { getSubjectAttendance, formatPercentage, getStatusColor } from '@/lib/calculations';
import { parseDate, formatDate } from '@/lib/sessions';
import StatusPopover from './StatusPopover';
import AddExtraClassModal from './AddExtraClassModal';
import { STATUS_DISPLAY, TYPE_SHORT } from '@/lib/uiUtils';
import './attendance-polish.css';

interface Props {
  subject: Subject;
  sessions: Session[];
  onMarkAttendance: (sessionId: string, status: AttendanceStatus) => void;
}

export default function AttendanceRegister({ subject, sessions, onMarkAttendance }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLDivElement>(null);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [showExtraModal, setShowExtraModal] = useState(false);

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
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }, []);

  const scrollBy = useCallback((direction: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction * 300,
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

  const handleStatusChange = useCallback((sessionId: string, status: AttendanceStatus) => {
    onMarkAttendance(sessionId, status);
    popoverAnchor?.focus({ preventScroll: true });
    setActivePopover(null);
    setPopoverAnchor(null);
  }, [onMarkAttendance, popoverAnchor]);

  // Close popover on Escape — outside click handled by StatusPopover
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

  // Determine first future session for auto-scroll fallback
  const firstFutureSession = sorted.find(s => s.date > todayStr);
  const firstFutureId = firstFutureSession?.id;
  const { percentage, present, absent, totalConducted, canBunk, needToAttend, level } = attendance;
  const statusLabel = { SAFE: 'On track', WARNING: 'Near target', DANGER: 'Below target', NO_DATA: 'No records' }[level];
  const isUndefinedLTP = subject.lectures === 0 && subject.tutorials === 0 && subject.practicals === 0;
  const ltp = isUndefinedLTP ? '-' : `${subject.lectures}-${subject.tutorials}-${subject.practicals}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="register-detail-header" data-page-reveal>
        <div className="register-detail-copy">
          <p>{subject.code}</p>
          <h1>{subject.name}</h1>
          <span className="register-course-meta">Lecture · Tutorial · Practical &nbsp; {ltp}</span>
        </div>
        <div className="register-detail-rate">
          <strong>{formatPercentage(percentage)}</strong>
          <span className={getStatusColor(level)}>{statusLabel}</span>
        </div>
      </div>

      {/* Compact Stats Bar */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
        <StatBox label="Present" value={String(present)} color="text-emerald-400 drop-shadow-sm" />
        <StatBox label="Absent" value={String(absent)} color="text-red-400 drop-shadow-sm" />
        <StatBox label="Recorded" value={String(totalConducted)} color="text-zinc-300 drop-shadow-sm" />
      </div>
      <p className="register-next-step">{totalConducted === 0 ? 'Tap a class below to record attendance. Cancelled classes do not affect your percentage.' : needToAttend > 0 ? `Attend the next ${needToAttend} ${needToAttend === 1 ? 'class' : 'classes'} to reach 75%.` : canBunk > 0 ? `You can miss ${canBunk} ${canBunk === 1 ? 'class' : 'classes'} and stay at or above 75%.` : 'You’re at the threshold. Attend your next class to build a buffer.'}</p>

      {/* Register Navigation */}
      <div className="register-controls">
          <button type="button" onClick={() => setShowExtraModal(true)} className="register-extra" aria-label={`Add extra class for ${subject.name}`}>
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Extra class
          </button>
          <button type="button" onClick={scrollToStart} aria-label="Scroll register to semester start">Start</button>
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Previous classes">‹</button>
          <button type="button" onClick={scrollToToday} className="register-today">Today</button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Next classes">›</button>
      </div>
      <div className="register-guide" aria-label="Register legend">
        <span><i className="attendance-dot present" /><strong>P</strong> Present</span>
        <span><i className="attendance-dot absent" /><strong>A</strong> Absent</span>
        <span><i className="attendance-dot cancelled" /><strong>C</strong> Cancelled</span>
        <span><i className="attendance-dot unmarked" /><strong>—</strong> Unmarked</span>
      </div>

      {/* === THE REGISTER === */}
      <div className="glass-surface rounded-[20px] overflow-hidden">
        <div ref={scrollRef} className="register-scroller overflow-x-auto scrollbar-thin" tabIndex={0} role="region" aria-label={`${subject.name} attendance register, scroll horizontally for more classes`}>
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
                  style={{ width: '68px' }}
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
                  <div className={`flex flex-col h-11 items-center justify-center border-b border-white/[0.08] text-[10px] ${
                    session.classType === 'Lab' ? 'text-purple-400' :
                    session.classType === 'Tutorial' ? 'text-blue-400' :
                    textMuted
                  }`}>
                    <span>{TYPE_SHORT[session.classType]}</span>
                    {session.isExtra && (
                      <span className="text-[7px] font-bold text-amber-400 leading-none mt-0.5 tracking-wider bg-amber-400/10 px-1 py-0.5 rounded-sm">
                        ★ EXTRA
                      </span>
                    )}
                  </div>
                  {/* Attendance Cell */}
                  <div className="relative flex h-14 items-center justify-center">
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
                      className={`register-cell status-${session.status.toLowerCase()} flex h-11 w-[56px] items-center justify-center rounded-[10px] text-sm cursor-pointer`}
                      aria-label={`${subject.name}, ${session.date}, ${session.startTime}, ${session.classType}, ${session.status.toLowerCase()}. Change attendance.`}
                      aria-expanded={activePopover === session.id}
                      title={`${subject.code}\n${String(d.getDate()).padStart(2, '0')} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}\n${session.startTime}–${session.endTime}\n${session.classType}`}
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {showExtraModal && (
        <AddExtraClassModal 
          subject={subject} 
          onClose={() => setShowExtraModal(false)} 
        />
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="register-stat">
      <strong className={color}>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function RowLabel({ text, isHeader, isBold, isLast }: { text: string; isHeader?: boolean; isBold?: boolean; isLast?: boolean }) {
  return (
    <div className={`flex items-center justify-end pr-3 pl-3 border-b text-[10px] tracking-widest uppercase ${
      isHeader ? 'h-9 font-bold text-white/60 border-white/[0.06]' :
      isLast ? 'h-14 border-transparent' : text === 'TYPE' ? 'h-11 border-white/[0.06]' :
      'h-8 border-white/[0.06]'
    } ${isBold ? 'font-bold text-white/80' : 'text-white/40 font-medium'}`}
    style={{ minWidth: '60px' }}>
      {text}
    </div>
  );
}
