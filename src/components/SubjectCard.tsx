'use client';

import Link from 'next/link';
import { Subject, SubjectAttendance } from '@/lib/types';
import { formatPercentage, getStatusColor, getStatusLabel } from '@/lib/calculations';

interface Props {
  subject: Subject;
  attendance: SubjectAttendance;
}

export default function SubjectCard({ subject, attendance }: Props) {
  const { percentage, present, totalConducted, level, canBunk, needToAttend } = attendance;

  return (
    <Link href={`/subjects/${subject.code}`}>
      <div className={`group glass-elevated rounded-[22px] p-5 transition-all duration-300 active:scale-[0.98] ${
        level === 'SAFE' ? 'border-emerald-500/15 hover:border-emerald-500/30' :
        level === 'WARNING' ? 'border-amber-500/15 hover:border-amber-500/30' :
        level === 'DANGER' ? 'border-red-500/15 hover:border-red-500/30' :
        ''
      }`}>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-widest text-white/60 uppercase">
              {subject.code}
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-100 truncate">
              {subject.name}
            </p>
          </div>
          <div className="ml-3 text-right">
            <p className={`text-2xl font-bold tabular-nums drop-shadow-md ${getStatusColor(level)}`}>
              {formatPercentage(percentage)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
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
