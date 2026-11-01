// IIT (BHU) UG Ordinances, Appendix 7: 2014–15 onwards.
// https://www.iitbhu.ac.in/contents/institute/dean/doaa/doc/ordinance_appendix-7.pdf
export const CALCULATOR_GRADES = {
  'A*': 10, A: 10, 'A-': 9, B: 8, 'B-': 7, C: 6, 'C-': 5, F: 0,
} as const;
export type CalculatorGrade = keyof typeof CALCULATOR_GRADES | '' | 'EXCLUDED';
export interface CourseInput { id: string; name: string; credits: string; grade: CalculatorGrade }
export interface SemesterInput { id: string; name: string; credits: string; spi: string }
export interface CalculatorDraft { version: 1; courses: CourseInput[]; semesters: SemesterInput[] }
export const CALCULATOR_STORAGE_KEY = 'semester-academic-calculator-v1';

export function parseCalculatorNumber(value: string): number | null {
  if (!/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function evaluateRow(creditsText: string, scoreText: string, excluded = false) {
  if (excluded) return { status: 'excluded' as const, credits: 0, score: 0, points: 0, error: '' };
  const credits = parseCalculatorNumber(creditsText);
  const score = parseCalculatorNumber(scoreText);
  const creditError = creditsText.trim() !== '' && (credits === null || credits <= 0 || credits > 1000);
  const scoreError = scoreText.trim() !== '' && (score === null || score < 0 || score > 10);
  if (creditError || scoreError) return { status: 'invalid' as const, credits: 0, score: 0, points: 0, error: creditError ? 'Enter credits greater than 0 and up to 1,000.' : 'Enter an SPI from 0 to 10.' };
  if (credits === null || score === null) return { status: 'pending' as const, credits: 0, score: 0, points: 0, error: '' };
  return { status: 'complete' as const, credits, score, points: credits * score, error: '' };
}

export function evaluateCourse(course: CourseInput) {
  return evaluateRow(course.credits, course.grade === '' || course.grade === 'EXCLUDED' ? '' : String(CALCULATOR_GRADES[course.grade]), course.grade === 'EXCLUDED');
}

export function summarizeRows(rows: ReturnType<typeof evaluateRow>[]) {
  const complete = rows.filter(row => row.status === 'complete');
  const credits = complete.reduce((sum, row) => sum + row.credits, 0);
  const points = complete.reduce((sum, row) => sum + row.points, 0);
  const invalid = rows.filter(row => row.status === 'invalid').length;
  return {
    value: credits > 0 && !invalid ? points / credits : null,
    credits, points, invalid, counted: complete.length,
    pending: rows.filter(row => row.status === 'pending').length,
    excluded: rows.filter(row => row.status === 'excluded').length,
  };
}

export function readCalculatorDraft(raw: string): CalculatorDraft | null {
  try {
    const data = JSON.parse(raw);
    const validRows = (rows: unknown, course: boolean) => Array.isArray(rows) && rows.length <= 300 &&
      new Set(rows.map(row => row?.id)).size === rows.length && rows.every(row =>
        row && typeof row.id === 'string' && row.id.length > 0 && row.id.length <= 100 &&
        typeof row.name === 'string' && row.name.length <= 120 &&
        typeof row.credits === 'string' && row.credits.length <= 30 &&
        (course ? typeof row.grade === 'string' && (row.grade === '' || row.grade === 'EXCLUDED' || Object.hasOwn(CALCULATOR_GRADES, row.grade)) : typeof row.spi === 'string' && row.spi.length <= 30));
    return data?.version === 1 && validRows(data.courses, true) && validRows(data.semesters, false) ? data : null;
  } catch { return null; }
}
