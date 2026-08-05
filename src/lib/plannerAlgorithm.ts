import { Task, WorkSession, Session } from './types';
import { PlannerPreferences, loadPlannerPreferences } from './plannerPreferences';

export interface SuggestedPlan {
  sessions: Omit<WorkSession, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>[];
  overloadedTasks: Task[];
}

type TimeBlock = {
  start: Date;
  end: Date;
};

export const generateSmartPlan = (
  tasks: Task[],
  classSessions: Session[],
  workSessions: WorkSession[],
  prefs: PlannerPreferences = loadPlannerPreferences()
): SuggestedPlan => {
  const suggestedSessions: Omit<WorkSession, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>[] = [];
  const overloadedTasks: Task[] = [];
  
  // 1. Filter and prepare tasks
  const now = new Date();
  
  console.log('=== PLANNER WINDOW DEBUG ===');
  console.log(`current local datetime: ${now.toString()}`);
  console.log(`current local ISO date: ${now.toISOString()}`);
  console.log(`planning horizon start: ${now.toISOString()}`);
  console.log(`planning horizon end (max): ${new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()}`);
  console.log(`weekday work window: ${prefs.weekdayWorkStart} - ${prefs.weekdayWorkEnd}`);
  console.log(`weekend work window: ${prefs.weekendWorkStart} - ${prefs.weekendWorkEnd}`);
  console.log(`minSessionDuration: ${prefs.minSessionDuration}`);
  console.log(`prefSessionDuration: ${prefs.prefSessionDuration}`);
  console.log(`bufferDuration: ${prefs.bufferDuration}`);
  console.log('============================');

  console.log('=== PLANNER TASK DEBUG ===');
  const incompleteTasks = tasks.filter(t => {
    let eligible = true;
    let reason = '';
    
    if (t.completed) { eligible = false; reason = 'completed'; }
    else if (t.deleted_at) { eligible = false; reason = 'deleted'; }
    else if (!t.estimated_minutes) { eligible = false; reason = 'no estimated_minutes'; }
    else if (!t.due_at) { eligible = false; reason = 'no due_at'; }
    
    const existingSessions = workSessions.filter(s => s.task_id === t.id && s.status === 'PLANNED' && !s.deleted_at);
    const plannedMinutes = existingSessions.reduce((total, s) => {
      const start = new Date(s.planned_start).getTime();
      const end = new Date(s.planned_end).getTime();
      return total + Math.round((end - start) / 60000);
    }, 0);
    const unallocatedMinutes = eligible ? Math.max(0, (t.estimated_minutes || 0) - plannedMinutes) : 0;

    console.log(`- Task: [${t.id}] ${t.title}`);
    console.log(`  completed: ${t.completed}`);
    console.log(`  deleted_at: ${t.deleted_at}`);
    console.log(`  due_at: ${t.due_at}`);
    console.log(`  estimated_minutes: ${t.estimated_minutes}`);
    console.log(`  priority: ${t.priority}`);
    console.log(`  existing PLANNED minutes: ${plannedMinutes}`);
    console.log(`  calculated unallocatedMinutes: ${unallocatedMinutes}`);
    console.log(`  eligible: ${eligible}${!eligible ? ` (reason: ${reason})` : ''}`);

    return eligible;
  });
  console.log('==========================');
  if (incompleteTasks.length === 0) return { sessions: [], overloadedTasks: [] };
  
  // Calculate remaining effort for each task
  const taskNeeds = incompleteTasks.map(t => {
    const existingSessions = workSessions.filter(s => s.task_id === t.id && s.status === 'PLANNED' && !s.deleted_at);
    const plannedMinutes = existingSessions.reduce((total, s) => {
      const start = new Date(s.planned_start).getTime();
      const end = new Date(s.planned_end).getTime();
      return total + Math.round((end - start) / 60000);
    }, 0);
    
    return {
      task: t,
      remainingMinutes: Math.max(0, (t.estimated_minutes || 0) - plannedMinutes),
      dueDate: new Date(t.due_at as string)
    };
  }).filter(t => t.remainingMinutes > 0);

  // Sort tasks by priority, urgency
  taskNeeds.sort((a, b) => {
    // Treat overdue tasks with very high urgency
    const isOverdueA = a.dueDate.getTime() < now.getTime();
    const isOverdueB = b.dueDate.getTime() < now.getTime();
    
    if (isOverdueA && !isOverdueB) return -1;
    if (isOverdueB && !isOverdueA) return 1;

    // 1. Urgency
    const daysA = Math.max(0, (a.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysB = Math.max(0, (b.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // 2. Priority
    const pWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const pA = pWeight[a.task.priority];
    const pB = pWeight[b.task.priority];
    
    const scoreA = (10 / (daysA + 1)) * pA;
    const scoreB = (10 / (daysB + 1)) * pB;
    
    return scoreB - scoreA; // descending
  });

  // Prepare existing commitments
  const blockedTimes: TimeBlock[] = [];
  
  // Add class sessions to blocked times
  classSessions.forEach(s => {
    const d = new Date(s.date);
    const [h, m] = s.startTime.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    
    const end = new Date(d);
    end.setMinutes(end.getMinutes() + (s.classType === 'Lab' ? 120 : 60));
    
    // Add buffer
    d.setMinutes(d.getMinutes() - prefs.bufferDuration);
    end.setMinutes(end.getMinutes() + prefs.bufferDuration);
    
    blockedTimes.push({ start: d, end });
  });
  
  // Add existing work sessions
  workSessions.filter(s => s.status !== 'CANCELLED' && !s.deleted_at).forEach(s => {
    const start = new Date(s.planned_start);
    const end = new Date(s.planned_end);
    
    start.setMinutes(start.getMinutes() - prefs.bufferDuration);
    end.setMinutes(end.getMinutes() + prefs.bufferDuration);
    
    blockedTimes.push({ start, end });
  });

    // 14 days lookahead
  for (const tNeed of taskNeeds) {
    let remaining = tNeed.remainingMinutes;
    const currentDay = new Date(now);
    currentDay.setHours(0,0,0,0);
    
    // For overdue tasks, schedule before a virtual deadline of 14 days
    const isOverdue = tNeed.dueDate.getTime() < now.getTime();
    const deadline = isOverdue ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : new Date(tNeed.dueDate);
    deadline.setHours(23, 59, 59, 999);
    
    while (remaining > 0 && currentDay <= deadline && currentDay.getTime() < now.getTime() + 14 * 24 * 60 * 60 * 1000) {
      const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
      const startStr = isWeekend ? prefs.weekendWorkStart : prefs.weekdayWorkStart;
      const endStr = isWeekend ? prefs.weekendWorkEnd : prefs.weekdayWorkEnd;
      
      console.log(`\n=== PLANNER DAY DEBUG: ${currentDay.toLocaleDateString()} ===`);
      console.log(`configured work start/end: ${startStr} - ${endStr}`);
      console.log(`class blocks: ${blockedTimes.length} total blocks (classes & sessions) configured in system`);
      
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);
      
      const workStart = new Date(currentDay);
      workStart.setHours(sh, sm, 0, 0);
      
      const workEnd = new Date(currentDay);
      workEnd.setHours(eh, em, 0, 0);
      
      // We will try to place blocks of prefSessionDuration, or down to minSessionDuration
      let iterTime = new Date(Math.max(workStart.getTime(), now.getTime()));
      
      while (iterTime < workEnd && remaining >= prefs.minSessionDuration) {
        const potentialSession = Math.min(remaining, prefs.prefSessionDuration);
        const iterEnd = new Date(iterTime);
        iterEnd.setMinutes(iterEnd.getMinutes() + potentialSession);
        
        if (iterEnd > workEnd) {
          iterTime = new Date(iterEnd); // Push forward to break loop
          continue;
        }
        
        // Check if [iterTime, iterEnd] overlaps with any blockedTimes or newly suggestedSessions
        const overlapsBlocked = blockedTimes.some(b => 
          (iterTime < b.end && iterEnd > b.start)
        );
        
        const overlapsSuggested = suggestedSessions.some(s => {
          const ss = new Date(s.planned_start);
          const se = new Date(s.planned_end);
          ss.setMinutes(ss.getMinutes() - prefs.bufferDuration);
          se.setMinutes(se.getMinutes() + prefs.bufferDuration);
          return (iterTime < se && iterEnd > ss);
        });
        
        if (!overlapsBlocked && !overlapsSuggested) {
          console.log(`  -> Found free block: ${iterTime.toLocaleTimeString()} to ${iterEnd.toLocaleTimeString()} (duration: ${potentialSession}m)`);
          // Valid block found!
          suggestedSessions.push({
            task_id: tNeed.task.id,
            planned_start: iterTime.toISOString(),
            planned_end: iterEnd.toISOString(),
            status: 'PLANNED'
          });
          remaining -= potentialSession;
          
          iterTime = new Date(iterEnd);
          iterTime.setMinutes(iterTime.getMinutes() + prefs.bufferDuration);
        } else {
          // Advance iterTime by 15 mins to search next slot
          iterTime.setMinutes(iterTime.getMinutes() + 15);
        }
      }
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    if (remaining >= prefs.minSessionDuration) {
      overloadedTasks.push(tNeed.task);
    }
  }

  console.log('\n=== PLANNER RESULT DEBUG ===');
  console.log(`eligible task count: ${taskNeeds.length}`);
  console.log(`proposed session count: ${suggestedSessions.length}`);
  const totalMins = suggestedSessions.reduce((acc, s) => {
    const start = new Date(s.planned_start).getTime();
    const end = new Date(s.planned_end).getTime();
    return acc + Math.round((end - start) / 60000);
  }, 0);
  console.log(`total proposed minutes: ${totalMins}`);
  console.log(`overloaded task count: ${overloadedTasks.length}`);
  if (overloadedTasks.length > 0) {
    console.log(`overloaded tasks: ${overloadedTasks.map(t => t.title).join(', ')}`);
  }
  console.log('============================\n');

  // Final defensive deduplication (proposal-level duplicate protection)
  const uniqueSuggestedSessions: typeof suggestedSessions = [];
  const seenProposed = new Set<string>();
  for (const s of suggestedSessions) {
    const key = `${s.task_id}-${s.planned_start}-${s.planned_end}`;
    if (!seenProposed.has(key)) {
      seenProposed.add(key);
      uniqueSuggestedSessions.push(s);
    }
  }

  return { sessions: uniqueSuggestedSessions, overloadedTasks };
};
