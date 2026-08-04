'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAttendance } from '@/components/AttendanceProvider';
import { SUBJECTS } from '@/lib/config';
import { getSubjectSessions, createExtraSession } from '@/lib/sessions';
import AttendanceRegister from '@/components/AttendanceRegister';
import { ClassType } from '@/lib/types';

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = decodeURIComponent(params.code as string);
  const { sessions, updateSessionStatus, addSession, isLoaded } = useAttendance();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState('');
  const [addTime, setAddTime] = useState('09:00');
  const [addType, setAddType] = useState<ClassType>('Lecture');

  const subject = SUBJECTS.find(s => s.code === code);
  const subjectSessions = useMemo(
    () => getSubjectSessions(sessions, code),
    [sessions, code]
  );

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Subject not found</p>
      </div>
    );
  }

  const handleAddClass = () => {
    if (!addDate) return;
    const endTime = addType === 'Lab'
      ? `${String(parseInt(addTime.split(':')[0]) + 2).padStart(2, '0')}:${addTime.split(':')[1]}`
      : `${String(parseInt(addTime.split(':')[0]) + 1).padStart(2, '0')}:${addTime.split(':')[1]}`;
    const session = createExtraSession(code, addDate, addTime, endTime, addType);
    addSession(session);
    setShowAddForm(false);
    setAddDate('');
  };

  return (
    <div className="pb-24">
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      </div>

      {/* Register */}
      <AttendanceRegister
        subject={subject}
        sessions={subjectSessions}
        onMarkAttendance={updateSessionStatus}
      />

      {/* Add Class */}
      <div className="mt-5">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full glass-card rounded-[20px] py-4 text-sm font-semibold text-white/50 hover:text-white transition-all shadow-none hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] border-dashed"
        >
          + Add Extra Class
        </button>

        {showAddForm && (
          <div className="mt-3 glass-panel rounded-[24px] p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Date</label>
                <input
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 focus:bg-white/[0.04] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Time</label>
                <input
                  type="time"
                  value={addTime}
                  onChange={(e) => setAddTime(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 focus:bg-white/[0.04] transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Type</label>
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value as ClassType)}
                className="mt-1.5 w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 focus:bg-white/[0.04] transition-colors appearance-none"
              >
                <option value="Lecture" className="bg-zinc-900">Lecture</option>
                <option value="Tutorial" className="bg-zinc-900">Tutorial</option>
                <option value="Lab" className="bg-zinc-900">Lab</option>
              </select>
            </div>
            <button
              onClick={handleAddClass}
              disabled={!addDate}
              className="w-full rounded-[14px] glass-floating border border-white/20 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,255,255,0.05)] mt-2"
            >
              Add Class
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
