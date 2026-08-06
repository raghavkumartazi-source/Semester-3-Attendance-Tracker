'use client';

import { useState } from 'react';
import { createExtraSession, formatDate } from '@/lib/sessions';
import { useAttendance } from './AttendanceProvider';
import { Subject, ClassType } from '@/lib/types';

interface Props {
  subject: Subject;
  onClose: () => void;
}

export default function AddExtraClassModal({ subject, onClose }: Props) {
  const { addSession } = useAttendance();
  const [date, setDate] = useState(formatDate(new Date()));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [classType, setClassType] = useState<ClassType>('Lecture');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession = createExtraSession(subject.code, date, startTime, endTime, classType);
    addSession(newSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-[24px] border border-white/10 bg-zinc-900/90 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-1">Add Extra Class</h2>
          <p className="text-xs text-white/50 mb-6">{subject.name}</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-white/50 uppercase mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-white/50 uppercase mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-white/50 uppercase mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-white/50 uppercase mb-1.5">
                Class Type
              </label>
              <select
                value={classType}
                onChange={(e) => setClassType(e.target.value as ClassType)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 [&>option]:bg-zinc-800"
              >
                <option value="Lecture">Lecture</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4 mt-6 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-white text-zinc-900 px-4 py-3 text-sm font-bold transition-all hover:bg-white/90 active:scale-[0.98]"
              >
                Add Class
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
