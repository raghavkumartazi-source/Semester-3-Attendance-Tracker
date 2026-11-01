'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Subject, SubjectAttendance } from '@/lib/types';
import { formatPercentage } from '@/lib/calculations';
import { SUBJECT_COLORS } from '@/lib/theme';
import './attendance-polish.css';

interface Props {
  subject: Subject;
  attendance: SubjectAttendance;
}

export default function SubjectCard({ subject, attendance }: Props) {
  const { percentage, present, absent, totalConducted, level, canBunk, needToAttend } = attendance;
  const guidance = totalConducted === 0
    ? 'Open your register to start recording.'
    : needToAttend > 0
      ? `Attend the next ${needToAttend} ${needToAttend === 1 ? 'class' : 'classes'} to reach 75%.`
      : canBunk > 0
        ? `Room to miss ${canBunk} ${canBunk === 1 ? 'class' : 'classes'} and stay at or above 75%.`
        : 'Attend your next class to keep your buffer.';
  const statusLabel = { SAFE: 'On track', WARNING: 'Near target', DANGER: 'Below target', NO_DATA: 'No records' }[level];

  return (
    <Link
      href={`/subjects/${encodeURIComponent(subject.code)}`}
      className={`subject-card-polished level-${level.toLowerCase()}`}
      style={{ '--subject-accent': SUBJECT_COLORS[subject.code] || 'var(--accent)' } as CSSProperties}
      aria-label={`${subject.name}, ${percentage === null ? 'no attendance recorded' : `${formatPercentage(percentage)} attendance`}. Open register.`}
    >
      <div className="subject-card-heading">
        <div className="subject-card-copy">
          <span className="subject-card-code">{subject.code}</span>
          <h3>{subject.name}</h3>
        </div>
        <div className="subject-card-rate">
          <strong>{percentage === null ? '—' : percentage.toFixed(1)}{percentage !== null && <span>%</span>}</strong>
          <span className="subject-card-status">{statusLabel}</span>
        </div>
      </div>
      <div className="subject-card-meter" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, percentage ?? 0))}%` }} />
        <i />
      </div>
      <div className="subject-card-record">
        <span><i className="attendance-dot present" />{present} present</span>
        <span><i className="attendance-dot absent" />{absent} absent</span>
        <span>{totalConducted} recorded</span>
      </div>
      <div className="subject-card-guidance">
        <p>{guidance}</p>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
      </div>
    </Link>
  );
}
