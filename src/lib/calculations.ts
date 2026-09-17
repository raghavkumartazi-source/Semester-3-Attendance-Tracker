import { 
  AttendanceLevel, 
  AttendanceStatus, 
  SubjectAttendance, 
  OverallAttendance, 
  Session,
  MarkComponent,
  SubjectGradeConfig,
  SubjectMarksSummary,
  OverallGradeSummary,
  GradeLetter,
  GradeBoundary,
  GradeScenario,
  SyllabusTopic,
  TopicCoverage,
  DailyStudyPlan,
  StudySession,
  PlannerConfig,
  ReverseCountdownPlan,
  CoverageStatus,
  ExamSchedule
} from './types';
import { MINIMUM_ATTENDANCE, SUBJECTS, SEMESTER_END } from './config';

/**
 * Calculate attendance percentage.
 * Returns null if no classes conducted.
 */
export function calculateAttendance(present: number, absent: number): number | null {
  const total = present + absent;
  if (total === 0) return null;
  return (present / total) * 100;
}

/**
 * Calculate maximum classes that can be bunked while staying >= 75%.
 * Solve: present / (total + x) >= 0.75
 * => x <= (present / 0.75) - total
 * => x <= (present - 0.75 * total) / 0.75
 */
export function calculateCanBunk(present: number, absent: number): number {
  const total = present + absent;
  if (total === 0) return 0;
  const percentage = present / total;
  if (percentage < MINIMUM_ATTENDANCE) return 0;
  const x = Math.floor(present / MINIMUM_ATTENDANCE) - total;
  return Math.max(0, x);
}

/**
 * Calculate minimum classes that must be attended to reach >= 75%.
 * Solve: (present + x) / (total + x) >= 0.75
 * => present + x >= 0.75 * total + 0.75 * x
 * => 0.25 * x >= 0.75 * total - present
 * => x >= (0.75 * total - present) / 0.25
 * => x >= 3 * total - 4 * present
 */
export function calculateNeedToAttend(present: number, absent: number): number {
  const total = present + absent;
  if (total === 0) return 0;
  const percentage = present / total;
  if (percentage >= MINIMUM_ATTENDANCE) return 0;
  const x = Math.ceil((MINIMUM_ATTENDANCE * total - present) / (1 - MINIMUM_ATTENDANCE));
  return Math.max(0, x);
}

/**
 * Determine attendance status level.
 */
export function calculateStatus(present: number, absent: number): AttendanceLevel {
  const total = present + absent;
  if (total === 0) return 'NO_DATA';
  const percentage = (present / total) * 100;
  if (percentage >= 80) return 'SAFE';
  if (percentage >= 75) return 'WARNING';
  return 'DANGER';
}

/**
 * Get complete attendance stats for a subject from its sessions.
 */
export function getSubjectAttendance(sessions: Session[]): SubjectAttendance {
  let present = 0;
  let absent = 0;
  let cancelled = 0;
  let unmarked = 0;

  for (const s of sessions) {
    switch (s.status) {
      case 'PRESENT': present++; break;
      case 'ABSENT': absent++; break;
      case 'CANCELLED': cancelled++; break;
      case 'UNMARKED': unmarked++; break;
    }
  }

  return {
    present,
    absent,
    cancelled,
    unmarked,
    totalConducted: present + absent,
    percentage: calculateAttendance(present, absent),
    canBunk: calculateCanBunk(present, absent),
    needToAttend: calculateNeedToAttend(present, absent),
    level: calculateStatus(present, absent),
  };
}

/**
 * Get overall attendance across all subjects.
 */
export function getOverallAttendance(allSessions: Session[]): OverallAttendance {
  let totalPresent = 0;
  let totalAbsent = 0;

  for (const s of allSessions) {
    if (s.status === 'PRESENT') totalPresent++;
    if (s.status === 'ABSENT') totalAbsent++;
  }

  const totalConducted = totalPresent + totalAbsent;

  return {
    totalPresent,
    totalAbsent,
    totalConducted,
    percentage: calculateAttendance(totalPresent, totalAbsent),
    level: calculateStatus(totalPresent, totalAbsent),
  };
}

/**
 * Format attendance percentage for display.
 */
