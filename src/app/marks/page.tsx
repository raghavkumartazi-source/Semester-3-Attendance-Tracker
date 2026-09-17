'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SUBJECTS } from '@/lib/config';
import { useMarks } from '@/components/MarksProvider';
import { 
  calculateSubjectMarksSummary, 
  calculateTargetRequirements,
  DEFAULT_GRADE_BOUNDARIES,
  simulateGradeScenario,
  getGradePoints
} from '@/lib/calculations';
import { MarkComponent, SubjectGradeConfig, GradeScenario, GradeLetter } from '@/lib/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CalculatorIcon,
  ArrowPathIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const COMPONENT_TYPE_LABELS: Record<string, string> = {
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

const COMPONENT_TYPE_COLORS: Record<string, string> = {
  MIDSEM: 'bg-red-500/10 text-red-400 border-red-500/20',
  ENDSEM: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  QUIZ: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ASSIGNMENT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LAB: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  VIVA: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  PROJECT: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  ATTENDANCE: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  OTHER: 'bg-white/10 text-white/70 border-white/20',
};

const GRADE_COLORS: Record<GradeLetter, string> = {
  AA: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  AB: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  BB: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  BC: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  CC: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  CD: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DD: 'bg-red-500/20 text-red-400 border-red-500/30',
  F: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

export default function MarksPage() {
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
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [editingComponent, setEditingComponent] = useState<MarkComponent | null>(null);
  const [showGradeConfig, setShowGradeConfig] = useState(false);
  const [showScenario, setShowScenario] = useState(false);
  const [editingScenario, setEditingScenario] = useState<GradeScenario | null>(null);
  const [scenarioAssumptions, setScenarioAssumptions] = useState<Record<string, number>>({});

  const subjectComponents = components.filter(c => c.subject_code === selectedSubject);
  const subjectConfig = gradeConfigs.find(c => c.subject_code === selectedSubject);
  const summary = getSubjectSummary(selectedSubject);
  const overall = getOverallSummary();

  // Form state for adding/editing component
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

  // Form state for grade config
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

  // Form state for scenario
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
      user_id: '', // Will be filled by provider
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
      <div className="max-w-lg mx-auto pb-24 space-y-6">
        <div className="glass-elevated rounded-[24px] p-8 text-center animate-pulse">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CalculatorIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Loading Semester Scorecard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight gradient-text">Semester Scorecard</h1>
          <p className="text-sm text-white/50 mt-1">Marks & Grade Tracker</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGradeConfig(true)}
            className="glass-button px-4 py-2 text-sm font-medium flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" /> Grade Config
          </button>
        </div>
      </div>

      {/* Subject Selector */}
      <div className="glass-surface rounded-[20px] p-4">
        <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-3">Select Subject</label>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map(subj => {
            const subjSummary = getSubjectSummary(subj.code);
            const isActive = selectedSubject === subj.code;
            return (
              <button
                key={subj.code}
                onClick={() => setSelectedSubject(subj.code)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="font-medium">{subj.code}</span>
                <span className="text-[11px] text-white/40">{subj.shortName}</span>
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
          className="glass-elevated rounded-[24px] p-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">Current SGPA</p>
              <p className="text-4xl font-bold text-white tracking-tight">{overall.sgpa.toFixed(2)}</p>
              <p className="text-sm text-white/50 mt-1">{overall.earned_credits}/{overall.total_credits} credits earned</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">Subjects</p>
              <p className="text-2xl font-bold text-emerald-400">{overall.subjects.filter(s => s.current_grade).length}/{SUBJECTS.length}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subject Summary Cards */}
      {summary && (
        <>
          {/* Current Status */}
          <motion.div 
            className="glass-elevated rounded-[24px] p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">{summary.subject_code} — {summary.subject_name}</h2>
                  <p className="text-sm text-white/50 mt-1">Weightage: {summary.total_weightage.toFixed(1)}% total</p>
                </div>
                {summary.current_grade && (
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">Current Grade</p>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${GRADE_COLORS[summary.current_grade]}`}>
                      <span className="text-2xl font-bold">{summary.current_grade}</span>
                      <span className="text-sm font-medium">({summary.current_percentage?.toFixed(1)}%)</span>
                    </span>
                    <p className="text-xs text-white/40 mt-1">{getGradePoints(summary.current_grade)} grade points × {summary.credits} credits</p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/60">Progress</span>
                  <span className="text-white font-medium">
                    {publishedComponents.length}/{subjectComponents.length} components published
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${totalWeightage > 0 ? (summary.earned_weightage / summary.total_weightage) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-white/40 mt-1">
                  <span>Earned: {summary.earned_weightage.toFixed(1)}%</span>
                  <span>Pending: {summary.pending_weightage.toFixed(1)}%</span>
                </div>
              </div>

              {/* Projection Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-surface rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Best Case</p>
                  <p className="text-2xl font-bold text-emerald-400">{summary.best_case_percentage.toFixed(1)}%</p>
                  <p className="text-[11px] text-white/50 mt-1">{getGradeFromPercentage(summary.best_case_percentage)}</p>
                </div>
                <div className="glass-surface rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Projected</p>
                  <p className="text-2xl font-bold text-blue-400">{summary.projected_percentage?.toFixed(1) ?? '--'}%</p>
                  <p className="text-[11px] text-white/50 mt-1">{summary.projected_grade ?? '--'}</p>
                </div>
                <div className="glass-surface rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Worst Case</p>
                  <p className="text-2xl font-bold text-red-400">{summary.worst_case_percentage.toFixed(1)}%</p>
                  <p className="text-[11px] text-white/50 mt-1">{getGradeFromPercentage(summary.worst_case_percentage)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* What-If Simulator */}
          <motion.div 
            className="glass-elevated rounded-[24px] p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-purple-400" />
                  What-If Simulator
                </h2>
                <button
                  onClick={() => { setEditingScenario(null); setScenarioName(''); setScenarioAssumptions({}); setShowScenario(true); }}
                  className="glass-button px-4 py-2 text-sm font-medium flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" /> New Scenario
                </button>
              </div>

              {/* Scenario Results */}
              {scenarios.filter(s => s.subject_code === selectedSubject).length > 0 && (
                <div className="space-y-3 mb-4">
                  {scenarios.filter(s => s.subject_code === selectedSubject).map(scenario => (
                    <motion.div
                      key={scenario.id}
                      className="glass-surface rounded-xl p-4 flex items-center justify-between group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${GRADE_COLORS[scenario.projected_grade || 'F']}`}>
                          <span className="text-lg font-bold">{scenario.projected_grade || 'F'}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{scenario.name}</p>
                          <p className="text-sm text-white/50">{scenario.projected_final_percentage?.toFixed(1) ?? '--'}% projected</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editScenario(scenario)}
                          className="glass-button p-2 hover:bg-white/10"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDeleteScenario(scenario)}
                          className="glass-button p-2 hover:bg-red-500/10 hover:text-red-400"
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
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Target Grade Requirements</h3>
                  <div className="space-y-2">
                    {(['AA', 'AB', 'BB', 'BC', 'CC', 'CD', 'DD'] as GradeLetter[]).map(grade => {
                      const requirements = calculateTargetRequirements(subjectComponents, grade, subjectConfig || null);
                      if (requirements.length === 0) return null;
                      const avgRequired = requirements.reduce((sum, r) => sum + r.required_percentage, 0) / requirements.length;
                      return (
                        <div key={grade} className="flex items-center justify-between glass-surface rounded-xl p-3">
                          <span className={`font-medium px-3 py-1 rounded-full text-sm ${GRADE_COLORS[grade]}`}>
                            Target {grade}
                          </span>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-white/60">Avg needed: <span className="text-white font-bold">{avgRequired.toFixed(0)}%</span></span>
                            <span className="text-white/40">({requirements.length} components)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Components List */}
          <motion.div 
            className="glass-elevated rounded-[24px] p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.3 }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalculatorIcon className="w-5 h-5 text-blue-400" />
                  Assessment Components
                </h2>
                <button
                  onClick={() => { resetForm(); setEditingComponent(null); setShowAddComponent(true); }}
                  className="glass-button px-4 py-2 text-sm font-medium flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" /> Add Component
                </button>
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
                      className="glass-surface rounded-xl p-4 flex items-center gap-4 group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${COMPONENT_TYPE_COLORS[component.component_type]}`}>
                        <span className="text-sm font-bold">{component.component_type.charAt(0)}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-white truncate pr-2">{component.component_name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COMPONENT_TYPE_COLORS[component.component_type]}`}>
                            {COMPONENT_TYPE_LABELS[component.component_type]}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
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
                            <span>Date: <span className="text-white">{component.date}</span></span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editComponent(component)}
                          className="glass-button p-2 hover:bg-white/10"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDeleteComponent(component)}
                          className="glass-button p-2 hover:bg-red-500/10 hover:text-red-400"
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
                  initial={{ opacity: 0, scale: 0.95 }}
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

      {/* Add/Edit Component Modal */}
      {(showAddComponent || editingComponent) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAddComponent(false); setEditingComponent(null); resetForm(); }} />
          <div className="relative w-full max-w-md bg-[rgba(14,16,23,0.45)] backdrop-blur-2xl backdrop-saturate-150 sm:rounded-[28px] rounded-t-[28px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] border-t border-white/15 slide-up">
            <h3 className="text-lg font-bold text-white mb-6">{editingComponent ? 'Edit Component' : 'Add Component'}</h3>
            <form onSubmit={submitComponent} className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">Component Type</label>
                <select
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
                <label className="text-sm font-medium text-white/70 block mb-2">Component Name</label>
                <input
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
                  <label className="text-sm font-medium text-white/70 block mb-2">Weightage (%)</label>
                  <input
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
                  <label className="text-sm font-medium text-white/70 block mb-2">Max Marks</label>
                  <input
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
                <label className="text-sm font-medium text-white/70 block mb-2">Marks Scored</label>
                <input
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
                  <label className="text-sm font-medium text-white/70 block mb-2">Date</label>
                  <input
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    className="w-full glass-input rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
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
                <label className="text-sm font-medium text-white/70 block mb-2">Notes</label>
                <textarea
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
                  {editingComponent ? 'Save Changes' : 'Add Component'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Config Modal */}
      {showGradeConfig && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGradeConfig(false)} />
          <div className="relative w-full max-w-md bg-[rgba(14,16,23,0.45)] backdrop-blur-2xl backdrop-saturate-150 sm:rounded-[28px] rounded-t-[28px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] border-t border-white/15 slide-up max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-6">Grade Boundaries for {selectedSubject}</h3>
            <p className="text-sm text-white/50 mb-6">IIT BHU grading schema. Adjust if your department uses different boundaries.</p>
            <form onSubmit={submitGradeConfig} className="space-y-3 max-h-[60vh] overflow-y-auto">
              {[
                { key: 'grade_aa_min', label: 'AA (10 pts)', default: 80 },
                { key: 'grade_ab_min', label: 'AB (9 pts)', default: 70 },
                { key: 'grade_bb_min', label: 'BB (8 pts)', default: 60 },
                { key: 'grade_bc_min', label: 'BC (7 pts)', default: 50 },
                { key: 'grade_cc_min', label: 'CC (6 pts)', default: 40 },
                { key: 'grade_cd_min', label: 'CD (5 pts)', default: 35 },
                { key: 'grade_dd_min', label: 'DD (4 pts)', default: 30 },
              ].map(({ key, label, default: def }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-white/70 block mb-2">{label} minimum %</label>
                  <input
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
                <label className="text-sm font-medium text-white/70 block mb-2">Credits</label>
                <input
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
        </div>
      )}

      {/* Scenario Modal */}
      {showScenario && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowScenario(false); setEditingScenario(null); setScenarioName(''); setScenarioAssumptions({}); }} />
          <div className="relative w-full max-w-md bg-[rgba(14,16,23,0.45)] backdrop-blur-2xl backdrop-saturate-150 sm:rounded-[28px] rounded-t-[28px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] border-t border-white/15 slide-up max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">{editingScenario ? 'Edit Scenario' : 'New What-If Scenario'}</h3>
            <form onSubmit={submitScenario} className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">Scenario Name</label>
                <input
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
                        <span className="font-medium text-white">{comp.component_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COMPONENT_TYPE_COLORS[comp.component_type]}`}>
                          {COMPONENT_TYPE_LABELS[comp.component_type]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={scenarioAssumptions[comp.id] || 50}
                          onChange={(e) => handleScenarioAssumptionChange(comp.id, parseInt(e.target.value))}
                          className="flex-1 h-2 bg-white/10 rounded-lg appearance-none accent-emerald-500"
                        />
                        <span className="w-12 text-right font-mono text-white">
                          {scenarioAssumptions[comp.id] || 50}%
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
        </div>
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