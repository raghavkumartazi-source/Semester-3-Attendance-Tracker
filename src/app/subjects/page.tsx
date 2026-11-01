'use client';
export const dynamic = 'force-dynamic';
import { useAttendance } from '@/components/AttendanceProvider';
import { SUBJECTS } from '@/lib/config';
import MasterRegister from '@/components/MasterRegister';

export default function SubjectsPage() {
  const { sessions, updateSessionStatus, isLoaded } = useAttendance();

  if (!isLoaded) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading attendance" aria-busy="true">
        <div className="page-header"><h1>Attendance</h1><p className="page-subtitle">Getting your semester ready…</p></div>
        <div className="h-48 rounded-[25px] glass-surface" />
        {[0, 1, 2].map(index => <div key={index} className="h-44 rounded-[23px] glass-surface" />)}
      </div>
    );
  }

  return (
    <div className="pb-24">
      <MasterRegister 
        subjects={SUBJECTS} 
        sessions={sessions} 
        onMarkAttendance={updateSessionStatus} 
      />
    </div>
  );
}
