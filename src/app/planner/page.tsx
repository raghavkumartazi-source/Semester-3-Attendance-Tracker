'use client';

import { LiquidButton } from '@/components/ui/LiquidButton';
export const dynamic = 'force-dynamic';
import { useId, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import '../planning-pages.css';
import { SUBJECTS } from '@/lib/config';
import { usePlanner } from '@/components/PlannerProvider';
import Dialog from '@/components/Dialog';
import StudyImages from '@/components/StudyImages';
import { 
  SyllabusTopic, 
  ExamSchedule, 
  CoverageStatus,
  ExamType
} from '@/lib/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon,
  CheckCircleIcon as CheckCircleIconOutline,
  ClockIcon,
  BookOpenIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const COVERAGE_STATUS_COLORS: Record<CoverageStatus, string> = {
  NOT_STARTED: 'coverage-tone coverage-not-started',
  IN_PROGRESS: 'coverage-tone coverage-in-progress',
  COVERED: 'coverage-tone coverage-covered',
  REVISING: 'coverage-tone coverage-revising',
  MASTERED: 'coverage-tone coverage-mastered',
};

const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COVERED: 'Covered',
  REVISING: 'Revising',
  MASTERED: 'Mastered',
};

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MIDSEM: 'Midsem', ENDSEM: 'Endsem', QUIZ: 'Quiz',
  LAB_EXAM: 'Lab exam', VIVA: 'Viva', ASSIGNMENT_DUE: 'Assignment',
};

const EXAM_TYPE_COLORS: Record<ExamType, string> = {
  MIDSEM: 'assessment-type-chip', ENDSEM: 'assessment-type-chip',
  QUIZ: 'assessment-type-chip', LAB_EXAM: 'assessment-type-chip',
  VIVA: 'assessment-type-chip', ASSIGNMENT_DUE: 'assessment-type-chip',
};

const readableDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const DEFAULT_PLAN_PREFERENCES = {
  target_exam_date: '',
  daily_study_hours: 2,
  buffer_days: 2,
  revision_cycles: 1,
  preferred_session_length_minutes: 45,
  break_between_sessions_minutes: 10,
  weak_topic_extra_time_multiplier: 1.5,
};

