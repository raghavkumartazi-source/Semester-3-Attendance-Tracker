'use client';

import { LiquidButton } from '@/components/ui/LiquidButton';
export const dynamic = 'force-dynamic';

import { useId, useState } from 'react';
import Dialog from '@/components/Dialog';
import AcademicCalculator from '@/components/AcademicCalculator';
import { motion, useReducedMotion } from 'framer-motion';
import '../planning-pages.css';
import { SUBJECTS } from '@/lib/config';
import { useMarks } from '@/components/MarksProvider';
import { 
  calculateTargetRequirements,
  DEFAULT_GRADE_BOUNDARIES,
  simulateGradeScenario,
  getGradePoints
} from '@/lib/calculations';
import { MarkComponent, GradeScenario, GradeLetter } from '@/lib/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CalculatorIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const COMPONENT_TYPE_LABELS = {
  MIDSEM: 'Midsem Exam',
  ENDSEM: 'Endsem Exam',
  QUIZ: 'Quiz',
  ASSIGNMENT: 'Assignment',
  LAB: 'Lab',
  VIVA: 'Viva',
  PROJECT: 'Project',
  ATTENDANCE: 'Attendance',
  OTHER: 'Other',
};

const COMPONENT_TYPE_COLORS = Object.fromEntries(
  Object.keys(COMPONENT_TYPE_LABELS).map(type => [type, 'assessment-type-chip'])
) as Record<MarkComponent['component_type'], string>;

const GRADE_COLORS = {
  AA: 'grade-tone grade-tone-success',
  AB: 'grade-tone grade-tone-success',
  BB: 'grade-tone grade-tone-accent',
  BC: 'grade-tone grade-tone-accent',
  CC: 'grade-tone grade-tone-warning',
  CD: 'grade-tone grade-tone-warning',
  DD: 'grade-tone grade-tone-danger',
  F: 'grade-tone grade-tone-muted',
};

const readableDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export default function MarksPage() {
  const formId = useId();
  const reducedMotion = useReducedMotion();
  const { 
    components, 
    gradeConfigs, 
    scenarios,
    addComponent, 
    updateComponent, 
    deleteComponent,
    upsertGradeConfig,
    addScenario,
    updateScenario,
    deleteScenario,
    getSubjectSummary,
    getOverallSummary,
    isLoaded 
  } = useMarks();

  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]?.code || '');
  const [mode, setMode] = useState<'scorecard' | 'spi' | 'cgpa'>('scorecard');
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [editingComponent, setEditingComponent] = useState<MarkComponent | null>(null);
  const [showGradeConfig, setShowGradeConfig] = useState(false);
  const [showScenario, setShowScenario] = useState(false);
  const [editingScenario, setEditingScenario] = useState<GradeScenario | null>(null);
  const [scenarioAssumptions, setScenarioAssumptions] = useState<Record<string, number>>({});

  const subjectComponents = components.filter(c => c.subject_code === selectedSubject && !c.deleted_at);
  const subjectConfig = gradeConfigs.find(c => c.subject_code === selectedSubject && !c.deleted_at);
  const subjectScenarios = scenarios.filter(scenario => scenario.subject_code === selectedSubject && !scenario.deleted_at);
  const summary = getSubjectSummary(selectedSubject);
  const overall = getOverallSummary();

  const [formData, setFormData] = useState({
    component_type: 'QUIZ' as MarkComponent['component_type'],
    component_name: '',
    weightage: 10,
    scored: '',
    max_marks: 100,
    date: '',
    is_published: false,
    notes: '',
  });

  const [gradeConfigData, setGradeConfigData] = useState({
    grade_aa_min: 80,
    grade_ab_min: 70,
    grade_bb_min: 60,
    grade_bc_min: 50,
    grade_cc_min: 40,
    grade_cd_min: 35,
    grade_dd_min: 30,
    credits: 4,
  });

  const [scenarioName, setScenarioName] = useState('');

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleGradeConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGradeConfigData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleScenarioAssumptionChange = (componentId: string, value: number) => {
    setScenarioAssumptions(prev => ({ ...prev, [componentId]: value }));
  };

  const submitComponent = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      subject_code: selectedSubject,
      component_type: formData.component_type,
      component_name: formData.component_name,
      weightage: formData.weightage,
      scored: formData.is_published && formData.scored !== '' ? parseFloat(formData.scored) : null,
      max_marks: formData.max_marks,
      date: formData.date || null,
      is_published: formData.is_published,
      notes: formData.notes || null,
    };

    if (editingComponent) {
      updateComponent(editingComponent.id, payload);
    } else {
      addComponent(payload);
    }
    setShowAddComponent(false);
    setEditingComponent(null);
    resetForm();
  };

  const submitGradeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    upsertGradeConfig({
      user_id: subjectConfig?.user_id || '',
      subject_code: selectedSubject,
      ...gradeConfigData,
    });
    setShowGradeConfig(false);
  };

  const submitScenario = (e: React.FormEvent) => {
    e.preventDefault();
    const pendingComponents = subjectComponents.filter(c => !c.is_published || c.scored === null);
    const assumptions: Record<string, number> = {};
    pendingComponents.forEach(c => {
      if (scenarioAssumptions[c.id] !== undefined) {
        assumptions[c.id] = scenarioAssumptions[c.id];
      }
    });

    const { projected_percentage: projected_final_percentage, projected_grade } = simulateGradeScenario(
      subjectComponents,
      assumptions,
      subjectConfig || null
    );

    if (editingScenario) {
      updateScenario(editingScenario.id, { name: scenarioName, assumptions, projected_final_percentage, projected_grade });
    } else {
      addScenario({
        user_id: '',
        subject_code: selectedSubject,
        name: scenarioName,
        assumptions,
        projected_final_percentage,
        projected_grade,
      });
    }
    setShowScenario(false);
    setEditingScenario(null);
    setScenarioName('');
    setScenarioAssumptions({});
  };

  const resetForm = () => {
    setFormData({
      component_type: 'QUIZ',
      component_name: '',
      weightage: 10,
      scored: '',
      max_marks: 100,
      date: '',
      is_published: false,
      notes: '',
    });
  };

  const editComponent = (component: MarkComponent) => {
    setEditingComponent(component);
    setFormData({
      component_type: component.component_type,
      component_name: component.component_name,
      weightage: component.weightage,
      scored: component.scored?.toString() || '',
      max_marks: component.max_marks,
      date: component.date || '',
      is_published: component.is_published,
      notes: component.notes || '',
    });
    setShowAddComponent(true);
  };

  const editScenario = (scenario: GradeScenario) => {
    setEditingScenario(scenario);
    setScenarioName(scenario.name);
    setScenarioAssumptions(scenario.assumptions);
    setShowScenario(true);
  };

  const confirmDeleteComponent = (component: MarkComponent) => {
    if (confirm(`Delete "${component.component_name}"?`)) {
      deleteComponent(component.id);
    }
  };

  const confirmDeleteScenario = (scenario: GradeScenario) => {
    if (confirm(`Delete scenario "${scenario.name}"?`)) {
      deleteScenario(scenario.id);
    }
  };

  const totalWeightage = subjectComponents.reduce((sum, c) => sum + c.weightage, 0);
  const publishedComponents = subjectComponents.filter(c => c.is_published && c.scored !== null);
  const pendingComponents = subjectComponents.filter(c => !c.is_published || c.scored === null);

  if (!isLoaded) {
    return (
      <div className="planning-page space-y-6" role="status" aria-label="Loading marks and grades">
        <div className="paper-elevated rounded-[24px] p-8 text-center animate-pulse">
          <div className="planning-empty-icon mx-auto">
            <CalculatorIcon className="w-6 h-6 planning-accent" />
          </div>
          <h2 className="text-lg font-medium text-white">Loading your scorecard…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="marks-page planning-page space-y-6 animate-fade-in">
      {/* Header */}
      <div className="marks-page-heading flex flex-wrap items-center justify-between gap-4">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <p className="planning-eyebrow">Your semester, in numbers</p>
          <h1>Marks & grades</h1>
          <p className="page-subtitle">Track your results. See what’s within reach.</p>
        </div>
        {mode === 'scorecard' && <div className="marks-settings-actions flex items-center gap-2">
          <button
            onClick={() => {
              if (subjectConfig) {
                setGradeConfigData({
                  grade_aa_min: subjectConfig.grade_aa_min,
                  grade_ab_min: subjectConfig.grade_ab_min,
                  grade_bb_min: subjectConfig.grade_bb_min,
                  grade_bc_min: subjectConfig.grade_bc_min,
                  grade_cc_min: subjectConfig.grade_cc_min,
                  grade_cd_min: subjectConfig.grade_cd_min,
                  grade_dd_min: subjectConfig.grade_dd_min,
                  credits: subjectConfig.credits,
                });
              } else {
                setGradeConfigData({ grade_aa_min: 80, grade_ab_min: 70, grade_bb_min: 60, grade_bc_min: 50, grade_cc_min: 40, grade_cd_min: 35, grade_dd_min: 30, credits: 4 });
              }
              setShowGradeConfig(true);
            }}
            type="button"
            aria-label="Grade settings"
            title="Grade settings"
            className="glass-control planning-secondary-action px-4 py-2 text-sm font-medium flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" aria-hidden="true" /><span className="marks-settings-label">Grade settings</span>
          </button>
        </div>}
      </div>

      <div className="planner-view-switch" role="group" aria-label="Marks mode">
        {(['scorecard', 'spi', 'cgpa'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} className={`planner-view-option ${mode === value ? 'is-active' : ''}`} onClick={() => setMode(value)}>
          {mode === value && <motion.span layoutId="marks-mode" className="planner-view-highlight" transition={{ duration: reducedMotion ? 0 : .2 }} />}
          {value === 'scorecard' ? 'Scorecard' : `${value.toUpperCase()} calculator`}
        </button>)}
      </div>
      {mode !== 'scorecard' && <AcademicCalculator mode={mode} savedCredits={Object.fromEntries(gradeConfigs.filter(config => !config.deleted_at).map(config => [config.subject_code, config.credits]))} />}
      {mode === 'scorecard' && <>
      {/* Subject Selector */}
      <div className="planning-subject-block">
        <p id={`${formId}-subject-selector`} className="planning-section-kicker">Subject</p>
        <div role="group" aria-labelledby={`${formId}-subject-selector`} className="planning-subject-rail">
          {SUBJECTS.map(subj => {
            const subjSummary = getSubjectSummary(subj.code);
            const isActive = selectedSubject === subj.code;
            return (
              <button
                key={subj.code}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedSubject(subj.code)}
                className={`planning-subject ${isActive ? 'is-active' : ''}`}
              >
                <span className="planning-subject-name">{subj.shortName}</span>
                <span className="planning-subject-code">{subj.code}</span>
                {subjSummary?.current_grade && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${GRADE_COLORS[subjSummary.current_grade]}`}>
                    {subjSummary.current_grade}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overall SGPA Card */}
      {overall.sgpa !== null && (
        <motion.div 
          className="marks-overall paper-elevated rounded-[24px] p-6 relative overflow-hidden"
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">Current SGPA</p>
              <p className="marks-sgpa-value">{overall.sgpa.toFixed(2)}<span>/ 10</span></p>
              <p className="text-sm text-white/50 mt-1">{overall.earned_credits}/{overall.total_credits} credits earned</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">Subjects</p>
              <p className="text-2xl font-bold text-white tabular-nums">{overall.subjects.filter(s => s.current_grade).length}<span className="text-sm text-white/50"> / {SUBJECTS.length}</span></p>
            </div>
          </div>
        </motion.div>
      )}

      {!summary && (
        <div className="planning-empty empty-state">
          <span className="planning-empty-icon"><CalculatorIcon aria-hidden="true" /></span>
          <h2 className="text-lg text-white">Start your scorecard</h2>
          <p>Add a quiz, assignment or exam for {SUBJECTS.find(s => s.code === selectedSubject)?.shortName}.</p>
          <LiquidButton type="button" onClick={() => { resetForm(); setShowAddComponent(true); }} className="mt-5">Add first assessment</LiquidButton>
        </div>
      )}

      {/* Subject Summary Cards */}
      {summary && (
        <>
          {/* Current Status */}
          <motion.div 
            className="marks-summary paper-elevated rounded-[24px] p-6 relative overflow-hidden"
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.1 }}
          >
            <div className="relative z-10">
              <div className="marks-summary-heading">
                <div>
                  <p className="planning-section-kicker">{summary.subject_code}</p>
                  <h2 className="text-lg font-semibold text-white">{summary.subject_name}</h2>
                  <p className="text-sm text-white/50 mt-1">{summary.total_weightage.toFixed(1)}% of assessments added</p>
                </div>
                {summary.current_grade && (
                  <div className="marks-current-grade">
                    <p className="planning-section-kicker">Current grade</p>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${GRADE_COLORS[summary.current_grade]}`}>
                      <span className="text-2xl font-bold">{summary.current_grade}</span>
                      <span className="text-sm font-medium">({summary.current_percentage?.toFixed(1)}%)</span>
                    </span>
                    <p className="text-xs text-white/40 mt-2">{getGradePoints(summary.current_grade)} points · {summary.credits} credits</p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/60">Weighted marks earned</span>
                  <span className="text-white font-medium tabular-nums">
                    {summary.earned_weightage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="marks-progress-fill h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalWeightage > 0 ? (summary.earned_weightage / summary.total_weightage) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-white/40 mt-1">
                  <span>{publishedComponents.length} of {subjectComponents.length} results recorded</span>
                  <span>{summary.pending_weightage.toFixed(1)}% pending</span>
                </div>
              </div>

              {/* Projection Cards */}
              <div className="marks-projections">
                <div className="marks-projection">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Best Case</p>
                  <p className="marks-projection-value">{summary.best_case_percentage.toFixed(1)}<span>%</span></p>
                  <p className="text-[11px] text-white/50 mt-1">{getGradeFromPercentage(summary.best_case_percentage)}</p>
                </div>
                <div className="marks-projection is-primary">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Projected</p>
                  <p className="marks-projection-value">{summary.projected_percentage?.toFixed(1) ?? '—'}{summary.projected_percentage != null && <span>%</span>}</p>
                  <p className="text-[11px] text-white/50 mt-1">{summary.projected_grade ?? '--'}</p>
                </div>
                <div className="marks-projection">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Worst Case</p>
                  <p className="marks-projection-value">{summary.worst_case_percentage.toFixed(1)}<span>%</span></p>
                  <p className="text-[11px] text-white/50 mt-1">{getGradeFromPercentage(summary.worst_case_percentage)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* What-If Simulator */}
          <motion.div 
            className="marks-simulator paper-elevated rounded-[24px] p-6 relative overflow-hidden"
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.2 }}
          >
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="planning-card-title flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 planning-accent" />
                    What if?
                  </h2>
                  <p className="planning-card-caption">Explore the scores you’re aiming for.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setEditingScenario(null); setScenarioName(''); setScenarioAssumptions(Object.fromEntries(pendingComponents.map(component => [component.id, 50]))); setShowScenario(true); }}
                  className="glass-control planning-secondary-action px-3 py-2 text-sm font-medium flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" /> New scenario
                </button>
              </div>

              {/* Scenario Results */}
              {subjectScenarios.length > 0 && (
                <div className="space-y-3 mb-4">
                  {subjectScenarios.map(scenario => (
                    <motion.div
                      key={scenario.id}
                      className="paper-surface rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap group"
                      initial={reducedMotion ? false : { opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${GRADE_COLORS[scenario.projected_grade || 'F']}`}>
                          <span className="text-lg font-bold">{scenario.projected_grade || 'F'}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white [overflow-wrap:anywhere]">{scenario.name}</p>
                          <p className="text-sm text-white/50">{scenario.projected_final_percentage?.toFixed(1) ?? '--'}% projected</p>
                        </div>
                      </div>
                      <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
                        <button
                          type="button"
                          aria-label={`Edit scenario ${scenario.name}`}
                          onClick={() => editScenario(scenario)}
                          className="ink-btn-ghost min-w-11 min-h-11 grid place-items-center p-2 hover:bg-white/10"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete scenario ${scenario.name}`}
                          onClick={() => confirmDeleteScenario(scenario)}
                          className="ink-btn-ghost min-w-11 min-h-11 grid place-items-center p-2 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Target Grade Calculator */}
              {pendingComponents.length > 0 && summary.current_percentage !== null && (
                <details className="marks-targets border-t border-white/10 pt-3">
                  <summary><span>Target grade requirements</span><span aria-hidden="true">+</span></summary>
                  <div className="space-y-2">
                    {(['AA', 'AB', 'BB', 'BC', 'CC', 'CD', 'DD'] as GradeLetter[]).map(grade => {
                      const requirements = calculateTargetRequirements(subjectComponents, grade, subjectConfig || null);
                      if (requirements.length === 0) return null;
                      const avgRequired = requirements.reduce((sum, r) => sum + r.required_percentage, 0) / requirements.length;
                      return (
                        <div key={grade} className="marks-target-row paper-recessed rounded-xl p-3">
                          <span className={`font-medium px-3 py-1 rounded-full text-sm ${GRADE_COLORS[grade]}`}>
                            Target {grade}
                          </span>
                          <div className="marks-target-requirement">
                            <span className="text-white/60">Need <strong className="text-white tabular-nums">{avgRequired.toFixed(0)}%</strong> on average</span>
                            <span className="text-white/40">across {requirements.length} assessment{requirements.length === 1 ? '' : 's'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          </motion.div>

          {/* Components List */}
          <motion.div 
            className="marks-assessments paper-elevated rounded-[24px] p-6 relative overflow-hidden"
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.3 }}
          >
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="planning-card-title flex items-center gap-2">
                  <CalculatorIcon className="w-5 h-5 planning-accent" />
                  Assessments
                </h2>
                <LiquidButton
                  onClick={() => { resetForm(); setEditingComponent(null); setShowAddComponent(true); }}
                  className="assessment-add-action"
                >
                  <PlusIcon className="w-4 h-4" /> Add assessment
                </LiquidButton>
              </div>

              {subjectComponents.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <CalculatorIcon className="w-12 h-12 mx-auto mb-4 text-white/20" />
                  <p className="font-medium">No components added yet</p>
                  <p className="text-sm mt-1">Add your first quiz, assignment, or exam</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjectComponents.map((component, index) => (
                    <motion.div
                      key={component.id}
                      className="assessment-row paper-surface rounded-xl p-4 flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4 group"
                      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex-1 min-w-0 basis-full sm:basis-auto">
                        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                          <h3 className="min-w-0 font-medium text-white [overflow-wrap:anywhere] sm:truncate">{component.component_name}</h3>
                          <span className={`shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold ${COMPONENT_TYPE_COLORS[component.component_type]}`}>
                            {COMPONENT_TYPE_LABELS[component.component_type]}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs sm:text-sm text-white/50">
                          <span>Weight: <span className="text-white font-medium">{component.weightage}%</span></span>
                          {component.is_published && component.scored !== null ? (
                            <>
                              <span>Scored: <span className="text-white font-medium">{component.scored}/{component.max_marks}</span></span>
                              <span className={`font-bold ${(component.scored / component.max_marks) >= 0.75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {((component.scored / component.max_marks) * 100).toFixed(1)}%
                              </span>
                            </>
                          ) : (
                            <span className="text-amber-400">Not published</span>
                          )}
                          {component.date && (
                            <span><time dateTime={component.date}>{readableDate(component.date)}</time></span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
                        <button
                          type="button"
                          aria-label={`Edit ${component.component_name}`}
                          onClick={() => editComponent(component)}
                          className="ink-btn-ghost min-w-11 min-h-11 grid place-items-center p-2 hover:bg-white/10"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${component.component_name}`}
                          onClick={() => confirmDeleteComponent(component)}
                          className="ink-btn-ghost min-w-11 min-h-11 grid place-items-center p-2 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Total Weightage Warning */}
              {totalWeightage !== 100 && (
                <motion.div 
                  className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-300">Total weightage is {totalWeightage}%</p>
                    <p className="text-sm text-amber-400/80">Should equal 100% for accurate grade calculation</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}

      </>}
      {/* Add/Edit Component Modal */}
      {(showAddComponent || editingComponent) && (
        <Dialog label={editingComponent ? 'Edit assessment' : 'Add assessment'} onClose={() => { setShowAddComponent(false); setEditingComponent(null); resetForm(); }}>
          <div className="planning-form relative w-full max-w-md bg-[#111320] sm:rounded-[28px] rounded-t-[28px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] border-t border-white/15 slide-up">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="text-lg font-bold text-white">{editingComponent ? 'Edit assessment' : 'Add assessment'}</h3>
              <button type="button" aria-label="Close component form" onClick={() => { setShowAddComponent(false); setEditingComponent(null); resetForm(); }} className="ink-btn-ghost flex items-center justify-center shrink-0 w-11 h-11">
                <XMarkIcon aria-hidden="true" className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitComponent} className="space-y-4 max-h-[60dvh] overflow-y-auto">
              <div>
                <label htmlFor={`${formId}-component-type`} className="text-sm font-medium text-white/70 block mb-2">Assessment type</label>
                <select
                  id={`${formId}-component-type`}
                  name="component_type"
                  value={formData.component_type}
                  onChange={handleFormChange}
                  className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-white/30"
                >
                  {Object.entries(COMPONENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor={`${formId}-component-name`} className="text-sm font-medium text-white/70 block mb-2">Assessment name</label>
                <input
                  id={`${formId}-component-name`}
                  name="component_name"
                  type="text"
                  value={formData.component_name}
                  onChange={handleFormChange}
                  placeholder="e.g., Quiz 1, Midsem, Lab 3"
                  className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-white/30"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${formId}-weightage`} className="text-sm font-medium text-white/70 block mb-2">Weightage (%)</label>
                  <input
                    id={`${formId}-weightage`}
                    name="weightage"
                    type="number"
                    value={formData.weightage}
                    onChange={handleFormChange}
                    min="0.1"
                    max="100"
                    step="0.1"
                    className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-white/30"
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`${formId}-max-marks`} className="text-sm font-medium text-white/70 block mb-2">Max Marks</label>
                  <input
                    id={`${formId}-max-marks`}
                    name="max_marks"
                    type="number"
                    value={formData.max_marks}
                    onChange={handleFormChange}
                    min="1"
                    className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-white/30"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor={`${formId}-scored`} className="text-sm font-medium text-white/70 block mb-2">Marks Scored</label>
                <input
                  id={`${formId}-scored`}
                  name="scored"
                  type="number"
                  value={formData.scored}
                  onChange={handleFormChange}
                  min="0"
                  max={formData.max_marks}
                  step="0.1"
                  placeholder="Leave empty if not published"
                  className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-white/30"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${formId}-date`} className="text-sm font-medium text-white/70 block mb-2">Date</label>
                  <input
                    id={`${formId}-date`}
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    className="w-full glass-input rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <label htmlFor={`${formId}-published`} className="flex items-center gap-2 cursor-pointer min-h-11">
                    <input
                      id={`${formId}-published`}
                      name="is_published"
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                      className="w-4 h-4 rounded border-white/30 text-emerald-500 focus:ring-emerald-500 bg-[#040406]"
                    />
                    <span className="text-sm text-white/70">Published</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label htmlFor={`${formId}-notes`} className="text-sm font-medium text-white/70 block mb-2">Notes</label>
                <textarea
                  id={`${formId}-notes`}
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Optional notes..."
                  className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-white/30"
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowAddComponent(false); setEditingComponent(null); resetForm(); }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                >
                  {editingComponent ? 'Save changes' : 'Add assessment'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* Grade Config Modal */}
      {showGradeConfig && (
        <Dialog label={'Grade configuration'} onClose={() => { setShowGradeConfig(false); }}>
          <div className="planning-form relative w-full max-w-md bg-[#111320] sm:rounded-[28px] rounded-t-[28px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] border-t border-white/15 slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="text-lg font-bold text-white">Grade Boundaries for {selectedSubject}</h3>
              <button type="button" aria-label="Close grade configuration" onClick={() => setShowGradeConfig(false)} className="ink-btn-ghost flex items-center justify-center shrink-0 w-11 h-11">
                <XMarkIcon aria-hidden="true" className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/50 mb-6">IIT BHU grading schema. Adjust if your department uses different boundaries.</p>
            <form onSubmit={submitGradeConfig} className="space-y-3 max-h-[60dvh] overflow-y-auto">
              {[
                { key: 'grade_aa_min', label: 'AA (10 pts)', default: 80 },
                { key: 'grade_ab_min', label: 'AB (9 pts)', default: 70 },
                { key: 'grade_bb_min', label: 'BB (8 pts)', default: 60 },
                { key: 'grade_bc_min', label: 'BC (7 pts)', default: 50 },
                { key: 'grade_cc_min', label: 'CC (6 pts)', default: 40 },
                { key: 'grade_cd_min', label: 'CD (5 pts)', default: 35 },
                { key: 'grade_dd_min', label: 'DD (4 pts)', default: 30 },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label htmlFor={`${formId}-${key}`} className="text-sm font-medium text-white/70 block mb-2">{label} minimum %</label>
                  <input
                    id={`${formId}-${key}`}
                    name={key}
                    type="number"
                    value={gradeConfigData[key as keyof typeof gradeConfigData]}
                    onChange={handleGradeConfigChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full glass-input rounded-xl px-4 py-3 text-white"
                  />
                </div>
              ))}
              <div>
                <label htmlFor={`${formId}-credits`} className="text-sm font-medium text-white/70 block mb-2">Credits</label>
                <input
                  id={`${formId}-credits`}
                  name="credits"
                  type="number"
                  value={gradeConfigData.credits}
                  onChange={handleGradeConfigChange}
                  min="1"
                  max="10"
                  className="w-full glass-input rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowGradeConfig(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                >
                  Save Grade Config
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* Scenario Modal */}
      {showScenario && (
        <Dialog label={editingScenario ? 'Edit scenario' : 'New scenario'} onClose={() => { setShowScenario(false); setEditingScenario(null); setScenarioName(''); setScenarioAssumptions({}); }}>
          <div className="planning-form relative w-full max-w-md bg-[#111320] sm:rounded-[28px] rounded-t-[28px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] border-t border-white/15 slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-white">{editingScenario ? 'Edit Scenario' : 'New What-If Scenario'}</h3>
              <button type="button" aria-label="Close scenario form" onClick={() => { setShowScenario(false); setEditingScenario(null); setScenarioName(''); setScenarioAssumptions({}); }} className="ink-btn-ghost flex items-center justify-center shrink-0 w-11 h-11">
                <XMarkIcon aria-hidden="true" className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitScenario} className="space-y-4 max-h-[60dvh] overflow-y-auto">
              <div>
                <label htmlFor={`${formId}-scenario-name`} className="text-sm font-medium text-white/70 block mb-2">Scenario Name</label>
                <input
                  id={`${formId}-scenario-name`}
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g., Target AA, Conservative, Need to pass"
                  className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-white/30"
                  required
                />
              </div>
              
              {pendingComponents.length === 0 ? (
                <p className="text-white/50 text-center py-4">All components are published. No assumptions needed.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-white/50">Assume scores for pending components (0-100%):</p>
                  {pendingComponents.map(comp => (
                    <div key={comp.id} className="glass-surface rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor={`${formId}-assumption-${comp.id}`} className="font-medium text-white">{comp.component_name}<span className="sr-only"> assumed score (%)</span></label>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COMPONENT_TYPE_COLORS[comp.component_type]}`}>
                          {COMPONENT_TYPE_LABELS[comp.component_type]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          id={`${formId}-assumption-${comp.id}`}
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={scenarioAssumptions[comp.id] ?? 0}
                          onChange={(e) => handleScenarioAssumptionChange(comp.id, parseInt(e.target.value))}
                          className="flex-1 h-2 bg-white/10 rounded-lg appearance-none accent-emerald-500"
                        />
                        <span className="w-12 text-right font-mono text-white">
                          {scenarioAssumptions[comp.id] ?? 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Live Preview */}
              {pendingComponents.length > 0 && (
                <div className="glass-surface rounded-xl p-4 border border-purple-500/20">
                  <p className="text-sm font-bold text-purple-400 mb-2">Live Preview</p>
                  {(() => {
                    const { projected_percentage: projected_final_percentage, projected_grade } = simulateGradeScenario(
                      subjectComponents,
                      scenarioAssumptions,
                      subjectConfig || null
                    );
                    return (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/60">Projected Final</p>
                          <p className="text-2xl font-bold text-white">{projected_final_percentage.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-lg font-bold ${GRADE_COLORS[projected_grade]}`}>
                            {projected_grade}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowScenario(false); setEditingScenario(null); setScenarioName(''); setScenarioAssumptions({}); }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                >
                  {editingScenario ? 'Save Changes' : 'Create Scenario'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

    </div>
  );
}

function getGradeFromPercentage(percentage: number): GradeLetter {
  for (const boundary of DEFAULT_GRADE_BOUNDARIES) {
    if (percentage >= boundary.min_percentage) {
      return boundary.grade;
    }
  }
  return 'F';
}
