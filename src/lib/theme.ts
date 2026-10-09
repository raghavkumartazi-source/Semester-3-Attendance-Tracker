/* ============================================================
   lib/theme.ts
   ------------------------------------------------------------
   Shared subject colors for the semester interface.
   ============================================================ */

/** Subject accents keep their identity within the After Hours palette. */
export const SUBJECT_COLORS: Record<string, string> = {
  'EC-201': '#eab5b1',
  'EC-202': '#d8a7c8',
  'EC-203': '#c5b0d8',
  'EO-201': '#add5ce',
  'EO-103': '#bad8c7',
  'MA-201': '#eec39f',
  'MO-201': '#dfaab6',
  'HLM': '#d4c1e5',
};

/** Subject emoji map. */
export const SUBJECT_EMOJIS: Record<string, string> = {
  'EC-201': '⚡',
  'EC-202': '🔌',
  'EC-203': '💡',
  'EO-201': '🌐',
  'EO-103': '🔬',
  'MA-201': '📐',
  'MO-201': '🧪',
  'HLM': '📚',
};

/** Time-of-day ambient colors for background. */
const AMBIENT_TIME_OF_DAY = [
  { hours: [0, 5], primary: '#0000ff', secondary: '#4400ff' },
  { hours: [5, 9], primary: '#a0d5ad', secondary: '#00aa66' },
  { hours: [9, 17], primary: '#91bfd2', secondary: '#0088ff' },
  { hours: [17, 20], primary: '#ff6600', secondary: '#d5a5b3' },
  { hours: [20, 24], primary: '#d5a5b3', secondary: '#b7afd5' },
];

export function ambientColorsForHour(hour: number = new Date().getHours()) {
  return AMBIENT_TIME_OF_DAY.find((entry) => hour >= entry.hours[0] && hour < entry.hours[1]) ?? AMBIENT_TIME_OF_DAY[0];
}
