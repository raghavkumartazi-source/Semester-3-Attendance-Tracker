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

import { motion, Variants } from 'framer-motion';
import StreakWidget from './home/StreakWidget';
import { AttendanceHeatmap } from './home/AttendanceHeatmap';
import { AttendanceTrendChart } from './home/AttendanceTrendChart';
import { OverallBreakdownChart } from './home/OverallBreakdownChart';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 24 } }
};

export default function Dashboard() {
  const { isLoaded, sessions } = useAttendance();

  if (!isLoaded) {
    return <SkeletonDashboard />;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-lg mx-auto pb-4 relative z-0 flex flex-col gap-6"
    >
      <motion.div variants={itemVariants}><TodayHeader /></motion.div>
      <motion.div variants={itemVariants}><StreakWidget /></motion.div>
      <motion.div variants={itemVariants}><NextClass /></motion.div>
      <motion.div variants={itemVariants}><TodayTimeline /></motion.div>
      <motion.div variants={itemVariants}><HomeTaskSummary /></motion.div>
      <motion.div variants={itemVariants}><TodayProgress /></motion.div>
      <motion.div variants={itemVariants}><AttendanceSnapshot /></motion.div>
      <motion.div variants={itemVariants}><OverallBreakdownChart sessions={sessions} /></motion.div>
      <motion.div variants={itemVariants}><AttendanceTrendChart sessions={sessions} /></motion.div>
      <motion.div variants={itemVariants}><AttendanceHeatmap /></motion.div>
      <motion.div variants={itemVariants}>
        <AttendanceForecast subjects={SUBJECTS} sessions={sessions} />
      </motion.div>
    </motion.div>
  );
}
