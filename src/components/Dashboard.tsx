'use client';

import { useAttendance } from './AttendanceProvider';
import SkeletonDashboard from './SkeletonDashboard';
import { TodayHeader } from './home/TodayHeader';
import { NextClass } from './home/NextClass';
import { TodayTimeline } from './home/TodayTimeline';
import { HomeTaskSummary } from './home/HomeTaskSummary';
import { TodayProgress } from './home/TodayProgress';
import { AttendanceSnapshot } from './home/AttendanceSnapshot';

export default function Dashboard() {
  const { isLoaded } = useAttendance();

  if (!isLoaded) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="max-w-lg mx-auto pb-4 relative z-0">
      <TodayHeader />
      <NextClass />
      <TodayTimeline />
      <HomeTaskSummary />
      <TodayProgress />
      <AttendanceSnapshot />
    </div>
  );
}