export default function PlannerPage() {
  const formId = useId();
  const reducedMotion = useReducedMotion();
  const { 
    topics, 
    coverage, 
    exams, 
    plannerConfigs,
    addTopic, 
    updateTopic, 
    deleteTopic,
    upsertCoverage,
    addExam,
    updateExam,
    deleteExam,
    upsertPlannerConfig,
    getReverseCountdownPlan,
    isLoaded 
  } = usePlanner();

  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]?.code || '');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SYLLABUS' | 'PLAN'>('DASHBOARD');
  const [showPlanSettings, setShowPlanSettings] = useState(false);
  const [planPreferences, setPlanPreferences] = useState(DEFAULT_PLAN_PREFERENCES);

  // Exam state
  const [showAddExam, setShowAddExam] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSchedule | null>(null);
  const [examFormData, setExamFormData] = useState({
    exam_type: 'MIDSEM' as ExamType,
    exam_name: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    max_marks: 100,
    weightage: 20
  });

  // Topic state
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<SyllabusTopic | null>(null);
  const [topicFormData, setTopicFormData] = useState({
    topic_code: '',
    topic_name: '',
    unit_number: '',
    estimated_hours: 2,
    difficulty: 3,
    weightage_estimate: 10,
    is_core: true
  });

  const subjectTopics = topics.filter(t => t.subject_code === selectedSubject && !t.deleted_at).sort((a, b) => a.order_in_subject - b.order_in_subject);
  const subjectExams = exams.filter(e => e.subject_code === selectedSubject && !e.deleted_at).sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  const subjectPlanConfig = plannerConfigs.find(config => config.subject_code === selectedSubject && !config.deleted_at);
  const upcomingEndsemExams = subjectExams.filter(exam => exam.exam_type === 'ENDSEM' && differenceInCalendarDays(new Date(`${exam.exam_date}T00:00:00`), new Date()) >= 0);

  const openPlanSettings = () => {
    const savedTarget = subjectPlanConfig?.target_exam_date;
    setPlanPreferences({
      target_exam_date: savedTarget && upcomingEndsemExams.some(exam => exam.exam_date === savedTarget) ? savedTarget : upcomingEndsemExams[0]?.exam_date || '',
      daily_study_hours: subjectPlanConfig?.daily_study_hours ?? DEFAULT_PLAN_PREFERENCES.daily_study_hours,
      buffer_days: subjectPlanConfig?.buffer_days ?? DEFAULT_PLAN_PREFERENCES.buffer_days,
      revision_cycles: subjectPlanConfig?.revision_cycles ?? DEFAULT_PLAN_PREFERENCES.revision_cycles,
      preferred_session_length_minutes: subjectPlanConfig?.preferred_session_length_minutes ?? DEFAULT_PLAN_PREFERENCES.preferred_session_length_minutes,
      break_between_sessions_minutes: subjectPlanConfig?.break_between_sessions_minutes ?? DEFAULT_PLAN_PREFERENCES.break_between_sessions_minutes,
      weak_topic_extra_time_multiplier: subjectPlanConfig?.weak_topic_extra_time_multiplier ?? DEFAULT_PLAN_PREFERENCES.weak_topic_extra_time_multiplier,
    });
    setShowPlanSettings(true);
  };

  const openEndsemForm = () => {
    setEditingExam(null);
    setExamFormData({ exam_type: 'ENDSEM', exam_name: '', exam_date: '', start_time: '', end_time: '', venue: '', max_marks: 100, weightage: 20 });
    setShowAddExam(true);
  };
  
  // Calculate topic coverages
  const topicCoverages = new Map(coverage.filter(c => subjectTopics.some(t => t.id === c.topic_id)).map(c => [c.topic_id, c]));
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="planner-page planning-page flex flex-col gap-6 animate-in fade-in duration-500 relative">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <p className="planning-eyebrow">A little preparation, every day</p>
        <h1>Exam planner</h1>
        <p className="page-subtitle">Make time for revision, one subject at a time.</p>
      </div>

      {/* Subject Selector */}
      <div className="planning-subject-block">
        <p id={`${formId}-subject-selector`} className="planning-section-kicker">Subject</p>
        <div role="group" aria-labelledby={`${formId}-subject-selector`} className="planning-subject-rail">
          {SUBJECTS.map((subject) => (
            <button
              key={subject.code}
              type="button"
              aria-pressed={selectedSubject === subject.code}
              onClick={() => setSelectedSubject(subject.code)}
              className={`planning-subject ${selectedSubject === subject.code ? 'is-active' : ''}`}
            >
              <span className="planning-subject-name">{subject.shortName}</span>
              <span className="planning-subject-code">{subject.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="planner-view-switch" role="group" aria-label="Planner view">
        {[
          { id: 'DASHBOARD', label: 'Countdown', icon: ClockIcon },
          { id: 'SYLLABUS', label: 'Syllabus', icon: BookOpenIcon },
          { id: 'PLAN', label: 'Study Plan', icon: ChartBarIcon }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTab === tab.id}
            aria-controls={`${formId}-view-panel`}
            onClick={() => setActiveTab(tab.id as 'DASHBOARD' | 'SYLLABUS' | 'PLAN')}
            className={`planner-view-option ${activeTab === tab.id ? 'is-active' : ''}`}
          >
            {activeTab === tab.id && <motion.span className="planner-view-highlight" layoutId={`${formId}-planner-view`} transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 450, damping: 34 }} />}
            <tab.icon className="w-4 h-4" aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <motion.div id={`${formId}-view-panel`} key={activeTab} className="planner-view-panel min-h-[40vh]" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .22 }}>
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <div className="planning-section-heading">
              <h2>Upcoming exams</h2>
              {subjectExams.length > 0 && <span>{subjectExams.length} scheduled</span>}
            </div>
            {/* Countdown Cards will go here */}
            {subjectExams.length === 0 ? (
              <div className="planning-empty glass-panel p-8 text-center">
                <span className="planning-empty-icon"><CalendarIcon aria-hidden="true" /></span>
                <h3>Your next milestone starts here</h3>
                <p>Add an exam for {SUBJECTS.find(subject => subject.code === selectedSubject)?.shortName} to see how much time you have.</p>
                <LiquidButton type="button"
                  onClick={() => {
                    setEditingExam(null);
                    setExamFormData({
                      exam_type: 'MIDSEM',
                      exam_name: '',
                      exam_date: '',
                      start_time: '',
                      end_time: '',
                      venue: '',
                      max_marks: 100,
                      weightage: 20
                    });
                    setShowAddExam(true);
                  }}
                >
                  <PlusIcon className="w-4 h-4 inline-block mr-1" />
                  Add an exam
                </LiquidButton>
              </div>
            ) : (
              <div className="planner-exam-grid">
                {subjectExams.map(exam => {
                  const daysRemaining = differenceInCalendarDays(new Date(`${exam.exam_date}T00:00:00`), new Date());
                  const isPast = daysRemaining < 0;
                  
                  const urgency = isPast ? 'past' : daysRemaining <= 7 ? 'soon' : daysRemaining <= 14 ? 'near' : 'later';

                  return (
                    <div key={exam.id} data-urgency={urgency} className="planner-exam-card glass-panel flex flex-col gap-3 relative overflow-hidden group">
                      <div className="planner-exam-heading">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${EXAM_TYPE_COLORS[exam.exam_type]}`}>
                              {EXAM_TYPE_LABELS[exam.exam_type]}
                            </span>
                            <time dateTime={exam.exam_date} className="text-xs text-white/50">{readableDate(exam.exam_date)}</time>
                          </div>
                          <h3>{exam.exam_name || `${EXAM_TYPE_LABELS[exam.exam_type]} exam`}</h3>
                          {(exam.venue || exam.start_time) && (
                            <p className="text-xs text-zinc-400 mt-2 flex flex-wrap items-center gap-2">
                              {exam.start_time && <span><ClockIcon className="w-3 h-3 inline mr-1" />{exam.start_time}{exam.end_time ? ` - ${exam.end_time}` : ''}</span>}
                              {exam.venue && <span>{exam.venue}</span>}
                            </p>
                          )}
                        </div>
                        <div className="planner-countdown">
                          <div className="planner-countdown-value">
                            {isPast ? 'Done' : daysRemaining === 0 ? 'Today' : daysRemaining}
                          </div>
                          {!isPast && daysRemaining > 0 && <div className="planner-countdown-caption">day{daysRemaining === 1 ? '' : 's'} left</div>}
                        </div>
                      </div>
                      
                      <div className="planner-card-actions">
                        <button 
                          type="button"
                          aria-label={`Edit ${exam.exam_name || `${exam.exam_type} exam`}`}
                          onClick={() => {
                            setEditingExam(exam);
                            setExamFormData({
                              exam_type: exam.exam_type,
                              exam_name: exam.exam_name,
                              exam_date: exam.exam_date,
                              start_time: exam.start_time || '',
                              end_time: exam.end_time || '',
                              venue: exam.venue || '',
                              max_marks: exam.max_marks || 100,
                              weightage: exam.weightage || 20
                            });
                            setShowAddExam(true);
                          }}
                          className="planning-icon-action"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          aria-label={`Delete ${exam.exam_name || `${exam.exam_type} exam`}`}
                          onClick={() => deleteExam(exam.id)}
                          className="planning-icon-action is-danger"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                <button 
                  onClick={() => {
                    setEditingExam(null);
                    setExamFormData({
                      exam_type: 'MIDSEM',
                      exam_name: '',
                      exam_date: '',
                      start_time: '',
                      end_time: '',
                      venue: '',
                      max_marks: 100,
                      weightage: 20
                    });
                    setShowAddExam(true);
                  }}
                  type="button"
                  className="planner-add-another"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Exam
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'SYLLABUS' && (
          <div className="space-y-6">
            <div className="planning-section-heading">
              <div>
                <h2>Syllabus topics</h2>
                {subjectTopics.length > 0 && <p className="planning-card-caption">{subjectTopics.filter(topic => ['COVERED', 'REVISING', 'MASTERED'].includes(topicCoverages.get(topic.id)?.status || '')).length} of {subjectTopics.length} covered</p>}
              </div>
              <button 
                type="button"
                aria-label="Add syllabus topic"
                onClick={() => {
                  setEditingTopic(null);
                  setTopicFormData({
                    topic_code: '',
                    topic_name: '',
                    unit_number: '',
                    estimated_hours: 2,
                    difficulty: 3,
                    weightage_estimate: 10,
                    is_core: true
                  });
                  setShowAddTopic(true);
                }}
                className="planning-icon-action glass-control"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
            
            {subjectTopics.length === 0 ? (
              <div className="planning-empty glass-panel p-8 text-center">
                <span className="planning-empty-icon"><BookOpenIcon aria-hidden="true" /></span>
                <h3>One topic at a time</h3>
                <p>Break your syllabus into smaller topics, then track your progress through each one.</p>
                <LiquidButton variant="starfield"
                  onClick={() => setShowAddTopic(true)}
                  className="planner-add-action"
                >
                  <PlusIcon className="w-4 h-4 inline-block mr-1" />
                  Add a topic
                </LiquidButton>
              </div>
            ) : (
              <div className="grid gap-3">
                {subjectTopics.map(topic => {
                  const topicCoverage = topicCoverages.get(topic.id);
                  const status = topicCoverage?.status || 'NOT_STARTED';
                  const colorClass = COVERAGE_STATUS_COLORS[status];
                  
                  return (
                    <div key={topic.id} className="planner-topic-card glass-panel flex flex-col gap-2 relative overflow-hidden group">
                      <div className="flex gap-3 min-w-0">
                        <div aria-hidden="true" className={`planner-topic-marker ${colorClass}`} />
                        <div className="flex-1 min-w-0">
                          <div className="planner-topic-heading">
                            <div className="min-w-0">
                              <h4 className="font-bold text-white/90 text-sm">
                                {topic.unit_number && <span className="text-zinc-500 font-normal mr-2">Unit {topic.unit_number}</span>}
                                {topic.topic_name}
                              </h4>
                              {topic.topic_code && <p className="text-xs text-zinc-500 mt-0.5 font-mono">{topic.topic_code}</p>}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <select 
                                aria-label={`Coverage status for ${topic.topic_name}`}
                                value={status}
                                onChange={(e) => {
                                  upsertCoverage({
                                    topic_id: topic.id,
                                    status: e.target.value as CoverageStatus,
                                    confidence: topicCoverage?.confidence || 0,
                                    hours_spent: topicCoverage?.hours_spent || 0,
                                    last_studied: topicCoverage?.last_studied || null,
                                    last_revised: topicCoverage?.last_revised || null,
                                    next_review: topicCoverage?.next_review || null,
                                    notes: topicCoverage?.notes || null
                                  });
                                }}
                                className={`planner-coverage-select text-xs px-3 py-2 rounded-xl border ${colorClass} appearance-none pr-7 bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75rem] font-medium`}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                              >
                                {Object.keys(COVERAGE_STATUS_COLORS).map(s => (
                                  <option key={s} value={s} className="bg-[#12141a] text-white">{COVERAGE_STATUS_LABELS[s as CoverageStatus]}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-zinc-400">
                            <span className="flex items-center gap-1" title="Estimated Hours">
                              <ClockIcon className="w-3.5 h-3.5" />
                              {topic.estimated_hours}h
                            </span>
                            <span className="flex items-center gap-1" title="Difficulty (1-5)">
                              Level {topic.difficulty}/5
                            </span>
                            {topic.is_core && (
                              <span className="flex items-center gap-1 text-amber-400/80" title="Core Topic">
                                <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Core
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="planner-card-actions">
                        <button 
                          type="button"
                          aria-label={`Edit ${topic.topic_name}`}
                          onClick={() => {
                            setEditingTopic(topic);
                            setTopicFormData({
                              topic_code: topic.topic_code,
                              topic_name: topic.topic_name,
                              unit_number: topic.unit_number?.toString() || '',
                              estimated_hours: topic.estimated_hours,
                              difficulty: topic.difficulty,
                              weightage_estimate: topic.weightage_estimate || 0,
                              is_core: topic.is_core
                            });
                            setShowAddTopic(true);
                          }}
                          className="planning-icon-action"
                        >
                          <PencilIcon className="w-3 h-3" />
                        </button>
                        <button 
                          type="button"
                          aria-label={`Delete ${topic.topic_name}`}
                          onClick={() => deleteTopic(topic.id)}
                          className="planning-icon-action is-danger"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'PLAN' && (
          <div className="space-y-6">
            <div className="planning-section-heading">
              <div><h2>Your study plan</h2><p className="planning-card-caption">Working back from your endsem.</p></div>
              {subjectPlanConfig && upcomingEndsemExams.length > 0 && subjectTopics.length > 0 && <button type="button" onClick={openPlanSettings} className="glass-control planning-secondary-action px-3 py-2">Study plan settings</button>}
            </div>

            <StudyImages subjectCode={selectedSubject} />
            
            {(() => {
              const plan = getReverseCountdownPlan(selectedSubject);
              
              if (!plan || subjectTopics.length === 0) {
                return (
                  <div className="planning-empty glass-panel p-8 text-center">
                    <span className="planning-empty-icon"><ChartBarIcon aria-hidden="true" /></span>
                    <h3>Give your revision a plan</h3>
                    <p>{upcomingEndsemExams.length === 0 ? 'Start with your endsem date, then add the topics you need to cover.' : subjectTopics.length === 0 ? 'Add a few syllabus topics, then choose how much time you can study each day.' : 'Choose your exam and daily study time. We’ll spread your topics and revision across the days ahead.'}</p>
                    <div className="planning-empty-actions">
                      {upcomingEndsemExams.length === 0 && <LiquidButton type="button" onClick={openEndsemForm}>Add endsem exam</LiquidButton>}
                      {subjectTopics.length === 0 && <button type="button" className="glass-control planning-secondary-action" onClick={() => setActiveTab('SYLLABUS')}>Add topics</button>}
                      {upcomingEndsemExams.length > 0 && subjectTopics.length > 0 && <LiquidButton type="button" onClick={openPlanSettings}>Create study plan</LiquidButton>}
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="space-y-6">
                  {/* Plan Overview */}
                  <div className="planner-plan-metrics grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="glass-panel p-4 border border-indigo-500/20 text-center">
                      <div className="text-2xl font-bold text-indigo-400">{plan.days_remaining}</div>
                      <div className="text-xs text-white/60 uppercase mt-1 tracking-wider font-semibold">Days to Exam</div>
                    </div>
                    <div className="glass-panel p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white">{plan.hours_per_day_needed}h</div>
                      <div className="text-xs text-white/60 uppercase mt-1 tracking-wider font-semibold">Study / Day</div>
                    </div>
                    <div className="glass-panel p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-emerald-400">{plan.covered_topics}/{plan.total_topics}</div>
                      <div className="text-xs text-white/60 uppercase mt-1 tracking-wider font-semibold">Topics Covered</div>
                    </div>
                    <div className="glass-panel p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-amber-400">{plan.remaining_topics}</div>
                      <div className="text-xs text-white/60 uppercase mt-1 tracking-wider font-semibold">Topics Left</div>
                    </div>
                  </div>
                  
                  {/* Warnings */}
                  {plan.warnings.length > 0 && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col gap-2">
                      {plan.warnings.map((warning, i) => (
                        <div key={i} className="flex gap-2 text-sm text-red-300 items-start">
                          <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-red-400" />
                          <span>{warning.replace('⚠️ ', '')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Milestones */}
                  {plan.milestones.length > 0 && (
                    <div className="planner-milestones glass-panel p-5 border border-white/10">
                      <h3 className="font-bold text-white/90 mb-4 flex items-center gap-2">
                        <CheckCircleIconOutline className="w-5 h-5 text-indigo-400" />
                        Key Milestones
                      </h3>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                        {plan.milestones.map((milestone, i) => (
                          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white/50 bg-[#12141a] text-white/50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl glass-panel border border-white/5 shadow">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <h4 className="font-bold text-white/90 text-sm">{milestone.label}</h4>
                                <time dateTime={milestone.date} className="text-xs planning-accent font-medium">{readableDate(milestone.date)}</time>
                              </div>
                              <p className="text-xs text-zinc-400">Complete {milestone.topics_to_complete.length} topics by this date to stay on track.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Daily Plan Schedule */}
                  <div className="glass-panel border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                      <h3 className="font-bold text-white/90">Suggested Daily Schedule</h3>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                      {plan.daily_plan.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">
                          No schedule generated. Make sure you have upcoming exams and remaining topics.
                        </div>
                      ) : (
                        plan.daily_plan.map(dp => {
                          const topic = topics.find(t => t.id === dp.topic_id);
                          const isRevision = dp.session_type === 'REVISION';
                          const plannedDate = new Date(`${dp.plan_date}T00:00:00`);
                          
                          return (
                            <div key={dp.id} className="planner-daily-row p-4 flex gap-4 hover:bg-white/[0.02] transition-colors">
                              <div className="w-16 shrink-0 text-center">
                                <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{plannedDate.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                                <div className="text-xl font-bold text-white/90">{plannedDate.getDate()}</div>
                                <div className="text-xs text-zinc-600">{plannedDate.toLocaleDateString('en-IN', { month: 'short' })}</div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h4 className="font-medium text-sm text-white/90">
                                      {topic?.topic_name || 'Unknown Topic'}
                                    </h4>
                                    <p className="text-xs text-zinc-500 mt-1">{isRevision ? 'Revision session' : 'First pass'}{topic?.unit_number ? ` · Unit ${topic.unit_number}` : ''}</p>
                                  </div>
                                  <div className="shrink-0 text-xs font-medium planning-accent px-2 py-1 rounded-md assessment-type-chip">
                                    {dp.planned_hours}h
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </motion.div>

      {showPlanSettings && (
        <Dialog label="Study plan settings" onClose={() => setShowPlanSettings(false)}>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : .2 }}
            className="planning-form w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 max-h-[88dvh] overflow-y-auto"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-xl font-medium text-white">Study plan settings</h3>
              <button type="button" aria-label="Close study plan settings" onClick={() => setShowPlanSettings(false)} className="planning-icon-action glass-control"><XCircleIcon aria-hidden="true" /></button>
            </div>
            <p className="planning-card-caption mb-6">A realistic pace for {SUBJECTS.find(subject => subject.code === selectedSubject)?.shortName}, with time left to revise.</p>
            <form className="space-y-5" onSubmit={event => {
              event.preventDefault();
              if (!upcomingEndsemExams.some(exam => exam.exam_date === planPreferences.target_exam_date)) return;
              upsertPlannerConfig({
                user_id: subjectPlanConfig?.user_id,
                subject_code: selectedSubject,
                ...planPreferences,
              });
              setShowPlanSettings(false);
            }}>
              <div>
                <label htmlFor={`${formId}-plan-target`} className="block text-sm text-zinc-400 mb-2">Target endsem exam</label>
                <select id={`${formId}-plan-target`} required value={planPreferences.target_exam_date} onChange={event => setPlanPreferences(previous => ({ ...previous, target_exam_date: event.target.value }))} className="glass-input w-full px-3 py-3 rounded-xl">
                  {upcomingEndsemExams.map(exam => <option key={exam.id} value={exam.exam_date}>{exam.exam_name || 'Endsem exam'} · {readableDate(exam.exam_date)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`${formId}-plan-hours`} className="block text-sm text-zinc-400 mb-2">Daily study time (hours)</label>
                <input id={`${formId}-plan-hours`} type="number" inputMode="decimal" required min="0.25" max="12" step="0.25" value={planPreferences.daily_study_hours} onChange={event => setPlanPreferences(previous => ({ ...previous, daily_study_hours: Number(event.target.value) }))} className="glass-input w-full px-3 py-3 rounded-xl" />
                <p className="planning-card-caption">The time you can comfortably give this subject.</p>
              </div>
              <div className="grid grid-cols-2 items-start gap-3">
                <div>
                  <label htmlFor={`${formId}-plan-buffer`} className="block text-sm text-zinc-400 mb-2">Buffer days</label>
                  <input id={`${formId}-plan-buffer`} type="number" inputMode="numeric" required min="0" max="30" step="1" value={planPreferences.buffer_days} onChange={event => setPlanPreferences(previous => ({ ...previous, buffer_days: Number(event.target.value) }))} className="glass-input w-full px-3 py-3 rounded-xl" />
                  <p className="planning-card-caption">Keep these days free before the exam.</p>
                </div>
                <div>
                  <label htmlFor={`${formId}-plan-revisions`} className="block text-sm text-zinc-400 mb-2">Revision rounds</label>
                  <input id={`${formId}-plan-revisions`} type="number" inputMode="numeric" required min="0" max="5" step="1" value={planPreferences.revision_cycles} onChange={event => setPlanPreferences(previous => ({ ...previous, revision_cycles: Number(event.target.value) }))} className="glass-input w-full px-3 py-3 rounded-xl" />
                  <p className="planning-card-caption">Revisit the topics you’ve covered.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowPlanSettings(false)} className="glass-control flex-1 py-3 text-sm text-zinc-400">Cancel</button>
                <button type="submit" className="ink-btn flex-1 py-3 text-sm font-semibold">{subjectPlanConfig ? 'Update plan' : 'Create plan'}</button>
              </div>
            </form>
          </motion.div>
        </Dialog>
      )}

      {/* Add Exam Modal */}
      <AnimatePresence>
        {showAddExam && (
          <Dialog label={editingExam ? 'Edit Exam' : 'Add Exam'} onClose={() => setShowAddExam(false)}>
            <motion.div
              initial={{ opacity: 0, y: reducedMotion ? 0 : '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : '100%' }}
              transition={reducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
              className="planning-form relative w-full bg-[#12141a] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90dvh] overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 shrink-0 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white/90">{editingExam ? 'Edit Exam' : 'Add Exam'}</h3>
                <button type="button" aria-label="Close dialog" onClick={() => setShowAddExam(false)} className="min-w-11 min-h-11 grid place-items-center bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 transition-colors">
                  <XCircleIcon className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="p-6 min-h-0 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingExam) {
                      updateExam(editingExam.id, {
                        ...examFormData,
                        max_marks: Number(examFormData.max_marks),
                        weightage: Number(examFormData.weightage)
                      });
                    } else {
                      addExam({
                        subject_code: selectedSubject,
                        ...examFormData,
                        max_marks: Number(examFormData.max_marks),
                        weightage: Number(examFormData.weightage),
                        is_confirmed: true,
                        syllabus_coverage: []
                      });
                    }
                    setShowAddExam(false);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor={`${formId}-exam-type`} className="block text-sm text-zinc-400 mb-1">Exam Type</label>
                    <select 
                      id={`${formId}-exam-type`}
                      value={examFormData.exam_type}
                      onChange={e => setExamFormData(prev => ({ ...prev, exam_type: e.target.value as ExamType }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    >
                      {Object.keys(EXAM_TYPE_COLORS).map(type => (
                        <option key={type} value={type} className="bg-[#12141a]">{EXAM_TYPE_LABELS[type as ExamType]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`${formId}-exam-name`} className="block text-sm text-zinc-400 mb-1">Exam Name (Optional)</label>
                    <input 
                      id={`${formId}-exam-name`}
                      type="text"
                      value={examFormData.exam_name}
                      onChange={e => setExamFormData(prev => ({ ...prev, exam_name: e.target.value }))}
                      placeholder="e.g. Midsem 1"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label htmlFor={`${formId}-exam-date`} className="block text-sm text-zinc-400 mb-1">Date</label>
                    <input 
                      id={`${formId}-exam-date`}
                      type="date"
                      required
                      value={examFormData.exam_date}
                      onChange={e => setExamFormData(prev => ({ ...prev, exam_date: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`${formId}-exam-start-time`} className="block text-sm text-zinc-400 mb-1">Start Time (Optional)</label>
                      <input 
                        id={`${formId}-exam-start-time`}
                        type="time"
                        value={examFormData.start_time}
                        onChange={e => setExamFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${formId}-exam-end-time`} className="block text-sm text-zinc-400 mb-1">End Time (Optional)</label>
                      <input 
                        id={`${formId}-exam-end-time`}
                        type="time"
                        value={examFormData.end_time}
                        onChange={e => setExamFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`${formId}-exam-venue`} className="block text-sm text-zinc-400 mb-1">Venue (Optional)</label>
                    <input 
                      id={`${formId}-exam-venue`}
                      type="text"
                      value={examFormData.venue}
                      onChange={e => setExamFormData(prev => ({ ...prev, venue: e.target.value }))}
                      placeholder="e.g. Room 101"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`${formId}-exam-max-marks`} className="block text-sm text-zinc-400 mb-1">Max Marks</label>
                      <input 
                        id={`${formId}-exam-max-marks`}
                        type="number"
                        min="0"
                        value={examFormData.max_marks}
                        onChange={e => setExamFormData(prev => ({ ...prev, max_marks: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${formId}-exam-weightage`} className="block text-sm text-zinc-400 mb-1">Weightage (%)</label>
                      <input 
                        id={`${formId}-exam-weightage`}
                        type="number"
                        min="0"
                        max="100"
                        value={examFormData.weightage}
                        onChange={e => setExamFormData(prev => ({ ...prev, weightage: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-4 rounded-xl font-bold text-sm bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  >
                    {editingExam ? 'Save Changes' : 'Add Exam'}
                  </button>
                </form>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
      {/* Add Topic Modal */}
      <AnimatePresence>
        {showAddTopic && (
          <Dialog label={editingTopic ? 'Edit Topic' : 'Add Topic'} onClose={() => setShowAddTopic(false)}>
            <motion.div
              initial={{ opacity: 0, y: reducedMotion ? 0 : '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : '100%' }}
              transition={reducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
              className="planning-form relative w-full bg-[#12141a] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90dvh] overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 shrink-0 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white/90">{editingTopic ? 'Edit Topic' : 'Add Topic'}</h3>
                <button type="button" aria-label="Close dialog" onClick={() => setShowAddTopic(false)} className="min-w-11 min-h-11 grid place-items-center bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 transition-colors">
                  <XCircleIcon className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="p-6 min-h-0 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingTopic) {
                      updateTopic(editingTopic.id, {
                        ...topicFormData,
                        unit_number: topicFormData.unit_number ? Number(topicFormData.unit_number) : null,
                        estimated_hours: Number(topicFormData.estimated_hours),
                        difficulty: Number(topicFormData.difficulty),
                        weightage_estimate: Number(topicFormData.weightage_estimate)
                      });
                    } else {
                      addTopic({
                        subject_code: selectedSubject,
                        ...topicFormData,
                        unit_number: topicFormData.unit_number ? Number(topicFormData.unit_number) : null,
                        estimated_hours: Number(topicFormData.estimated_hours),
                        difficulty: Number(topicFormData.difficulty),
                        weightage_estimate: Number(topicFormData.weightage_estimate),
                        order_in_subject: subjectTopics.length + 1,
                        prerequisites: []
                      });
                    }
                    setShowAddTopic(false);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor={`${formId}-topic-name`} className="block text-sm text-zinc-400 mb-1">Topic Name</label>
                    <input 
                      id={`${formId}-topic-name`}
                      type="text"
                      required
                      value={topicFormData.topic_name}
                      onChange={e => setTopicFormData(prev => ({ ...prev, topic_name: e.target.value }))}
                      placeholder="e.g. Memory Management"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 items-end gap-4">
                    <div>
                      <label htmlFor={`${formId}-topic-code`} className="block text-sm text-zinc-400 mb-1">Topic Code (Optional)</label>
                      <input 
                        id={`${formId}-topic-code`}
                        type="text"
                        value={topicFormData.topic_code}
                        onChange={e => setTopicFormData(prev => ({ ...prev, topic_code: e.target.value }))}
                        placeholder="e.g. UNIT-1-2"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 uppercase"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${formId}-topic-unit`} className="block text-sm text-zinc-400 mb-1">Unit Number</label>
                      <input 
                        id={`${formId}-topic-unit`}
                        type="number"
                        min="1"
                        value={topicFormData.unit_number}
                        onChange={e => setTopicFormData(prev => ({ ...prev, unit_number: e.target.value }))}
                        placeholder="e.g. 1"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor={`${formId}-topic-hours`} className="block text-sm text-zinc-400 mb-1">Hours</label>
                      <input 
                        id={`${formId}-topic-hours`}
                        type="number"
                        min="0.5"
                        step="0.5"
                        required
                        value={topicFormData.estimated_hours}
                        onChange={e => setTopicFormData(prev => ({ ...prev, estimated_hours: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${formId}-topic-difficulty`} className="block text-sm text-zinc-400 mb-1">Difficulty (1-5)</label>
                      <input 
                        id={`${formId}-topic-difficulty`}
                        type="number"
                        min="1"
                        max="5"
                        required
                        value={topicFormData.difficulty}
                        onChange={e => setTopicFormData(prev => ({ ...prev, difficulty: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${formId}-topic-weightage`} className="block text-sm text-zinc-400 mb-1">Weightage</label>
                      <input 
                        id={`${formId}-topic-weightage`}
                        type="number"
                        min="0"
                        max="100"
                        value={topicFormData.weightage_estimate}
                        onChange={e => setTopicFormData(prev => ({ ...prev, weightage_estimate: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                    <input
                      type="checkbox"
                      id={`${formId}-topic-core`}
                      checked={topicFormData.is_core}
                      onChange={e => setTopicFormData(prev => ({ ...prev, is_core: e.target.checked }))}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-[#12141a]"
                    />
                    <label htmlFor={`${formId}-topic-core`} className="text-white/90">Mark as Core Topic</label>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-4 rounded-xl font-bold text-sm bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  >
                    {editingTopic ? 'Save Changes' : 'Add Topic'}
                  </button>
                </form>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
