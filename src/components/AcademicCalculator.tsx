'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRightIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SUBJECTS } from '@/lib/config';
import {
  CALCULATOR_GRADES, CALCULATOR_STORAGE_KEY, evaluateCourse, evaluateRow,
  readCalculatorDraft, summarizeRows,
  type CalculatorDraft, type CalculatorGrade, type CourseInput, type SemesterInput,
} from '@/lib/academicCalculator';
import Dialog from './Dialog';
import { LiquidButton } from './ui/LiquidButton';
import './academic-calculator.css';

type Mode = 'spi' | 'cgpa';
type Removed = { mode: 'spi'; row: CourseInput; index: number } | { mode: 'cgpa'; row: SemesterInput; index: number };
const compact = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(value);
const makeCourses = (credits: Record<string, number>): CourseInput[] => SUBJECTS.map(subject => ({
  id: subject.code, name: `${subject.code} · ${subject.name}`,
  credits: Number.isFinite(credits[subject.code]) && credits[subject.code] > 0 ? String(credits[subject.code]) : '', grade: '',
}));

export default function AcademicCalculator({ mode, savedCredits }: { mode: Mode; savedCredits: Record<string, number> }) {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [draft, setDraft] = useState<CalculatorDraft>(() => ({ version: 1, courses: makeCourses(savedCredits), semesters: [
    { id: 'semester-1', name: 'Semester 1', credits: '', spi: '' },
    { id: 'semester-2', name: 'Semester 2', credits: '', spi: '' },
  ] }));
  const [ready, setReady] = useState(false);
  const [saveNote, setSaveNote] = useState('Drafts stay on this device.');
  const [removed, setRemoved] = useState<Removed | null>(null);
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    // Hydrate only after mount, without overwriting stored drafts on first render.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(CALCULATOR_STORAGE_KEY);
      if (raw) {
        const stored = readCalculatorDraft(raw);
        if (stored) { setDraft(stored); setSaveNote('Draft restored from this device.'); }
        else setSaveNote('The previous draft could not be read. New edits will save a fresh draft.');
      }
    } catch { setSaveNote('Device storage is unavailable. Keep this page open to retain your entries.'); }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function save(next: CalculatorDraft) {
    setDraft(next);
    try {
      localStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(next));
      setSaveNote('Saved on this device.');
    } catch { setSaveNote('Could not save on this device. Keep this page open to retain your entries.'); }
  }

  const courseResults = draft.courses.map(evaluateCourse);
  const semesterResults = draft.semesters.map(row => evaluateRow(row.credits, row.spi));
  const spi = summarizeRows(courseResults);
  const result = mode === 'spi' ? spi : summarizeRows(semesterResults);
  const rows = mode === 'spi' ? draft.courses : draft.semesters;
  const results = mode === 'spi' ? courseResults : semesterResults;
  const noun = mode === 'spi' ? 'course' : 'semester';
  const title = mode.toUpperCase();
  const canUseSPI = spi.value !== null && !spi.pending && !spi.invalid && spi.counted > 0;

  function addRow() {
    const rowId = crypto.randomUUID();
    if (mode === 'spi') save({ ...draft, courses: [...draft.courses, { id: rowId, name: '', credits: '', grade: '' }] });
    else save({ ...draft, semesters: [...draft.semesters, { id: rowId, name: `Semester ${draft.semesters.length + 1}`, credits: '', spi: '' }] });
    requestAnimationFrame(() => root.current?.querySelector<HTMLInputElement>(`[data-row-id="${rowId}"] input`)?.focus());
  }

  function removeRow(index: number) {
    if (mode === 'spi') {
      setRemoved({ mode, row: draft.courses[index], index });
      save({ ...draft, courses: draft.courses.filter((_, i) => i !== index) });
    } else {
      setRemoved({ mode, row: draft.semesters[index], index });
      save({ ...draft, semesters: draft.semesters.filter((_, i) => i !== index) });
    }
    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('[data-undo]')?.focus());
  }

  function undoRemove() {
    if (!removed) return;
    if (removed.mode === 'spi') {
      const courses = [...draft.courses];
      courses.splice(removed.index, 0, removed.row);
      save({ ...draft, courses });
    } else {
      const semesters = [...draft.semesters];
      semesters.splice(removed.index, 0, removed.row);
      save({ ...draft, semesters });
    }
    const restoredId = removed.row.id;
    setRemoved(null);
    requestAnimationFrame(() => root.current?.querySelector<HTMLInputElement>(`[data-row-id="${CSS.escape(restoredId)}"] input`)?.focus());
  }

  function useCurrentSPI() {
    if (!canUseSPI || spi.value === null) return;
    const existing = draft.semesters.find(row => row.id === 'current-spi');
    const row = { id: 'current-spi', name: existing?.name || 'Current semester', credits: String(spi.credits), spi: String(spi.value) };
    save({ ...draft, semesters: existing ? draft.semesters.map(item => item.id === row.id ? row : item) : [...draft.semesters, row] });
    setRemoved(null);
  }

  if (!ready) return <div className="academic-loading" role="status">Loading your calculator…</div>;

  return <section ref={root} className="academic-calculator" aria-label={`${title} calculator`}>
    <motion.div key={mode} className="academic-result" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}>
      <div className="academic-result-copy">
        <p className="planning-eyebrow">{mode === 'spi' ? 'One semester. Every credit counts.' : 'Your progress, semester by semester.'}</p>
        <h2>{mode === 'spi' ? 'Semester performance' : 'Cumulative performance'}</h2>
        <div className="academic-value" role="status" aria-label={`${result.pending ? 'Provisional ' : ''}${title} result`}>
          <span>{result.value === null ? '—' : result.value.toFixed(2)}</span><small>/ 10</small>
        </div>
        <p className="academic-result-status">{result.invalid ? 'Correct the highlighted entries to calculate.' : result.value === null ? `Add credits and ${mode === 'spi' ? 'grades' : 'SPIs'} to see your ${title}.` : result.pending ? `Provisional · ${result.pending} ${noun}${result.pending === 1 ? '' : 's'} still incomplete` : `Calculated from ${result.counted} ${noun}${result.counted === 1 ? '' : 's'}`}</p>
      </div>
      <div className="academic-dial" aria-hidden="true">
        <svg viewBox="0 0 120 120"><circle className="academic-dial-track" cx="60" cy="60" r="49" /><circle className="academic-dial-fill" cx="60" cy="60" r="49" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - (result.value ?? 0) * 10} /></svg>
        <span>{title}<small>10-point scale</small></span>
      </div>
      <dl className="academic-totals"><div><dt>Counted credits</dt><dd>{compact(result.credits)}</dd></div><div><dt>Weighted points</dt><dd>{compact(result.points)}</dd></div><div><dt>{mode === 'spi' ? 'Courses included' : 'Semesters included'}</dt><dd>{result.counted}<small> / {rows.length}</small></dd></div></dl>
    </motion.div>

    <div className="academic-workspace">
      <div className="academic-section-heading"><div><h3>{mode === 'spi' ? 'Your courses' : 'Your semesters'}</h3><p>{mode === 'spi' ? 'Use the credits on your grade sheet. Select your final or expected grades.' : 'Enter each semester’s SPI and counted credits. You can also enter a previous CGPA with its cumulative credits as one row.'}</p></div></div>
      {mode === 'cgpa' && <div className="academic-transfer"><div><strong>Bring in your current semester</strong><p>{canUseSPI ? `SPI ${spi.value?.toFixed(2)} · ${compact(spi.credits)} credits. Add it once, or update your saved snapshot.` : 'Complete the SPI calculator to include this semester here.'}</p></div><button type="button" className="glass-control" disabled={!canUseSPI} onClick={useCurrentSPI}>{draft.semesters.some(row => row.id === 'current-spi') ? 'Update current SPI' : 'Use current SPI'}<ArrowUpRightIcon aria-hidden="true" /></button></div>}
      {removed && <div className="academic-undo" role="status"><span>{removed.mode === 'spi' ? 'Course' : 'Semester'} removed.</span><button data-undo type="button" onClick={undoRemove}>Undo</button></div>}
      <div className="academic-rows">
        {rows.map((row, index) => {
          const evaluation = results[index];
          const rowId = `${id}-${mode}-${row.id}`;
          const excluded = evaluation.status === 'excluded';
          const update = (field: string, value: string) => {
            if (mode === 'spi') save({ ...draft, courses: draft.courses.map(item => item.id === row.id ? { ...item, [field]: value as CalculatorGrade } : item) });
            else save({ ...draft, semesters: draft.semesters.map(item => item.id === row.id ? { ...item, [field]: value } : item) });
          };
          return <div key={row.id} data-row-id={row.id} className={`academic-row ${evaluation.status === 'invalid' ? 'is-invalid' : ''}`}>
            <div className="academic-row-top"><span className="academic-row-number">{String(index + 1).padStart(2, '0')}</span><label className="academic-name" htmlFor={`${rowId}-name`}><span className="sr-only">{noun} {index + 1} name</span><input id={`${rowId}-name`} value={row.name} onChange={e => update('name', e.target.value)} maxLength={120} placeholder={mode === 'spi' ? 'Course name' : 'Semester name'} /></label><button className="planning-icon-action" type="button" aria-label={`Remove ${noun} ${index + 1}`} onClick={() => removeRow(index)}><TrashIcon aria-hidden="true" /></button></div>
            <div className="academic-row-fields"><label htmlFor={`${rowId}-credits`}>Credits<input id={`${rowId}-credits`} type="text" inputMode="decimal" autoComplete="off" maxLength={30} placeholder="e.g. 4" disabled={excluded} value={row.credits} onChange={e => update('credits', e.target.value)} aria-describedby={evaluation.error ? `${rowId}-error` : undefined} aria-invalid={evaluation.status === 'invalid'} /></label>
              {mode === 'spi' ? <label htmlFor={`${rowId}-grade`}>Grade<select id={`${rowId}-grade`} value={(row as CourseInput).grade} onChange={e => update('grade', e.target.value)}><option value="">Select grade</option>{Object.entries(CALCULATOR_GRADES).map(([grade, points]) => <option key={grade} value={grade}>{grade} · {points} points</option>)}<option value="EXCLUDED">Not counted (S / X / T)</option></select></label> : <label htmlFor={`${rowId}-spi`}>Semester SPI<input id={`${rowId}-spi`} type="text" inputMode="decimal" autoComplete="off" maxLength={30} placeholder="0 to 10" value={(row as SemesterInput).spi} onChange={e => update('spi', e.target.value)} aria-describedby={evaluation.error ? `${rowId}-error` : undefined} aria-invalid={evaluation.status === 'invalid'} /></label>}
            </div>
            <div className="academic-row-foot"><span>{evaluation.status === 'complete' ? `${compact(evaluation.credits)} × ${compact(evaluation.score)} = ${compact(evaluation.points)} weighted points` : excluded ? 'Excluded from both points and credits.' : evaluation.status === 'invalid' ? 'Check this entry' : 'Waiting for credits and a score'}</span>{evaluation.status === 'complete' && <div className="academic-score-track" aria-hidden="true"><span style={{ width: `${evaluation.score * 10}%` }} /></div>}</div>
            {evaluation.error && <p id={`${rowId}-error`} className="academic-error">{evaluation.error}</p>}
          </div>;
        })}
        {rows.length === 0 && <p className="academic-empty">Your calculator is clear. Add a {noun} to get started.</p>}
      </div>
      <div className="academic-actions"><LiquidButton onClick={addRow} disabled={rows.length >= 300}><PlusIcon aria-hidden="true" />Add {noun}</LiquidButton><button className="academic-clear" type="button" onClick={() => setShowClear(true)} disabled={!rows.length}>Clear {title}</button></div>
      <p className="academic-save-note">{saveNote}</p>
    </div>

    <details className="academic-method"><summary>How {title} is calculated<span aria-hidden="true">+</span></summary>
      <p className="academic-formula">{mode === 'spi' ? 'Σ (course credits × grade points) ÷ Σ course credits' : 'Σ (semester credits × SPI) ÷ Σ semester credits'}</p>
      <p>{mode === 'spi' ? 'A* and A = 10, A− = 9, B = 8, B− = 7, C = 6, C− = 5, F = 0. Failed courses still count toward credits in the calculation. Leave incomplete grades blank; select “Not counted” only for non-graded courses.' : 'Use credits counted in the index, including failed graded courses. Rounded semester SPIs make this an estimate. For repeated or replaced courses, use adjusted transcript totals so the old and replacement grades are not counted twice. IIT (BHU) calls the cumulative index CPI.'}</p>
      <p>Incomplete rows are omitted from the provisional result. Calculations keep full precision; final indices display two decimals. Calculator drafts are saved on this device and do not change your scorecard.</p>
      <a href="https://www.iitbhu.ac.in/dean/doaa/ordinances" target="_blank" rel="noreferrer">IIT (BHU) grading rules <ArrowUpRightIcon aria-hidden="true" /></a>
    </details>
    {showClear && <Dialog label={`Clear ${title} calculator`} onClose={() => setShowClear(false)}><div className="academic-confirm"><h2>Clear the {title} calculator?</h2><p>This removes these calculator entries. Your saved marks and the other calculator stay as they are.</p><div><button className="glass-control" type="button" onClick={() => setShowClear(false)}>Keep entries</button><button className="ink-btn" type="button" onClick={() => { save(mode === 'spi' ? { ...draft, courses: [] } : { ...draft, semesters: [] }); setRemoved(null); setShowClear(false); }}>Clear {title}</button></div></div></Dialog>}
  </section>;
}