export function formatPercentage(value: number | null): string {
  if (value === null) return '--';
  return `${Math.round(value * 10) / 10}%`;
}

/**
 * Get status color classes.
 */
export function getStatusColor(level: AttendanceLevel): string {
  switch (level) {
    case 'SAFE': return 'text-emerald-400';
    case 'WARNING': return 'text-amber-400';
    case 'DANGER': return 'text-red-400';
    case 'NO_DATA': return 'text-zinc-500';
  }
}

export function getStatusBg(level: AttendanceLevel): string {
  switch (level) {
    case 'SAFE': return 'bg-emerald-500/10 border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]';
    case 'WARNING': return 'bg-amber-500/10 border-amber-500/20 shadow-[inset_0_1px_1px_rgba(245,158,11,0.1)]';
    case 'DANGER': return 'bg-red-500/10 border-red-500/20 shadow-[inset_0_1px_1px_rgba(239,68,68,0.1)]';
    case 'NO_DATA': return 'bg-white/[0.03] border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]';
  }
}

export function getStatusLabel(level: AttendanceLevel): string {
  switch (level) {
    case 'SAFE': return 'SAFE';
    case 'WARNING': return 'WARNING';
    case 'DANGER': return 'DANGER';
    case 'NO_DATA': return 'NO DATA';
  }
}

export function getAttendanceButtonColor(status: AttendanceStatus): string {
  switch (status) {
    case 'PRESENT': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md';
    case 'ABSENT': return 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md';
    case 'CANCELLED': return 'bg-white/10 text-white/90 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md';
    case 'UNMARKED': return 'glass-button text-zinc-400 hover:text-white drop-shadow-sm';
  }
}

/**
 * Calculate the current "Perfect Streak".
 * A streak is consecutive past days (that had classes) where all marked classes were 'PRESENT'.
 * If a day had an 'ABSENT', the streak resets.
 * Days with only 'CANCELLED' or 'UNMARKED' are ignored.
 */
