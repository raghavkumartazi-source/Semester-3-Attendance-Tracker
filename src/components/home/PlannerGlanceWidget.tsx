'use client';

import Link from 'next/link';
import { CalendarDaysIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { usePlanner } from '@/components/PlannerProvider';
import { timeUtils } from '@/lib/timeUtils';

export function PlannerGlanceWidget() {
  const { isLoaded, exams } = usePlanner();
  if (!isLoaded) return null;
  const today = timeUtils.getLocalISODate(new Date());
  const next = [...exams].filter(e => e.exam_date >= today).sort((a, b) => a.exam_date.localeCompare(b.exam_date))[0];
  const days = next ? Math.round((Date.parse(next.exam_date) - Date.parse(today)) / 86400000) : null;
  return (
    <div className="glance-card">
      <h3 className="glance-label"><CalendarDaysIcon aria-hidden="true" /> Next exam</h3>
      <div className="glance-value">{days === null ? '—' : days === 0 ? 'Today' : `${days} days`}</div>
      <p className="glance-caption">{next ? `${next.subject_code} · ${next.exam_name}` : 'No exams scheduled'}</p>
      <Link href="/planner" className="glance-link">Exam planner<ArrowUpRightIcon aria-hidden="true" /></Link>
    </div>
  );
}
