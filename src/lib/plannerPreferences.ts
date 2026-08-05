export interface PlannerPreferences {
  weekdayWorkStart: string; // "17:00"
  weekdayWorkEnd: string;   // "22:00"
  weekendWorkStart: string; // "10:00"
  weekendWorkEnd: string;   // "20:00"
  minSessionDuration: number; // 30
  prefSessionDuration: number; // 60
  bufferDuration: number; // 15
}

export const DEFAULT_PLANNER_PREFERENCES: PlannerPreferences = {
  weekdayWorkStart: '17:00',
  weekdayWorkEnd: '22:00',
  weekendWorkStart: '10:00',
  weekendWorkEnd: '20:00',
  minSessionDuration: 30,
  prefSessionDuration: 60,
  bufferDuration: 15,
};

const STORAGE_KEY = 'semester_os_planner_prefs';

export function validatePlannerPreferences(prefs: PlannerPreferences): { valid: boolean, errors: Partial<Record<keyof PlannerPreferences, string>> } {
  const errors: Partial<Record<keyof PlannerPreferences, string>> = {};

  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  if (parseTime(prefs.weekdayWorkStart) >= parseTime(prefs.weekdayWorkEnd)) {
    errors.weekdayWorkStart = 'Start time must be before end time.';
  }

  if (parseTime(prefs.weekendWorkStart) >= parseTime(prefs.weekendWorkEnd)) {
    errors.weekendWorkStart = 'Start time must be before end time.';
  }

  if (prefs.minSessionDuration < 10 || prefs.minSessionDuration > 180) {
    errors.minSessionDuration = 'Must be between 10 and 180 minutes.';
  }

  if (prefs.prefSessionDuration < prefs.minSessionDuration) {
    errors.prefSessionDuration = 'Cannot be less than minimum session.';
  } else if (prefs.prefSessionDuration > 240) {
    errors.prefSessionDuration = 'Cannot exceed 240 minutes.';
  }

  if (prefs.bufferDuration < 0 || prefs.bufferDuration > 60) {
    errors.bufferDuration = 'Must be between 0 and 60 minutes.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function loadPlannerPreferences(): PlannerPreferences {
  if (typeof window === 'undefined') return DEFAULT_PLANNER_PREFERENCES;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_PLANNER_PREFERENCES, ...parsed };
    }
    return DEFAULT_PLANNER_PREFERENCES;
  } catch (e: unknown) {
    console.error('Failed to load planner preferences', e);
    return DEFAULT_PLANNER_PREFERENCES;
  }
}

export function savePlannerPreferences(prefs: PlannerPreferences): boolean {
  if (typeof window === 'undefined') return false;
  const { valid } = validatePlannerPreferences(prefs);
  if (!valid) return false;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    return true;
  } catch (e: unknown) {
    console.error('Failed to save planner preferences', e);
    return false;
  }
}
