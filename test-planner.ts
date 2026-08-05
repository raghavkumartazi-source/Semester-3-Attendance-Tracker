import { generateSmartPlan } from './src/lib/plannerAlgorithm';
import { DEFAULT_PLANNER_PREFERENCES } from './src/lib/plannerPreferences';

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(23, 59, 59, 999);

const tasks = [
  {
    id: 'test-task-1',
    title: 'Test Task HIGH Priority',
    completed: false,
    deleted_at: null,
    due_at: tomorrow.toISOString(),
    estimated_minutes: 120,
    priority: 'HIGH' as const,
    type: 'STUDY' as const,
    user_id: 'test-user',
    subject_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    notes: null
  }
];

const workSessions: any[] = [];
const classSessions: any[] = [];

console.log('Running test...');
generateSmartPlan(tasks as any, classSessions, workSessions, DEFAULT_PLANNER_PREFERENCES);
