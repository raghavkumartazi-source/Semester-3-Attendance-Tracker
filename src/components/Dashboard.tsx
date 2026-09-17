'use client';

import { useAttendance } from './AttendanceProvider';
import SkeletonDashboard from './SkeletonDashboard';
import { TodayHeader } from './home/TodayHeader';
import { NextClass } from './home/NextClass';
import { TodayTimeline } from './home/TodayTimeline';
import { HomeTaskSummary } from './home/HomeTaskSummary';
import { TodayProgress } from './home/TodayProgress';
import { AttendanceSnapshot } from './home/AttendanceSnapshot';
import AttendanceForecast from './home/AttendanceForecast';
import { SUBJECTS } from '@/lib/config';

import StreakWidget from './home/StreakWidget';
import { AttendanceHeatmap } from './home/AttendanceHeatmap';
import { AttendanceTrendChart } from './home/AttendanceTrendChart';
import { OverallBreakdownChart } from './home/OverallBreakdownChart';
import { MarksGlanceWidget } from './home/MarksGlanceWidget';
import { PlannerGlanceWidget } from './home/PlannerGlanceWidget';

export default function Dashboard() {
  const { isLoaded, sessions } = useAttendance();

  if (!isLoaded) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="max-w-lg mx-auto pb-4 relative z-0 flex flex-col gap-5 animate-in fade-in duration-500">
      <TodayHeader />
      
      <div className="grid grid-cols-2 gap-3">
        <MarksGlanceWidget />
        <PlannerGlanceWidget />
      </div>
      
      <StreakWidget />
      <NextClass />
      <TodayTimeline />
      <HomeTaskSummary />
      <TodayProgress />
      <AttendanceSnapshot />
      <OverallBreakdownChart sessions={sessions} />
      <AttendanceTrendChart sessions={sessions} />
      <AttendanceHeatmap />
      <AttendanceForecast subjects={SUBJECTS} sessions={sessions} />
    </div>
  );
}
