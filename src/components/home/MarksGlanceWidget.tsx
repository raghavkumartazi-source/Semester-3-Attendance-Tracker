'use client';

import Link from 'next/link';
import { ChartBarIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { useMarks } from '@/components/MarksProvider';

export function MarksGlanceWidget() {
  const { isLoaded, getOverallSummary } = useMarks();
  if (!isLoaded) return null;
  const { sgpa } = getOverallSummary();
  return (
    <div className="glance-card">
      <h3 className="glance-label"><ChartBarIcon aria-hidden="true" /> Marks & grades</h3>
      <div className="glance-value">{sgpa === null ? '—' : sgpa.toFixed(2)}</div>
      <p className="glance-caption">{sgpa === null ? 'Add your first result' : 'Projected SGPA'}</p>
      <Link href="/marks" className="glance-link">Scorecard<ArrowUpRightIcon aria-hidden="true" /></Link>
    </div>
  );
}
