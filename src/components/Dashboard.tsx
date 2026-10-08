'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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
import { timeUtils } from '@/lib/timeUtils';
import { AttendanceHeatmap } from './home/AttendanceHeatmap';
import { AttendanceTrendChart } from './home/AttendanceTrendChart';
import { OverallBreakdownChart } from './home/OverallBreakdownChart';
import { MarksGlanceWidget } from './home/MarksGlanceWidget';
import { PlannerGlanceWidget } from './home/PlannerGlanceWidget';
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
  const semester = timeUtils.getSemesterProgress(clock);

  return (
    <div className="dashboard">
      <TodayHeader now={clock} />
      <Reveal className="daily-metrics">
        <Link href="/schedule"><strong><AnimatedNumber value={classes.length} /></strong><span>classes today<small>{marked} recorded</small></span><ArrowUpRightIcon aria-hidden="true" /></Link>
        <Link href="/tasks"><strong><AnimatedNumber value={remaining} /></strong><span>on your list<small>{remaining ? 'One step at a time' : 'A fresh start'}</small></span><ArrowUpRightIcon aria-hidden="true" /></Link>
        <Link href="/planner"><strong><AnimatedNumber value={semester.percentage} /><small>%</small></strong><span>semester<small>Day {semester.currentDay}</small></span><ArrowUpRightIcon aria-hidden="true" /></Link>
      </Reveal>
      <div className="dashboard-columns">
        <div className="dashboard-column">
          <NextClass now={clock} />
          <Reveal delay={.08}><TodayTimeline now={clock} /></Reveal>
        </div>
        <div className="dashboard-column">
          <AttendanceSnapshot />
          <Reveal className="glance-grid"><MarksGlanceWidget /><PlannerGlanceWidget /></Reveal>
          <Reveal><HomeTaskSummary /></Reveal>
        </div>
      </div>
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
