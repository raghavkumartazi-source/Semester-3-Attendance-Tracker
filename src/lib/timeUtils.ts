export const timeUtils = {
  getGreeting: (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  },

  getFormattedDate: (): string => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  },

  getSemesterProgress: (): { currentDay: number; totalDays: number; percentage: number } => {
    // 23 July 2026 -> 27 November 2026
    const start = new Date(2026, 6, 23); // month is 0-indexed, 6=July
    const end = new Date(2026, 10, 27); // 10=November
    const today = new Date();

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const clampedDay = Math.max(0, Math.min(currentDay, totalDays));
    const percentage = (clampedDay / totalDays) * 100;

    return { currentDay: clampedDay, totalDays, percentage };
  },

  getCurrentMinutes: (): number => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  },

  isToday: (dateString?: string | null): boolean => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  },

  isTomorrow: (dateString?: string | null): boolean => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d.getDate() === tomorrow.getDate() && 
           d.getMonth() === tomorrow.getMonth() && 
           d.getFullYear() === tomorrow.getFullYear();
  },

  isOverdue: (dateString?: string | null): boolean => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime() < today.getTime();
  },

  formatDuration: (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  },

  getLocalISODate: (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};
