'use client';

import { useState, useRef } from 'react';
import { useAttendance } from '@/components/AttendanceProvider';
import AuthScreen from '@/components/AuthScreen';
import { loadPlannerPreferences, savePlannerPreferences, validatePlannerPreferences, DEFAULT_PLANNER_PREFERENCES, PlannerPreferences } from '@/lib/plannerPreferences';
import { ExportReportButton } from '@/components/ExportReportButton';

export default function SettingsPage() {
  const { resetAll, exportData, importData, user, syncStatus, lastSynced, signOut, syncNow } = useAttendance();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plannerPrefs, setPlannerPrefs] = useState<PlannerPreferences>(loadPlannerPreferences());
  const [plannerExpanded, setPlannerExpanded] = useState(false);
  const [plannerErrors, setPlannerErrors] = useState<Partial<Record<keyof PlannerPreferences, string>>>({});
  const [showPlannerReset, setShowPlannerReset] = useState(false);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const success = importData(json);
      setImportStatus(success ? 'success' : 'error');
      setTimeout(() => setImportStatus('idle'), 3000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePlannerChange = (field: keyof PlannerPreferences, value: string | number) => {
    const next = { ...plannerPrefs, [field]: value };
    const { valid, errors } = validatePlannerPreferences(next);
    setPlannerPrefs(next);
    setPlannerErrors(errors);
    if (valid) {
      savePlannerPreferences(next);
    }
  };

  const formatTimeRange = (start: string, end: string) => {
    const format12 = (t: string) => {
      const parts = t.split(':').map(Number);
      let h = parts[0];
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}${m > 0 ? `:${m.toString().padStart(2, '0')}` : ''} ${ampm}`;
    };
    return `${format12(start)}–${format12(end)}`;
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24 animate-fade-in-up">
      <h1 className="text-lg font-bold text-white mb-2">Settings</h1>

      {/* Authentication & Cloud Sync */}
      <AuthScreen 
        userEmail={user?.email} 
        syncStatus={syncStatus} 
        lastSynced={lastSynced}
        onSignOut={signOut}
        onSyncNow={syncNow}
      />

      {/* Planner Settings */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
          Planner
        </h2>
        
        <div className="glass-elevated rounded-[18px] overflow-hidden transition-all duration-300">
          <button
            onClick={() => setPlannerExpanded(!plannerExpanded)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div>
              <p className="text-sm font-bold tracking-wide text-white drop-shadow-sm">Smart Planner Preferences</p>
              {!plannerExpanded && (
                <p className="text-[11px] text-white/50 mt-0.5">
                  Weekdays {formatTimeRange(plannerPrefs.weekdayWorkStart, plannerPrefs.weekdayWorkEnd)} · {plannerPrefs.prefSessionDuration} min sessions
                </p>
              )}
            </div>
            <svg className={`w-5 h-5 text-white/40 transition-transform duration-300 ${plannerExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {plannerExpanded && (
            <div className="px-5 pb-5 pt-1 space-y-6 border-t border-white/5 animate-fade-in-up">
              
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Weekdays</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5">Available from</label>
                    <input type="time" value={plannerPrefs.weekdayWorkStart} onChange={(e) => handlePlannerChange('weekdayWorkStart', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm" />
                    {plannerErrors.weekdayWorkStart && <p className="text-[10px] text-red-400 mt-1">{plannerErrors.weekdayWorkStart}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5">Available until</label>
                    <input type="time" value={plannerPrefs.weekdayWorkEnd} onChange={(e) => handlePlannerChange('weekdayWorkEnd', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Weekends</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5">Available from</label>
                    <input type="time" value={plannerPrefs.weekendWorkStart} onChange={(e) => handlePlannerChange('weekendWorkStart', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm" />
                    {plannerErrors.weekendWorkStart && <p className="text-[10px] text-red-400 mt-1">{plannerErrors.weekendWorkStart}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5">Available until</label>
                    <input type="time" value={plannerPrefs.weekendWorkEnd} onChange={(e) => handlePlannerChange('weekendWorkEnd', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Session Length</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5">Minimum (min)</label>
                    <input type="number" min="10" max="180" value={plannerPrefs.minSessionDuration} onChange={(e) => handlePlannerChange('minSessionDuration', parseInt(e.target.value) || 10)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm" />
                    {plannerErrors.minSessionDuration && <p className="text-[10px] text-red-400 mt-1">{plannerErrors.minSessionDuration}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5">Preferred (min)</label>
                    <input type="number" min="10" max="240" value={plannerPrefs.prefSessionDuration} onChange={(e) => handlePlannerChange('prefSessionDuration', parseInt(e.target.value) || 60)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm" />
                    {plannerErrors.prefSessionDuration && <p className="text-[10px] text-red-400 mt-1">{plannerErrors.prefSessionDuration}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Buffer</h3>
                <div>
                  <label className="block text-[10px] text-white/50 mb-1.5">Between commitments (min)</label>
                  <input type="number" min="0" max="60" value={plannerPrefs.bufferDuration} onChange={(e) => handlePlannerChange('bufferDuration', parseInt(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm" />
                  {plannerErrors.bufferDuration && <p className="text-[10px] text-red-400 mt-1">{plannerErrors.bufferDuration}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                {!showPlannerReset ? (
                  <button onClick={() => setShowPlannerReset(true)} className="text-[11px] font-bold text-white/40 hover:text-white/80 transition-colors uppercase tracking-widest">
                    Reset to Defaults
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowPlannerReset(false)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white/60 hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setPlannerPrefs(DEFAULT_PLANNER_PREFERENCES);
                        setPlannerErrors({});
                        savePlannerPreferences(DEFAULT_PLANNER_PREFERENCES);
                        setShowPlannerReset(false);
                      }} 
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-bold transition-colors"
                    >
                      Confirm Reset
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
          Data Management
        </h2>

        <button
          onClick={handleExport}
          className="w-full glass-elevated rounded-[18px] flex items-center justify-between px-5 py-4 text-left"
        >
          <div>
            <p className="text-sm font-bold tracking-wide text-white drop-shadow-sm">Export Data</p>
            <p className="text-[11px] text-white/50 mt-0.5">Download attendance as JSON backup</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        <label className="w-full glass-elevated rounded-[18px] flex items-center justify-between px-5 py-4 cursor-pointer">
          <div>
            <p className="text-sm font-bold tracking-wide text-white drop-shadow-sm">Import Data</p>
            <p className="text-[11px] text-white/50 mt-0.5">
              {importStatus === 'success' ? '✓ Imported successfully' :
               importStatus === 'error' ? '✗ Invalid file format' :
               'Restore from JSON backup'}
            </p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold text-red-400/80 uppercase tracking-widest mt-6">
          Danger Zone
        </h2>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full rounded-[18px] border border-red-500/15 bg-red-500/[0.04] px-5 py-4 text-left transition-all hover:bg-red-500/10 hover:border-red-500/25"
          >
            <p className="text-sm font-bold text-red-400">Reset All Data</p>
            <p className="text-[11px] text-red-400/60 mt-0.5">Clear all attendance records permanently</p>
          </button>
        ) : (
          <div className="glass-surface rounded-[18px] border-red-500/20 p-5 space-y-4">
            <div>
              <p className="text-sm font-bold text-red-400">Are you absolutely sure?</p>
              <p className="text-[11px] text-white/60 mt-1">
                This will delete all sessions and attendance markings. Make sure you have exported a backup first.
                {user && (
                  <span className="block mt-2 font-semibold text-red-300">
                    Warning: Cloud sync is active. This will also delete your cloud records.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-[12px] glass-control px-4 py-2.5 text-xs font-semibold text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAll(true);
                  setShowResetConfirm(false);
                }}
                className="flex-1 rounded-[14px] bg-red-500/20 border border-red-500/40 px-4 py-2.5 text-xs font-bold text-red-100 hover:bg-red-500/30 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        <ExportReportButton />
      </div>

      {/* About */}
      <div className="glass-elevated rounded-[18px] px-4 py-4 text-center">
        <p className="text-[10px] font-semibold text-white/50 tracking-widest uppercase">
          Attendance Tracker v1.0 · IIT (BHU)
        </p>
        <p className="mt-1 text-[9px] text-white/30">
          Data stored locally in your browser. Export regularly to prevent data loss.
        </p>
      </div>
    </div>
  );
}
