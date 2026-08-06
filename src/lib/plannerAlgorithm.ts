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

  const incompleteTasks = tasks.filter(t => {
    if (t.completed) return false;
    if (t.deleted_at) return false;
    if (!t.estimated_minutes) return false;
    if (!t.due_at) return false;
    return true;
  });

  if (incompleteTasks.length === 0) return { sessions: [], overloadedTasks: [] };
  
  // Calculate remaining effort for each task (only PLANNED sessions count)
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

  // Sort tasks by priority × urgency (overdue tasks float to top)
  taskNeeds.sort((a, b) => {
    const isOverdueA = a.dueDate.getTime() < now.getTime();
    const isOverdueB = b.dueDate.getTime() < now.getTime();
    
    if (isOverdueA && !isOverdueB) return -1;
    if (isOverdueB && !isOverdueA) return 1;

    const daysA = Math.max(0, (a.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysB = Math.max(0, (b.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const pWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const pA = pWeight[a.task.priority];
    const pB = pWeight[b.task.priority];
    
    const scoreA = (10 / (daysA + 1)) * pA;
    const scoreB = (10 / (daysB + 1)) * pB;
    
    return scoreB - scoreA; // descending
  });

  // Prepare existing commitments as blocked time ranges
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

  // Schedule sessions for each task (14-day lookahead)
  for (const tNeed of taskNeeds) {
    let remaining = tNeed.remainingMinutes;
    const currentDay = new Date(now);
    currentDay.setHours(0, 0, 0, 0);
    
    // For overdue tasks, schedule before a virtual deadline of 14 days
    const isOverdue = tNeed.dueDate.getTime() < now.getTime();
    const deadline = isOverdue ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : new Date(tNeed.dueDate);
    deadline.setHours(23, 59, 59, 999);
    
    while (remaining > 0 && currentDay <= deadline && currentDay.getTime() < now.getTime() + 14 * 24 * 60 * 60 * 1000) {
      const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
      const startStr = isWeekend ? prefs.weekendWorkStart : prefs.weekdayWorkStart;
      const endStr = isWeekend ? prefs.weekendWorkEnd : prefs.weekdayWorkEnd;
      
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);
      
      const workStart = new Date(currentDay);
      workStart.setHours(sh, sm, 0, 0);
      
      const workEnd = new Date(currentDay);
      workEnd.setHours(eh, em, 0, 0);
      
      // Adaptive session scheduling
      let iterTime = new Date(Math.max(workStart.getTime(), now.getTime()));
      
      while (iterTime < workEnd && remaining > 0) {
        // Compile all active blocks (static + newly suggested sessions)
        const activeBlocks: TimeBlock[] = [...blockedTimes];
        
        suggestedSessions.forEach(s => {
          const ss = new Date(s.planned_start);
          const se = new Date(s.planned_end);
          ss.setMinutes(ss.getMinutes() - prefs.bufferDuration);
          se.setMinutes(se.getMinutes() + prefs.bufferDuration);
          activeBlocks.push({ start: ss, end: se });
        });

        // 1. Is iterTime currently inside a blocked region? Skip past it.
        const currentBlock = activeBlocks.find(b => iterTime >= b.start && iterTime < b.end);
        if (currentBlock) {
          iterTime = new Date(currentBlock.end);
          continue;
        }

        // 2. Find the NEXT blocking event boundary
        const futureBlocks = activeBlocks.filter(b => b.start > iterTime);
        const nextBlockStart = futureBlocks.length > 0
          ? new Date(Math.min(...futureBlocks.map(b => b.start.getTime())))
          : null;

        const endBounds = [workEnd.getTime(), deadline.getTime()];
        if (nextBlockStart) {
          endBounds.push(nextBlockStart.getTime());
        }

        const nextLimitTime = new Date(Math.min(...endBounds));

        // 3. Calculate available minutes until the next limit
        const availableMinutes = Math.floor((nextLimitTime.getTime() - iterTime.getTime()) / 60000);

        if (availableMinutes <= 0) {
          if (nextBlockStart && iterTime.getTime() === nextBlockStart.getTime()) {
            iterTime.setMinutes(iterTime.getMinutes() + 1);
            continue;
          } else {
            break; // Hit workEnd or deadline
          }
        }

        // 4. Calculate adaptive session size
        let sessionMinutes = Math.min(
          remaining,
          prefs.prefSessionDuration,
          availableMinutes
        );

        // 5. Small-remainder rebalancing
        // If scheduling sessionMinutes would leave a remainder that's > 0 but < minSessionDuration,
        // shrink the current session so the remainder becomes exactly minSessionDuration.
        const remainderAfterSession = remaining - sessionMinutes;
        
        if (remainderAfterSession > 0 && remainderAfterSession < prefs.minSessionDuration) {
          const deficit = prefs.minSessionDuration - remainderAfterSession;
          const rebalancedSession = sessionMinutes - deficit;
          
          if (rebalancedSession >= prefs.minSessionDuration) {
            sessionMinutes = rebalancedSession;
          }
          // If rebalancing would make this session too small, keep original size.
          // The remainder will be flagged as overloaded.
        }

        // 6. Create session if it meets minimum threshold
        if (sessionMinutes >= prefs.minSessionDuration) {
          const iterEnd = new Date(iterTime);
          iterEnd.setMinutes(iterEnd.getMinutes() + sessionMinutes);
          
          suggestedSessions.push({
            task_id: tNeed.task.id,
            planned_start: iterTime.toISOString(),
            planned_end: iterEnd.toISOString(),
            status: 'PLANNED'
          });
          remaining -= sessionMinutes;
          
          iterTime = new Date(iterEnd);
          iterTime.setMinutes(iterTime.getMinutes() + prefs.bufferDuration);
        } else {
          // Slot too small — skip past the limit
          iterTime = new Date(nextLimitTime);
          if (nextBlockStart && nextLimitTime.getTime() === nextBlockStart.getTime()) {
            iterTime.setMinutes(iterTime.getMinutes() + 1);
          }
        }
      }
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    // Strict overload: any remaining effort means the task is overloaded
    if (remaining > 0) {
      overloadedTasks.push(tNeed.task);
    }
  }

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

  // Concise production log
  const totalMins = uniqueSuggestedSessions.reduce((acc, s) => {
    return acc + Math.round((new Date(s.planned_end).getTime() - new Date(s.planned_start).getTime()) / 60000);
  }, 0);
  console.log(`[SmartPlanner] ${taskNeeds.length} eligible → ${uniqueSuggestedSessions.length} sessions (${totalMins}m)${overloadedTasks.length > 0 ? ` | ${overloadedTasks.length} overloaded` : ''}`);

  return { sessions: uniqueSuggestedSessions, overloadedTasks };
};