export function calculateCurrentStreak(sessions: Session[]): number {
  // Group sessions by date
  const byDate: Record<string, Session[]> = {};
  for (const s of sessions) {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const pastDates = Object.keys(byDate)
    .filter(date => date <= todayStr)
    .sort((a, b) => b.localeCompare(a)); // sort descending (newest first)

  let streak = 0;

  for (const date of pastDates) {
    const daySessions = byDate[date];
    
    let hasPresent = false;
    let hasAbsent = false;
    
    for (const s of daySessions) {
      if (s.status === 'ABSENT') hasAbsent = true;
      if (s.status === 'PRESENT') hasPresent = true;
    }

    if (hasAbsent) {
      // Streak broken
      break;
    }
    
    if (hasPresent) {
      // Day was perfect (no absent, at least one present)
      streak++;
    }
  }

  return streak;
}

/**
 * Get cumulative attendance percentage over time.
 * Returns an array of { date, percentage } objects for charting.
 */
export function getAttendanceTrends(sessions: Session[]): { date: string; percentage: number }[] {
  // Sort sessions chronologically (oldest first)
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  const trends: { date: string; percentage: number }[] = [];
  let cumulativePresent = 0;
  let cumulativeTotal = 0;
  
  // Group by date to avoid multiple data points per day
  const byDate: Record<string, Session[]> = {};
  for (const s of sorted) {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  }

  const dates = Object.keys(byDate).sort();

  for (const date of dates) {
    const daySessions = byDate[date];
    for (const s of daySessions) {
      if (s.status === 'PRESENT') {
        cumulativePresent++;
        cumulativeTotal++;
      } else if (s.status === 'ABSENT') {
        cumulativeTotal++;
      }
    }
    
    // Only push if there was at least one class conducted so far
    if (cumulativeTotal > 0) {
      trends.push({
        date,
        percentage: Number(((cumulativePresent / cumulativeTotal) * 100).toFixed(1))
      });
    }
  }

  return trends;
}

/**
 * Get a breakdown of all session statuses for pie charts.
 */
export function getOverallStats(sessions: Session[]): { name: string; value: number; color: string }[] {
  let present = 0;
  let absent = 0;
  let cancelled = 0;

  for (const s of sessions) {
    if (s.status === 'PRESENT') present++;
    if (s.status === 'ABSENT') absent++;
    if (s.status === 'CANCELLED') cancelled++;
  }

  return [
    { name: 'Present', value: present, color: '#10B981' }, // Emerald-500
    { name: 'Absent', value: absent, color: '#EF4444' },  // Red-500
    { name: 'Cancelled', value: cancelled, color: '#9CA3AF' } // Gray-400
  ].filter(stat => stat.value > 0);
}

// =============================================================================
// MARKS & GRADE CALCULATIONS
// =============================================================================

export const DEFAULT_GRADE_BOUNDARIES: GradeBoundary[] = [
  { grade: 'AA', min_percentage: 80, grade_points: 10 },
  { grade: 'AB', min_percentage: 70, grade_points: 9 },
  { grade: 'BB', min_percentage: 60, grade_points: 8 },
  { grade: 'BC', min_percentage: 50, grade_points: 7 },
  { grade: 'CC', min_percentage: 40, grade_points: 6 },
  { grade: 'CD', min_percentage: 35, grade_points: 5 },
  { grade: 'DD', min_percentage: 30, grade_points: 4 },
  { grade: 'F',  min_percentage: 0,  grade_points: 0 },
];

export function getGradeFromPercentage(percentage: number, boundaries: GradeBoundary[] = DEFAULT_GRADE_BOUNDARIES): GradeLetter {
  for (const boundary of boundaries) {
    if (percentage >= boundary.min_percentage) {
      return boundary.grade;
    }
  }
  return 'F';
}

export function getGradePoints(grade: GradeLetter, boundaries: GradeBoundary[] = DEFAULT_GRADE_BOUNDARIES): number {
  const boundary = boundaries.find(b => b.grade === grade);
  return boundary?.grade_points ?? 0;
}

/**
 * Calculate marks summary for a single subject
 */
export function calculateSubjectMarksSummary(
  components: MarkComponent[],
  gradeConfig: SubjectGradeConfig | null
): SubjectMarksSummary {
  const subject = SUBJECTS.find(s => s.code === components[0]?.subject_code);
  
  // Only consider published components for current percentage
  const publishedComponents = components.filter(c => c.is_published && c.scored !== null);
  const pendingComponents = components.filter(c => !c.is_published || c.scored === null);
  
  const totalWeightage = components.reduce((sum, c) => sum + c.weightage, 0);
  
  // Earned weightage from published components
  const earnedWeightage = publishedComponents.reduce((sum, c) => {
    if (c.scored !== null && c.max_marks > 0) {
      return sum + (c.scored / c.max_marks) * c.weightage;
    }
    return sum;
  }, 0);
  
  const pendingWeightage = pendingComponents.reduce((sum, c) => sum + c.weightage, 0);
  
  // Current percentage (only from published)
  const currentPercentage = publishedComponents.length > 0 && totalWeightage > 0
    ? (earnedWeightage / totalWeightage) * 100
    : null;
  
  // Projected percentage (if pending scored at current rate)
  let projectedPercentage: number | null = null;
  if (currentPercentage !== null && pendingWeightage > 0) {
    const currentRate = currentPercentage / 100;
    const projectedEarned = earnedWeightage + (pendingWeightage * currentRate);
    projectedPercentage = (projectedEarned / totalWeightage) * 100;
  }
  
  // Best case: all pending = 100%
  const bestCaseEarned = earnedWeightage + pendingWeightage;
  const bestCasePercentage = totalWeightage > 0 ? (bestCaseEarned / totalWeightage) * 100 : 0;
  
  // Worst case: all pending = 0%
  const worstCasePercentage = totalWeightage > 0 ? (earnedWeightage / totalWeightage) * 100 : 0;
  
  // Determine grade boundaries (use custom config or defaults)
  const boundaries: GradeBoundary[] = gradeConfig ? [
    { grade: 'AA', min_percentage: gradeConfig.grade_aa_min, grade_points: 10 },
    { grade: 'AB', min_percentage: gradeConfig.grade_ab_min, grade_points: 9 },
    { grade: 'BB', min_percentage: gradeConfig.grade_bb_min, grade_points: 8 },
    { grade: 'BC', min_percentage: gradeConfig.grade_bc_min, grade_points: 7 },
    { grade: 'CC', min_percentage: gradeConfig.grade_cc_min, grade_points: 6 },
    { grade: 'CD', min_percentage: gradeConfig.grade_cd_min, grade_points: 5 },
    { grade: 'DD', min_percentage: gradeConfig.grade_dd_min, grade_points: 4 },
    { grade: 'F',  min_percentage: 0, grade_points: 0 },
  ] : DEFAULT_GRADE_BOUNDARIES;
  
  const currentGrade = currentPercentage !== null ? getGradeFromPercentage(currentPercentage, boundaries) : null;
  const projectedGrade = projectedPercentage !== null ? getGradeFromPercentage(projectedPercentage, boundaries) : null;
  
  return {
    subject_code: components[0]?.subject_code || '',
    subject_name: subject?.name || components[0]?.subject_code || '',
    components,
    total_weightage: totalWeightage,
    earned_weightage: earnedWeightage,
    pending_weightage: pendingWeightage,
    current_percentage: currentPercentage,
    projected_percentage: projectedPercentage,
    best_case_percentage: bestCasePercentage,
    worst_case_percentage: worstCasePercentage,
    current_grade: currentGrade,
    projected_grade: projectedGrade,
    credits: gradeConfig?.credits || 4,
    grade_points: currentGrade ? getGradePoints(currentGrade, boundaries) : null,
  };
}

/**
 * Calculate overall SGPA from subject summaries
 */
export function calculateSGPA(subjectSummaries: SubjectMarksSummary[]): number | null {
  const subjectsWithGrades = subjectSummaries.filter(s => s.current_grade && s.current_percentage !== null);
  if (subjectsWithGrades.length === 0) return null;
  
  let totalGradePoints = 0;
  let totalCredits = 0;
  
  for (const s of subjectsWithGrades) {
    if (s.current_grade && s.grade_points !== null) {
      totalGradePoints += s.grade_points * s.credits;
      totalCredits += s.credits;
    }
  }
  
  if (totalCredits === 0) return null;
  return Number((totalGradePoints / totalCredits).toFixed(2));
}

/**
 * Calculate overall grade summary across all subjects
 */
export function calculateOverallGradeSummary(subjectSummaries: SubjectMarksSummary[]): OverallGradeSummary {
  const sgpa = calculateSGPA(subjectSummaries);
  const totalCredits = subjectSummaries.reduce((sum, s) => sum + s.credits, 0);
  const earnedCredits = subjectSummaries.filter(s => s.current_grade && s.current_grade !== 'F').reduce((sum, s) => sum + s.credits, 0);
  
  return {
    subjects: subjectSummaries,
    sgpa,
    cgpa: null, // Would need previous semester data
    total_credits: totalCredits,
    earned_credits: earnedCredits,
  };
}

/**
 * Simulate a what-if scenario for a subject
 */
export function simulateGradeScenario(
  components: MarkComponent[],
  assumptions: Record<string, number>, // component_id -> assumed percentage (0-100)
  gradeConfig: SubjectGradeConfig | null
): { projected_percentage: number; projected_grade: GradeLetter } {
  const boundaries: GradeBoundary[] = gradeConfig ? [
    { grade: 'AA', min_percentage: gradeConfig.grade_aa_min, grade_points: 10 },
    { grade: 'AB', min_percentage: gradeConfig.grade_ab_min, grade_points: 9 },
    { grade: 'BB', min_percentage: gradeConfig.grade_bb_min, grade_points: 8 },
    { grade: 'BC', min_percentage: gradeConfig.grade_bc_min, grade_points: 7 },
    { grade: 'CC', min_percentage: gradeConfig.grade_cc_min, grade_points: 6 },
    { grade: 'CD', min_percentage: gradeConfig.grade_cd_min, grade_points: 5 },
    { grade: 'DD', min_percentage: gradeConfig.grade_dd_min, grade_points: 4 },
    { grade: 'F',  min_percentage: 0, grade_points: 0 },
  ] : DEFAULT_GRADE_BOUNDARIES;
  
  const totalWeightage = components.reduce((sum, c) => sum + c.weightage, 0);
  let earnedWeightage = 0;
  
  for (const c of components) {
    if (c.is_published && c.scored !== null && c.max_marks > 0) {
      // Actual score
      earnedWeightage += (c.scored / c.max_marks) * c.weightage;
    } else if (assumptions[c.id] !== undefined) {
      // Assumed score
      earnedWeightage += (assumptions[c.id] / 100) * c.weightage;
    }
    // Unpublished without assumption = 0 contribution
  }
  
  const projectedPercentage = totalWeightage > 0 ? (earnedWeightage / totalWeightage) * 100 : 0;
  const projectedGrade = getGradeFromPercentage(projectedPercentage, boundaries);
  
  return { projected_percentage: projectedPercentage, projected_grade: projectedGrade };
}

/**
 * Find minimum scores needed in pending components to achieve target grade
 */
export function calculateTargetRequirements(
  components: MarkComponent[],
  targetGrade: GradeLetter,
  gradeConfig: SubjectGradeConfig | null
): { component_id: string; component_name: string; required_percentage: number; required_marks: number }[] {
  const boundaries: GradeBoundary[] = gradeConfig ? [
    { grade: 'AA', min_percentage: gradeConfig.grade_aa_min, grade_points: 10 },
    { grade: 'AB', min_percentage: gradeConfig.grade_ab_min, grade_points: 9 },
    { grade: 'BB', min_percentage: gradeConfig.grade_bb_min, grade_points: 8 },
    { grade: 'BC', min_percentage: gradeConfig.grade_bc_min, grade_points: 7 },
    { grade: 'CC', min_percentage: gradeConfig.grade_cc_min, grade_points: 6 },
    { grade: 'CD', min_percentage: gradeConfig.grade_cd_min, grade_points: 5 },
    { grade: 'DD', min_percentage: gradeConfig.grade_dd_min, grade_points: 4 },
    { grade: 'F',  min_percentage: 0, grade_points: 0 },
  ] : DEFAULT_GRADE_BOUNDARIES;
  
  const targetBoundary = boundaries.find(b => b.grade === targetGrade);
  if (!targetBoundary) return [];
  
  const targetPercentage = targetBoundary.min_percentage;
  const totalWeightage = components.reduce((sum, c) => sum + c.weightage, 0);
  const targetWeightage = (targetPercentage / 100) * totalWeightage;
  
  // Already earned from published components
  let earnedWeightage = 0;
  for (const c of components) {
    if (c.is_published && c.scored !== null && c.max_marks > 0) {
      earnedWeightage += (c.scored / c.max_marks) * c.weightage;
    }
  }
  
  const deficit = targetWeightage - earnedWeightage;
  if (deficit <= 0) return []; // Already achieved
  
  // Distribute deficit among pending components proportionally to their weightage
  const pendingComponents = components.filter(c => !c.is_published || c.scored === null);
  const pendingWeightage = pendingComponents.reduce((sum, c) => sum + c.weightage, 0);
  
  if (pendingWeightage === 0) return [];
  
  return pendingComponents.map(c => {
    const share = c.weightage / pendingWeightage;
    const requiredComponentWeightage = deficit * share;
    const requiredPercentage = (requiredComponentWeightage / c.weightage) * 100;
    const requiredMarks = (requiredPercentage / 100) * c.max_marks;
    
    return {
      component_id: c.id,
      component_name: c.component_name,
      required_percentage: Math.min(100, Math.max(0, requiredPercentage)),
      required_marks: Math.min(c.max_marks, Math.max(0, requiredMarks)),
    };
  });
}

// =============================================================================
// EXAM PREPARATION PLANNER CALCULATIONS
// =============================================================================

/**
 * Generate reverse countdown study plan from target exam date
 */
export function generateReverseCountdownPlan(
  subjectCode: string,
  topics: SyllabusTopic[],
  coverage: TopicCoverage[],
  exams: ExamSchedule[],
  config: PlannerConfig,
  existingSessions: StudySession[] = []
): ReverseCountdownPlan {
  const targetDate = new Date(config.target_exam_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const studyDaysAvailable = Math.max(0, daysRemaining - config.buffer_days);
  
  // Filter topics for this subject
  const subjectTopics = topics.filter(t => t.subject_code === subjectCode);
  const subjectCoverage = coverage.filter(c => 
    subjectTopics.some(t => t.id === c.topic_id)
  );
  
  // Coverage lookup
  const coverageMap = new Map(subjectCoverage.map(c => [c.topic_id, c]));
  
  // Categorize topics
  const coveredTopics = subjectTopics.filter(t => {
    const cov = coverageMap.get(t.id);
    return cov && ['COVERED', 'REVISING', 'MASTERED'].includes(cov.status);
  });
  
  const remainingTopics = subjectTopics.filter(t => {
    const cov = coverageMap.get(t.id);
    return !cov || ['NOT_STARTED', 'IN_PROGRESS'].includes(cov.status);
  });
  
  // Calculate total hours needed for remaining topics
  const totalEstimatedHours = remainingTopics.reduce((sum, t) => sum + t.estimated_hours, 0);
  
  // Add revision time for covered topics
  const revisionHours = coveredTopics.reduce((sum, t) => {
    const cov = coverageMap.get(t.id);
    const cycles = config.revision_cycles;
    const hoursPerCycle = t.estimated_hours * 0.5; // revision takes ~50% time
    return sum + (hoursPerCycle * cycles);
  }, 0);
  
  const totalHoursNeeded = totalEstimatedHours + revisionHours;
  const hoursPerDayNeeded = studyDaysAvailable > 0 ? totalHoursNeeded / studyDaysAvailable : 0;
  
  // Generate daily plan
  const dailyPlan: DailyStudyPlan[] = [];
  const milestones: ReverseCountdownPlan['milestones'] = [];
  const warnings: string[] = [];
  
  if (hoursPerDayNeeded > config.daily_study_hours * 1.5) {
    warnings.push(`⚠️ Need ${hoursPerDayNeeded.toFixed(1)}h/day but only have ${config.daily_study_hours}h available. Consider reducing scope or starting earlier.`);
  }
  
  if (daysRemaining < 0) {
    warnings.push(`⚠️ Target exam date (${config.target_exam_date}) has already passed!`);
  }
  
  if (studyDaysAvailable <= 0) {
    warnings.push(`⚠️ No study days available before buffer period.`);
  }
  
  // Simple distribution: fill days with topics in order
  let currentDate = new Date(today);
  const topicIndex = 0;
  const topicProgress = 0; // 0-1 for current topic
  
  // Sort remaining topics by difficulty (harder first) and weightage
  const sortedRemaining = [...remainingTopics].sort((a, b) => {
    // Core topics first, then by difficulty desc, then weightage desc
    if (a.is_core !== b.is_core) return b.is_core ? 1 : -1;
    if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty;
    return (b.weightage_estimate || 0) - (a.weightage_estimate || 0);
  });
  
  // Add revision sessions for covered topics
  const revisionSessions: { topic: SyllabusTopic; cycle: number }[] = [];
  for (const topic of coveredTopics) {
    for (let cycle = 1; cycle <= config.revision_cycles; cycle++) {
      revisionSessions.push({ topic, cycle });
    }
  }
  
  // Interleave: 70% new topics, 30% revision (adjustable)
  const allSessions: { type: 'new' | 'revision'; topic: SyllabusTopic; cycle?: number }[] = [];
  
  // Create a schedule that spreads revision throughout
  for (let i = 0; i < sortedRemaining.length; i++) {
    allSessions.push({ type: 'new', topic: sortedRemaining[i] });
    // Add a revision session every 2-3 new topics
    if (revisionSessions.length > 0 && i % 3 === 2) {
      allSessions.push({ type: 'revision', topic: revisionSessions.shift()!.topic, cycle: 1 });
    }
  }
  
  // Add remaining revision sessions at the end
  while (revisionSessions.length > 0) {
    allSessions.push({ type: 'revision', topic: revisionSessions.shift()!.topic, cycle: 1 });
  }
  
  // Generate daily plans
  for (const session of allSessions) {
    if (currentDate > targetDate) break;
    
    const dayStr = currentDate.toISOString().split('T')[0];
    const hoursForTopic = session.type === 'new' 
      ? session.topic.estimated_hours 
      : session.topic.estimated_hours * 0.5;
    
    // Split into sessions of preferred length
    const sessionLengthHours = config.preferred_session_length_minutes / 60;
    const numSessions = Math.ceil(hoursForTopic / sessionLengthHours);
    
    for (let s = 0; s < numSessions; s++) {
      if (currentDate > targetDate) break;
      
      const sessionHours = Math.min(sessionLengthHours, hoursForTopic - s * sessionLengthHours);
      
      dailyPlan.push({
        id: crypto.randomUUID(),
        user_id: '',
        plan_date: dayStr,
        subject_code: subjectCode,
        topic_id: session.topic.id,
        planned_hours: Number(sessionHours.toFixed(1)),
        actual_hours: 0,
        session_type: session.type === 'new' ? 'NEW_TOPIC' : 'REVISION',
        priority: session.type === 'new' ? 1 : 2,
        status: 'PENDING',
        notes: session.type === 'new' 
          ? `Cover: ${session.topic.topic_name} (Unit ${session.topic.unit_number || '?'})`
          : `Revision ${session.cycle}/${config.revision_cycles}: ${session.topic.topic_name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }
  }
  
  // Add milestones
  const midPoint = new Date(today.getTime() + (targetDate.getTime() - today.getTime()) / 2);
  milestones.push({
    date: midPoint.toISOString().split('T')[0],
    label: 'Mid-point Check',
    topics_to_complete: sortedRemaining.slice(0, Math.ceil(sortedRemaining.length / 2)).map(t => t.topic_code),
  });
  
  milestones.push({
    date: new Date(targetDate.getTime() - config.buffer_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    label: 'Buffer Period Starts (No New Topics)',
    topics_to_complete: sortedRemaining.map(t => t.topic_code),
  });
  
  return {
    subject_code: subjectCode,
    target_date: config.target_exam_date,
    days_remaining: daysRemaining,
    study_days_available: studyDaysAvailable,
    total_topics: subjectTopics.length,
    covered_topics: coveredTopics.length,
    remaining_topics: remainingTopics.length,
    total_estimated_hours: Number(totalHoursNeeded.toFixed(1)),
    hours_per_day_needed: Number(hoursPerDayNeeded.toFixed(1)),
    daily_plan: dailyPlan,
    milestones,
    warnings,
  };
}

/**
 * Get next review date based on spaced repetition (simplified SM-2)
 */
export function getNextReviewDate(coverage: TopicCoverage, baseIntervalDays: number = 7): Date {
  const today = new Date();
  
  if (!coverage.last_revised) {
    // First review after initial coverage
    return new Date(today.getTime() + baseIntervalDays * 24 * 60 * 60 * 1000);
  }
  
  const lastReview = new Date(coverage.last_revised);
  const daysSinceReview = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
  
  // Interval increases with confidence
  const confidenceFactor = coverage.confidence / 100;
  const intervalMultiplier = 1 + confidenceFactor * 3; // 1x to 4x
  const nextInterval = Math.round(baseIntervalDays * intervalMultiplier);
  
  const nextReview = new Date(lastReview.getTime() + nextInterval * 24 * 60 * 60 * 1000);
  
  // If already overdue, return today
  return nextReview > today ? nextReview : today;
}

/**
 * Calculate topic priority for daily planning
 */
export function calculateTopicPriority(
  topic: SyllabusTopic,
  coverage: TopicCoverage | undefined,
  daysUntilExam: number
): number {
  let priority = 0;
  
  // Base priority from weightage
  priority += (topic.weightage_estimate || 10) * 2;
  
  // Core topics get boost
  if (topic.is_core) priority += 20;
  
  // Difficulty factor (harder = more time needed = higher priority to start early)
  priority += topic.difficulty * 5;
  
  // Coverage status
  if (!coverage || coverage.status === 'NOT_STARTED') {
    priority += 30;
  } else if (coverage.status === 'IN_PROGRESS') {
    priority += 20;
  } else if (coverage.status === 'COVERED') {
    // Needs revision
    const daysSinceStudied = coverage.last_studied 
      ? Math.floor((Date.now() - new Date(coverage.last_studied).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    if (daysSinceStudied > 14) priority += 15;
    else if (daysSinceStudied > 7) priority += 5;
  }
  
  // Urgency: closer to exam = higher priority for unfinished topics
  if (daysUntilExam < 14 && (!coverage || coverage.status !== 'MASTERED')) {
    priority += (14 - daysUntilExam) * 3;
  }
  
  return priority;
}