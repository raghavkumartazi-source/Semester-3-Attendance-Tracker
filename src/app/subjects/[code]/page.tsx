'use client';
export const dynamic = 'force-dynamic';
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
      <div className="space-y-4" role="status" aria-label="Loading subject register" aria-busy="true">
        <div className="h-36 rounded-[25px] glass-surface" />
        <div className="h-24 rounded-[16px] glass-surface" />
        <div className="h-56 rounded-[20px] glass-surface" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="empty-state">
        <p>Subject not found</p>
        <button type="button" onClick={() => router.push('/subjects')} className="attendance-back">Back to attendance</button>
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
      <div className="mb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="attendance-back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to attendance
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
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="attendance-extra-toggle"
          aria-expanded={showAddForm}
          aria-controls="extra-class-form"
        >
          <span>Add an extra class</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d={showAddForm ? 'M5 12h14' : 'M12 5v14M5 12h14'} /></svg>
        </button>

        {showAddForm && (
          <div id="extra-class-form" className="mt-3 attendance-inline-form space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="extra-class-date">Date</label>
                <input
                  id="extra-class-date"
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="extra-class-time">Time</label>
                <input
                  id="extra-class-time"
                  type="time"
                  value={addTime}
                  onChange={(e) => setAddTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="extra-class-type">Class type</label>
              <select
                id="extra-class-type"
                value={addType}
                onChange={(e) => setAddType(e.target.value as ClassType)}
              >
                <option value="Lecture" className="bg-zinc-900">Lecture</option>
                <option value="Tutorial" className="bg-zinc-900">Tutorial</option>
                <option value="Lab" className="bg-zinc-900">Lab</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddClass}
              disabled={!addDate}
            >
              Add Class
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
