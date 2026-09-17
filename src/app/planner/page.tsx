'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUBJECTS } from '@/lib/config';
import { usePlanner } from '@/components/PlannerProvider';
import { 
  SyllabusTopic, 
  TopicCoverage, 
  ExamSchedule, 
  PlannerConfig,
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
  PlayIcon,
  BookOpenIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const COVERAGE_STATUS_COLORS: Record<CoverageStatus, string> = {
  NOT_STARTED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  COVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REVISING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MASTERED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const EXAM_TYPE_COLORS: Record<ExamType, string> = {
  MIDSEM: 'bg-red-500/10 text-red-400 border-red-500/20',
  ENDSEM: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  QUIZ: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  LAB_EXAM: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  VIVA: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  ASSIGNMENT_DUE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function PlannerPage() {
  const { 
    topics, 
    coverage, 
    exams, 
    addTopic, 
    updateTopic, 
    deleteTopic,
    upsertCoverage,
    addExam,
    updateExam,
    deleteExam,
    getReverseCountdownPlan,
    isLoaded 
  } = usePlanner();

  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]?.code || '');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SYLLABUS' | 'PLAN'>('DASHBOARD');

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

  const subjectTopics = topics.filter(t => t.subject_code === selectedSubject).sort((a, b) => a.order_in_subject - b.order_in_subject);
  const subjectExams = exams.filter(e => e.subject_code === selectedSubject).sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 relative">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Exam Planner
        </h1>
        <p className="text-zinc-400 mt-1">Countdown & Reverse Study Plan</p>
      </div>

      {/* Subject Selector */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {SUBJECTS.map((subject) => (
            <button
              key={subject.code}
              onClick={() => setSelectedSubject(subject.code)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedSubject === subject.code
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {subject.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
        {[
          { id: 'DASHBOARD', label: 'Countdown', icon: ClockIcon },
          { id: 'SYLLABUS', label: 'Syllabus', icon: BookOpenIcon },
          { id: 'PLAN', label: 'Study Plan', icon: ChartBarIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'DASHBOARD' | 'SYLLABUS' | 'PLAN')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="min-h-[50vh]">
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white/90">Upcoming Exams</h2>
            {/* Countdown Cards will go here */}
            {subjectExams.length === 0 ? (
              <div className="glass-panel p-8 text-center border-dashed border-white/20">
                <CalendarIcon className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white/90 mb-1">No Exams Scheduled</h3>
                <p className="text-zinc-400 text-sm mb-4">Add your mid-sem, end-sem, or quizzes to start the countdown.</p>
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
                  className="px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 inline-block mr-1" />
                  Add Exam
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {subjectExams.map(exam => {
                  const daysRemaining = Math.ceil((new Date(exam.exam_date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                  const isPast = daysRemaining < 0;
                  
                  let colorClass = 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400';
                  if (isPast) colorClass = 'border-zinc-500/20 bg-zinc-500/5 text-zinc-400';
                  else if (daysRemaining <= 7) colorClass = 'border-red-500/20 bg-red-500/5 text-red-400';
                  else if (daysRemaining <= 14) colorClass = 'border-amber-500/20 bg-amber-500/5 text-amber-400';

                  return (
                    <div key={exam.id} className={`glass-panel p-4 border ${colorClass} flex flex-col gap-3 relative overflow-hidden group`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${EXAM_TYPE_COLORS[exam.exam_type]}`}>
                              {exam.exam_type.replace('_', ' ')}
                            </span>
                            <span className="text-sm text-white/50">{exam.exam_date}</span>
                          </div>
                          <h3 className="font-bold text-white/90">{exam.exam_name || `${exam.exam_type} Exam`}</h3>
                          {(exam.venue || exam.start_time) && (
                            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                              {exam.start_time && <span><ClockIcon className="w-3 h-3 inline mr-1" />{exam.start_time}{exam.end_time ? ` - ${exam.end_time}` : ''}</span>}
                              {exam.venue && <span>📍 {exam.venue}</span>}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-black ${isPast ? 'text-zinc-500' : ''}`}>
                            {isPast ? 'Done' : daysRemaining}
                          </div>
                          {!isPast && <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Days Left</div>}
                        </div>
                      </div>
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button 
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
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white/70"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteExam(exam.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400"
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
                  className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/20 text-zinc-400 hover:text-white/90 hover:bg-white/5 transition-all"
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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white/90">Syllabus Topics</h2>
              <button 
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
                className="p-2 bg-white/5 hover:bg-white/10 text-white/90 rounded-lg border border-white/10 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
            
            {subjectTopics.length === 0 ? (
              <div className="glass-panel p-8 text-center border-dashed border-white/20">
                <BookOpenIcon className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white/90 mb-1">No Topics Added</h3>
                <p className="text-zinc-400 text-sm mb-4">Break down your syllabus into smaller study topics.</p>
                <button 
                  onClick={() => setShowAddTopic(true)}
                  className="px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 inline-block mr-1" />
                  Add Topic
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {subjectTopics.map((topic, index) => {
                  const topicCoverage = topicCoverages.get(topic.id);
                  const status = topicCoverage?.status || 'NOT_STARTED';
                  const colorClass = COVERAGE_STATUS_COLORS[status];
                  
                  return (
                    <div key={topic.id} className="glass-panel p-3 border border-white/5 flex flex-col gap-2 relative overflow-hidden group">
                      <div className="flex gap-3">
                        <div className={`w-2 rounded-full ${colorClass.split(' ')[0]} ${colorClass.split(' ')[2]}`} />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-white/90 text-sm">
                                {topic.unit_number && <span className="text-zinc-500 font-normal mr-2">Unit {topic.unit_number}</span>}
                                {topic.topic_name}
                              </h4>
                              {topic.topic_code && <p className="text-xs text-zinc-500 mt-0.5 font-mono">{topic.topic_code}</p>}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <select 
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
                                className={`text-xs px-2 py-1 rounded border ${colorClass} appearance-none pr-6 bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75rem] font-medium outline-none focus:ring-1`}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                              >
                                {Object.keys(COVERAGE_STATUS_COLORS).map(s => (
                                  <option key={s} value={s} className="bg-[#12141a] text-white">{s.replace('_', ' ')}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                            <span className="flex items-center gap-1" title="Estimated Hours">
                              <ClockIcon className="w-3.5 h-3.5" />
                              {topic.estimated_hours}h
                            </span>
                            <span className="flex items-center gap-1" title="Difficulty (1-5)">
                              <span>🎯</span>
                              {topic.difficulty}/5
                            </span>
                            {topic.is_core && (
                              <span className="flex items-center gap-1 text-amber-400/80" title="Core Topic">
                                <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Core
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute top-2 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                        <button 
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
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white/70"
                        >
                          <PencilIcon className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => deleteTopic(topic.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400"
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
            <h2 className="text-xl font-bold text-white/90">Reverse Countdown Plan</h2>
            
            {(() => {
              const plan = getReverseCountdownPlan(selectedSubject);
              
              if (!plan) {
                return (
                  <div className="glass-panel p-8 text-center border-dashed border-white/20">
                    <ChartBarIcon className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-white/90 mb-1">No Plan Available</h3>
                    <p className="text-zinc-400 text-sm mb-4">You need to add a target exam (like Midsem or Endsem) and some syllabus topics first.</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-6">
                  {/* Plan Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                    <div className="glass-panel p-5 border border-white/10">
                      <h3 className="font-bold text-white/90 mb-4 flex items-center gap-2">
                        <CheckCircleIconOutline className="w-5 h-5 text-indigo-400" />
                        Key Milestones
                      </h3>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                        {plan.milestones.map((milestone, i) => (
                          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white/50 bg-[#12141a] text-white/50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl glass-panel border border-white/5 shadow">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-white/90 text-sm">{milestone.label}</h4>
                                <span className="text-xs text-indigo-400 font-medium">{milestone.date}</span>
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
                          
                          return (
                            <div key={dp.id} className="p-4 flex gap-4 hover:bg-white/[0.02] transition-colors">
                              <div className="w-16 shrink-0 text-center">
                                <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{new Date(dp.plan_date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div className="text-xl font-bold text-white/90">{new Date(dp.plan_date).getDate()}</div>
                                <div className="text-xs text-zinc-600">{new Date(dp.plan_date).toLocaleDateString('en-US', { month: 'short' })}</div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm text-white/90">
                                      {isRevision ? <span className="text-blue-400 mr-2">↻ Revision</span> : ''}
                                      {topic?.topic_name || 'Unknown Topic'}
                                    </h4>
                                    <p className="text-xs text-zinc-500 mt-0.5">{dp.notes}</p>
                                  </div>
                                  <div className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
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
      </div>

      {/* Add Exam Modal */}
      <AnimatePresence>
        {showAddExam && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddExam(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[#12141a] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 shrink-0 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white/90">{editingExam ? 'Edit Exam' : 'Add Exam'}</h3>
                <button onClick={() => setShowAddExam(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 transition-colors">
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
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
                    <label className="block text-sm text-zinc-400 mb-1">Exam Type</label>
                    <select 
                      value={examFormData.exam_type}
                      onChange={e => setExamFormData(prev => ({ ...prev, exam_type: e.target.value as ExamType }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    >
                      {Object.keys(EXAM_TYPE_COLORS).map(type => (
                        <option key={type} value={type} className="bg-[#12141a]">{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Exam Name (Optional)</label>
                    <input 
                      type="text"
                      value={examFormData.exam_name}
                      onChange={e => setExamFormData(prev => ({ ...prev, exam_name: e.target.value }))}
                      placeholder="e.g. Midsem 1"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Date</label>
                    <input 
                      type="date"
                      required
                      value={examFormData.exam_date}
                      onChange={e => setExamFormData(prev => ({ ...prev, exam_date: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Start Time (Optional)</label>
                      <input 
                        type="time"
                        value={examFormData.start_time}
                        onChange={e => setExamFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">End Time (Optional)</label>
                      <input 
                        type="time"
                        value={examFormData.end_time}
                        onChange={e => setExamFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Venue (Optional)</label>
                    <input 
                      type="text"
                      value={examFormData.venue}
                      onChange={e => setExamFormData(prev => ({ ...prev, venue: e.target.value }))}
                      placeholder="e.g. Room 101"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Max Marks</label>
                      <input 
                        type="number"
                        min="0"
                        value={examFormData.max_marks}
                        onChange={e => setExamFormData(prev => ({ ...prev, max_marks: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Weightage (%)</label>
                      <input 
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
          </div>
        )}
      </AnimatePresence>
      {/* Add Topic Modal */}
      <AnimatePresence>
        {showAddTopic && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddTopic(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[#12141a] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 shrink-0 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white/90">{editingTopic ? 'Edit Topic' : 'Add Topic'}</h3>
                <button onClick={() => setShowAddTopic(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 transition-colors">
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
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
                    <label className="block text-sm text-zinc-400 mb-1">Topic Name</label>
                    <input 
                      type="text"
                      required
                      value={topicFormData.topic_name}
                      onChange={e => setTopicFormData(prev => ({ ...prev, topic_name: e.target.value }))}
                      placeholder="e.g. Memory Management"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Topic Code (Optional)</label>
                      <input 
                        type="text"
                        value={topicFormData.topic_code}
                        onChange={e => setTopicFormData(prev => ({ ...prev, topic_code: e.target.value }))}
                        placeholder="e.g. UNIT-1-2"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Unit Number</label>
                      <input 
                        type="number"
                        min="1"
                        value={topicFormData.unit_number}
                        onChange={e => setTopicFormData(prev => ({ ...prev, unit_number: e.target.value }))}
                        placeholder="e.g. 1"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Hours</label>
                      <input 
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
                      <label className="block text-sm text-zinc-400 mb-1">Difficulty (1-5)</label>
                      <input 
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
                      <label className="block text-sm text-zinc-400 mb-1">Weightage</label>
                      <input 
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
                      id="isCore"
                      checked={topicFormData.is_core}
                      onChange={e => setTopicFormData(prev => ({ ...prev, is_core: e.target.checked }))}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-[#12141a]"
                    />
                    <label htmlFor="isCore" className="text-white/90">Mark as Core Topic</label>
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
