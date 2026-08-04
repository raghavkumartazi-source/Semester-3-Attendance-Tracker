'use client';

import { useAttendance } from '@/components/AttendanceProvider';
import { SUBJECTS } from '@/lib/config';
import MasterRegister from '@/components/MasterRegister';

export default function SubjectsPage() {
  const { sessions, updateSessionStatus, isLoaded } = useAttendance();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
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
