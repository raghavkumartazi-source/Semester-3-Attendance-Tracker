'use client';

import Link from 'next/link';
import { Subject, SubjectAttendance } from '@/lib/types';
import { formatPercentage, getStatusColor, getStatusLabel } from '@/lib/calculations';
import { SUBJECT_COLORS } from '@/lib/theme';

interface Props {
  subject: Subject;
  attendance: SubjectAttendance;
}

export default function SubjectCard({ subject, attendance }: Props) {
  const { percentage, present, totalConducted, level, canBunk, needToAttend } = attendance;
  const accentColor = SUBJECT_COLORS[subject.code] || '#a8aabf';

  return (
    <Link href={`/subjects/${subject.code}`}>
      <div
        className={`group glass-elevated rounded-[22px] p-5 transition-all duration-300 active:scale-[0.98] relative overflow-hidden ${
          level === 'SAFE' ? 'border-emerald-500/15 hover:border-emerald-500/30' :
          level === 'WARNING' ? 'border-amber-500/15 hover:border-amber-500/30' :
          level === 'DANGER' ? 'border-red-500/15 hover:border-red-500/30' :
          ''
        }`}
        style={{ '--subject-accent': accentColor } as React.CSSProperties}
      >
        {/* Subject accent glow in top-right corner */}
        <div
          className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.08] blur-xl pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.15]"
          style={{ background: accentColor }}
        />
        <div className="flex items-start justify-between relative z-10">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: accentColor }}>
              {subject.code}
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-100 truncate">
              {subject.name}
            </p>
          </div>
          <div className="ml-3 text-right relative flex items-center justify-center w-14 h-14 shrink-0">
            {level !== 'NO_DATA' && percentage !== null ? (
              <>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                  <circle 
                    cx="22" cy="22" r="19" 
                    fill="none" 
                    stroke={level === 'SAFE' ? accentColor : level === 'WARNING' ? '#f59e0b' : '#ef4444'} 
                    strokeWidth="3.5" 
                    strokeDasharray="119.38" 
                    strokeDashoffset={119.38 - (percentage / 100) * 119.38} 
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 3px ${level === 'SAFE' ? accentColor : level === 'WARNING' ? '#f59e0b' : '#ef4444'}80)`,
                      transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
                    }}
                  />
                </svg>
                <p className={`relative z-10 text-[14px] font-bold tabular-nums drop-shadow-md ${getStatusColor(level)}`}>
                  {Math.round(percentage)}<span className="text-[10px] opacity-60">%</span>
                </p>
              </>
            ) : (
              <p className={`text-2xl font-bold tabular-nums drop-shadow-md ${getStatusColor(level)}`}>
                —
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 font-medium">
              {totalConducted > 0 ? `${present}/${totalConducted} classes` : 'No classes yet'}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider backdrop-blur-md border ${getStatusColor(level)} ${
              level === 'SAFE' ? 'bg-emerald-400/10 border-emerald-500/20' :
              level === 'WARNING' ? 'bg-amber-400/10 border-amber-500/20' :
              level === 'DANGER' ? 'bg-red-400/10 border-red-500/20' :
              'bg-white/10 border-white/20'
            }`}>
              {getStatusLabel(level)}
            </span>
          </div>
          
          <div className="text-right">
            {level === 'NO_DATA' ? (
              <span className="text-[11px] text-zinc-600">—</span>
            ) : needToAttend > 0 ? (
              <span className="text-[11px] font-medium text-red-400">
                Attend next {needToAttend}
              </span>
            ) : canBunk > 0 ? (
              <span className="text-[11px] font-medium text-emerald-400">
                Can bunk {canBunk}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-400">
                Can&apos;t bunk
              </span>
            )}
          </div>
        </div>


      </div>
    </Link>
  );
}

