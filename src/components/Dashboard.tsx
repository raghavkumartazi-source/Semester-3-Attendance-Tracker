'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAttendance } from '@/components/AttendanceProvider';
import { SUBJECTS } from '@/lib/config';
import { getTodaySessions } from '@/lib/sessions';
import { getSubjectAttendance, getOverallAttendance, getStatusColor, getStatusLabel } from '@/lib/calculations';
import SubjectCard from '@/components/SubjectCard';
import AttendanceButtons from '@/components/AttendanceButtons';
import { DAY_NAMES } from '@/lib/config';
import SkeletonDashboard from '@/components/SkeletonDashboard';

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setCount(Math.floor(ease * value));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <>{count}</>;
}

export default function Dashboard() {
  const { sessions, updateSessionStatus, isLoaded } = useAttendance();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const todaySessions = useMemo(() => getTodaySessions(sessions), [sessions]);
  const overall = useMemo(() => getOverallAttendance(sessions), [sessions]);

  const subjectStats = useMemo(() => {
    return SUBJECTS.map(subject => ({
      subject,
      attendance: getSubjectAttendance(sessions.filter(s => s.subjectCode === subject.code)),
    }));
  }, [sessions]);

  const sparklineData = useMemo(() => {
    if (!sessions.length) return [];
    
    const byDate = sessions.reduce((acc, s) => {
      if (!acc[s.date]) acc[s.date] = { present: 0, total: 0 };
      if (s.status !== 'CANCELLED' && s.status !== 'UNMARKED') {
        acc[s.date].total++;
        if (s.status === 'PRESENT') acc[s.date].present++;
      }
      return acc;
    }, {} as Record<string, { present: number; total: number }>);

    const sortedDates = Object.keys(byDate).sort();
    const recentDates = sortedDates.slice(-14);
    
    return recentDates.map(date => {
      const stats = byDate[date];
      return stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
    });
  }, [sessions]);

  const today = new Date();
  const dayName = DAY_NAMES[today.getDay()];
  const currentMinutes = today.getHours() * 60 + today.getMinutes();

  if (!isLoaded) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="animate-fade-in-up stagger-1">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Semester III
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">Attendance Tracker</h1>
      </div>

      {/* Overall Stats */}
      <div className={`animate-fade-in-up stagger-2 glass-surface rounded-[22px] p-6 flex flex-col justify-between relative overflow-hidden ${
        overall.level === 'SAFE' ? 'border-emerald-500/15' :
        overall.level === 'WARNING' ? 'border-amber-500/15' :
        overall.level === 'DANGER' ? 'border-red-500/15' :
        ''
      }`}>
        <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-[60px] opacity-20 pointer-events-none ${
          overall.level === 'SAFE' ? 'bg-emerald-500' :
          overall.level === 'WARNING' ? 'bg-amber-500' :
          overall.level === 'DANGER' ? 'bg-red-500' : 'bg-white'
        }`} />

        <div className="flex items-center justify-between z-10">
          <div>
            <p className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.15em]">Overall</p>
            <div className={`mt-2 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest backdrop-blur-md border inline-block ${getStatusColor(overall.level)} ${
              overall.level === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
              overall.level === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
              overall.level === 'DANGER' ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
              'bg-white/10 border-white/20'
            }`}>
              {getStatusLabel(overall.level)}
            </div>
          </div>
          
          <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none" stroke="currentColor" strokeWidth="8"
                className="text-white/[0.05]"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none" stroke="currentColor" strokeWidth="8"
                strokeDasharray="264 264"
                strokeDashoffset={mounted ? 264 - ((overall.percentage || 0) / 100) * 264 : 264}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                className={`${
                  overall.level === 'SAFE' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                  overall.level === 'WARNING' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                  overall.level === 'DANGER' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' :
                  'text-white/20'
                }`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-xl font-bold tracking-tighter ${getStatusColor(overall.level)}`}>
                <AnimatedCounter value={Math.round(overall.percentage || 0)} /><span className="text-xs">%</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between border-t border-white/[0.06] pt-4 z-10">
          <div className="flex-1">
            <p className="text-xl font-semibold text-emerald-400 tabular-nums drop-shadow-sm">
              <AnimatedCounter value={overall.totalPresent} />
            </p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-medium mt-0.5">Present</p>
          </div>
          <div className="flex-1 border-l border-white/[0.06] pl-4">
            <p className="text-xl font-semibold text-red-400 tabular-nums drop-shadow-sm">
              <AnimatedCounter value={overall.totalAbsent} />
            </p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-medium mt-0.5">Absent</p>
          </div>
          <div className="flex-1 border-l border-white/[0.06] pl-4">
            <p className="text-xl font-semibold text-zinc-200 tabular-nums drop-shadow-sm">
              <AnimatedCounter value={overall.totalConducted} />
            </p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-medium mt-0.5">Conducted</p>
          </div>
        </div>

        {/* Sparkline Trend */}
        <div className="mt-4 z-10 relative">
          <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 32">
            {sparklineData.length > 1 ? (
              <>
                <polyline 
                  points={sparklineData.map((val, i) => `${(i / (sparklineData.length - 1)) * 100},${32 - (val / 100) * 32}`).join(' ')}
                  fill="none" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: '300 300',
                    strokeDashoffset: mounted ? 0 : 300,
                    transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
                  }}
                />
                <circle 
                  cx="100" 
                  cy={32 - (sparklineData[sparklineData.length - 1] / 100) * 32} 
                  r="3" 
                  fill={overall.level === 'SAFE' ? '#34d399' : overall.level === 'WARNING' ? '#fbbf24' : overall.level === 'DANGER' ? '#f87171' : '#fff'} 
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: 'opacity 0.3s ease-out 1.7s'
                  }}
                />
              </>
            ) : (
              <line x1="0" y1="16" x2="100" y2="16" stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeDasharray="4 4" />
            )}
          </svg>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
            Today&apos;s Classes
          </h2>
          <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">{dayName}</span>
        </div>

        {todaySessions.length === 0 ? (
          <div className="glass-elevated rounded-[18px] p-6 text-center">
            <p className="text-sm font-medium text-white/40">No classes scheduled today</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                  className={`animate-slide-in-right stagger-${Math.min(i + 4, 8)} glass-elevated flex items-center justify-between rounded-[18px] px-4 py-3 relative overflow-hidden ${
                    isPast ? 'opacity-60' : ''
                  }`}
                >
                  {isNow && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-20" />
                  )}
                  
                  <div className="min-w-0 flex-1 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200 tracking-wide drop-shadow-sm">
                        {session.subjectCode}
                      </span>
                      <span className={`text-[10px] rounded-full border px-2 py-0.5 font-medium ${
                        isNow 
                          ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                          : 'bg-white/10 text-zinc-300 border-white/5'
                      }`}>
                        {isNow ? 'NOW' : session.classType}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-white/50 truncate">
                      {subject?.name} · {session.startTime}
                    </p>
                  </div>
                  <div className="relative z-10">
                    <AttendanceButtons
                      status={session.status}
                      onMark={(status) => updateSessionStatus(session.id, status)}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subject Cards */}
      <div className="animate-fade-in-up stagger-4">
        <h2 className="mb-4 px-1 text-[11px] font-bold text-white/60 uppercase tracking-widest">
          Subject Progress
        </h2>
        <div className="space-y-3">
          {subjectStats.map(({ subject, attendance }, idx) => (
            <div key={subject.code} className={`animate-fade-in-up stagger-${Math.min(idx + 5, 8)}`}>
              <SubjectCard subject={subject} attendance={attendance} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
