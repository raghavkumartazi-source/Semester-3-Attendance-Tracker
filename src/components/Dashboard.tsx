'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpenIcon, CheckCircleIcon, ChartBarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { AnimatedNumber, Reveal } from './ui/Motion';
import { useAttendance } from './AttendanceProvider';
import { useTasks } from './TaskProvider';
import SkeletonDashboard from './SkeletonDashboard';
import { TodayHeader } from './home/TodayHeader';
import { TodayTimeline } from './home/TodayTimeline';
import { HomeTaskSummary } from './home/HomeTaskSummary';
import { AttendanceSnapshot } from './home/AttendanceSnapshot';
import AttendanceForecast from './home/AttendanceForecast';
import { SUBJECTS } from '@/lib/config';
import { getOverallAttendance } from '@/lib/calculations';
import { timeUtils } from '@/lib/timeUtils';
import { AttendanceHeatmap } from './home/AttendanceHeatmap';
import { AttendanceTrendChart } from './home/AttendanceTrendChart';
import { OverallBreakdownChart } from './home/OverallBreakdownChart';
import { MarksGlanceWidget } from './home/MarksGlanceWidget';
import { PlannerGlanceWidget } from './home/PlannerGlanceWidget';
import { TodayProgress } from './home/TodayProgress';
import { NextClass } from './home/NextClass';

export default function Dashboard() {
  const { isLoaded, sessions } = useAttendance();
  const { tasks } = useTasks();
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  if (!isLoaded) return <SkeletonDashboard />;

  const today = timeUtils.getLocalISODate(clock);
  const classes = sessions.filter(s => s.date === today && s.status !== 'CANCELLED');
  const marked = classes.filter(s => s.status !== 'UNMARKED').length;
  const remaining = tasks.filter(t => !t.completed && !t.deleted_at).length;
  const overall = getOverallAttendance(sessions);

  return (
    <div className="dashboard">
      <TodayHeader now={clock} />
      <NextClass now={clock} />
      <div className="dashboard-columns">
        <div className="dashboard-column">
          <Reveal delay={.08}><TodayTimeline now={clock} /></Reveal>
          <Reveal><HomeTaskSummary /></Reveal>
        </div>
        <div className="dashboard-column">
          <Reveal><AttendanceSnapshot /></Reveal>
          <Reveal className="glance-grid"><MarksGlanceWidget /><PlannerGlanceWidget /></Reveal>
          <Reveal><TodayProgress /></Reveal>
        </div>
      </div>
      <section className="semester-overview" aria-labelledby="overview-heading">
      <div className="section-heading"><h2 id="overview-heading">At a glance</h2><span>Your semester, so far</span></div>
      <Reveal className="summary-grid">
        <Link href="/subjects" className="summary-card summary-lime">
          <div className="summary-label"><BookOpenIcon aria-hidden="true" /> Today’s classes</div>
          <div className="summary-value"><AnimatedNumber value={classes.length} /><small>today</small></div>
          <p className="summary-caption">{marked} of {classes.length} marked</p>
        </Link>
        <Link href="/tasks" className="summary-card summary-lilac">
          <div className="summary-label"><CheckCircleIcon aria-hidden="true" /> Open tasks</div>
          <div className="summary-value"><AnimatedNumber value={remaining} /><small>to do</small></div>
          <p className="summary-caption">{remaining ? 'Keep things moving' : 'All caught up'}</p>
        </Link>
        <Link href="/subjects" className="summary-card summary-peach">
          <div className="summary-label"><ChartBarIcon aria-hidden="true" /> Attendance</div>
          <div className="summary-value">{overall.percentage === null ? '—' : <AnimatedNumber value={overall.percentage} />}<small>{overall.percentage === null ? '' : '%'}</small></div>
          <p className="summary-caption">75% minimum</p>
        </Link>
      </Reveal>
      </section>
      <details className="insights">
        <summary><div><strong>Attendance insights</strong><span>Trends, activity and your semester forecast</span></div><ChevronDownIcon aria-hidden="true" /></summary>
        <div className="insights-content">
          <OverallBreakdownChart sessions={sessions} />
          <AttendanceTrendChart sessions={sessions} />
          <AttendanceHeatmap />
          <AttendanceForecast subjects={SUBJECTS} sessions={sessions} />
        </div>
      </details>
    </div>
  );
}
