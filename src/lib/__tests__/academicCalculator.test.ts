import { describe, expect, it } from 'vitest';
import { CALCULATOR_GRADES, evaluateCourse, evaluateRow, summarizeRows, readCalculatorDraft } from '../academicCalculator';

describe('academic calculators', () => {
  it('uses the IIT BHU grade scale and counts failed course credits', () => {
    expect(CALCULATOR_GRADES).toEqual({ 'A*': 10, A: 10, 'A-': 9, B: 8, 'B-': 7, C: 6, 'C-': 5, F: 0 });
    const result = summarizeRows([
      evaluateCourse({ id: 'a', name: 'Maths', credits: '4', grade: 'A' }),
      evaluateCourse({ id: 'b', name: 'Lab', credits: '2', grade: 'F' }),
    ]);
    expect(result.credits).toBe(6);
    expect(result.value).toBeCloseTo(40 / 6);
  });
  it('weights semesters by credits rather than averaging their SPIs', () => {
    const result = summarizeRows([evaluateRow('20', '8'), evaluateRow('30', '9')]);
    expect(result.value).toBe(8.6);
    expect(result.points).toBe(430);
  });
  it('distinguishes zero grades, pending rows, excluded courses and no data', () => {
    const result = summarizeRows([evaluateRow('4', '0'), evaluateRow('4', ''), evaluateRow('', '', true)]);
    expect(result).toMatchObject({ value: 0, credits: 4, pending: 1, excluded: 1, counted: 1 });
    expect(summarizeRows([]).value).toBeNull();
    expect(summarizeRows([evaluateRow('', '', true)]).value).toBeNull();
  });
  it('rejects invalid input without displaying a plausible partial total', () => {
    for (const [credits, score] of [['0', '9'], ['-2', '9'], ['NaN', '9'], ['2', '11'], ['2', '-1'], ['Infinity', '8'], ['1001', '8']]) {
      expect(summarizeRows([evaluateRow('4', '9'), evaluateRow(credits, score)]).value).toBeNull();
      expect(evaluateRow(credits, score).status).toBe('invalid');
    }
  });
  it('preserves fractional credits and unrounded SPI when combining semesters', () => {
    const spi = summarizeRows([evaluateRow('3.5', '9'), evaluateRow('2', '8')]);
    const cgpa = summarizeRows([evaluateRow(String(spi.credits), String(spi.value)), evaluateRow('20', '7.7')]);
    expect(cgpa.value).toBeCloseTo((47.5 + 154) / 25.5, 12);
  });
  it('validates stored drafts without accepting corrupt data or unsupported grades', () => {
    const draft = { version: 1, courses: [{ id: 'a', name: 'Maths', credits: '', grade: '' }], semesters: [] };
    expect(readCalculatorDraft(JSON.stringify(draft))).toEqual(draft);
    expect(readCalculatorDraft('{broken')).toBeNull();
    expect(readCalculatorDraft(JSON.stringify({ ...draft, version: 2 }))).toBeNull();
    expect(readCalculatorDraft(JSON.stringify({ ...draft, courses: [{ ...draft.courses[0], grade: 'AA' }] }))).toBeNull();
    expect(readCalculatorDraft(JSON.stringify({ ...draft, courses: [draft.courses[0], draft.courses[0]] }))).toBeNull();
  });
});
