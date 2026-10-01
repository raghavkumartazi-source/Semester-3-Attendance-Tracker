'use client';

import Link from 'next/link';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { useAttendance } from '../AttendanceProvider';
import { getOverallAttendance, getSubjectAttendance } from '@/lib/calculations';
import { SUBJECTS } from '@/lib/config';

export function AttendanceSnapshot() {
  const { sessions } = useAttendance();
  const overall = getOverallAttendance(sessions);
  const attention = SUBJECTS.map(subject => ({ subject, stats: getSubjectAttendance(sessions.filter(s => s.subjectCode === subject.code)) }))
    .filter(({ stats }) => stats.level === 'WARNING' || stats.level === 'DANGER');
  const hasData = overall.percentage !== null;

  return (
    <section>
      <div className="section-heading"><h2>Attendance health</h2><Link href="/subjects" className="section-link">Register<ArrowUpRightIcon aria-hidden="true" /></Link></div>
      <div className="glass-surface rounded-[18px] p-5">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm text-white/60">Overall attendance</p><p className="text-4xl font-semibold mt-2 tracking-tight">{hasData ? `${Math.round(overall.percentage!)}%` : '—'}</p></div>
          <span className={`text-xs rounded-full px-3 py-1 border ${!hasData ? 'text-zinc-400 border-white/10' : overall.level === 'SAFE' ? 'text-emerald-400 border-emerald-500/20' : 'text-amber-400 border-amber-500/20'}`}>{!hasData ? 'No records yet' : overall.level === 'SAFE' ? 'On track' : 'Needs attention'}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 mt-5 overflow-hidden"><div className="h-full bg-emerald-400 rounded-full" style={{ width: `${overall.percentage ?? 0}%` }} /></div>
        <div className="flex justify-between mt-2 text-xs text-white/50"><span>{overall.totalPresent} present · {overall.totalAbsent} absent</span><span>Target 75%</span></div>
        <div className="border-t border-white/10 mt-5 pt-4">
          {!hasData ? <p className="text-sm text-white/50">Mark your first class to start tracking.</p> : attention.length === 0 ? <p className="text-sm text-emerald-400">Your recorded attendance is on track.</p> : (
            <div className="space-y-3">{attention.map(({ subject, stats }) => <Link key={subject.code} href={`/subjects/${subject.code}`} className="flex items-center justify-between text-sm"><span>{subject.shortName}</span><span className="text-amber-400">{Math.round(stats.percentage ?? 0)}% →</span></Link>)}</div>
          )}
        </div>
      </div>
    </section>
  );
}
