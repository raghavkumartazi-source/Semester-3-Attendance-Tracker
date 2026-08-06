import { describe, it, expect, vi } from 'vitest';
import { generateSmartPlan } from '../plannerAlgorithm';
import { Task, WorkSession, Session } from '../types';
import { PlannerPreferences } from '../plannerPreferences';

describe('plannerAlgorithm - deterministic planner tests', () => {
  const prefs: PlannerPreferences = {
    weekdayWorkStart: '17:00',
    weekdayWorkEnd: '22:00',
    weekendWorkStart: '10:00',
    weekendWorkEnd: '20:00',
    minSessionDuration: 30,
    prefSessionDuration: 60,
    bufferDuration: 0
  };

  // Helper to create a base task
  const makeBaseTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    title: 'Test',
    type: 'ASSIGNMENT' as const,
    subject_id: 'SUB-1',
    priority: 'HIGH' as const,
    completed: false,
    completed_at: null,
    deleted_at: null,
    notes: null,
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    estimated_minutes: 120,
    due_at: null,
    ...overrides
  });

  // Helper to create a work session
  const makeWorkSession = (overrides: Partial<WorkSession> = {}): WorkSession => ({
    id: 'ws-1',
    user_id: 'user-1',
    task_id: 'task-1',
    planned_start: new Date().toISOString(),
    planned_end: new Date().toISOString(),
    status: 'PLANNED' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    ...overrides
  });





  // Utility to test specific free time scenarios
  const testScenario = (name: string, estimated: number, freeMinutes: number, expectedSessionDuration: number | 'rejected', extraBlock?: { start: number; end: number }) => {
    it(name, () => {
      // Use a fixed "now" for deterministic tests - 10:00 local on Day 0 (before work window)
      // India is UTC+5:30, so 10:00 local = 04:30 UTC
      // Deadline is end of Day 1 (next weekday) - this gives a full day of planning
      const fixedNow = new Date('2026-01-01T04:30:00.000Z'); // Day 0, 10:00 local
      vi.setSystemTime(fixedNow);

      try {
        // Use fixedNow date for testing the daily window constraints
        const targetDay = new Date(fixedNow);
        targetDay.setHours(0, 0, 0, 0);

        const deadlineEnd = new Date(targetDay);
        deadlineEnd.setHours(23, 59, 59, 999);

        const task = makeBaseTask({
          estimated_minutes: estimated,
          due_at: deadlineEnd.toISOString()
        });

        // The window on targetDay is 17:00 to 22:00 (300 minutes total)
        // To leave exactly `freeMinutes` at the start, we block from (17:00 + freeMinutes) to 22:00.
        const blockStart = new Date(targetDay);
        blockStart.setHours(17, 0, 0, 0);
        blockStart.setMinutes(blockStart.getMinutes() + freeMinutes);

        const blockEnd = new Date(targetDay);
        blockEnd.setHours(22, 0, 0, 0);

        const classSessions: Session[] = [];
        const workSessions: WorkSession[] = [];

        if (freeMinutes < 300) {
          workSessions.push(makeWorkSession({
            id: 'ws-block',
            task_id: 'other',
            planned_start: blockStart.toISOString(),
            planned_end: blockEnd.toISOString()
          }));
        }

        if (extraBlock) {
          const extraStart = new Date(targetDay);
          extraStart.setHours(17, 0, 0, 0);
          extraStart.setMinutes(extraStart.getMinutes() + extraBlock.start);
          const extraEnd = new Date(targetDay);
          extraEnd.setHours(17, 0, 0, 0);
          extraEnd.setMinutes(extraEnd.getMinutes() + extraBlock.end);

          workSessions.push(makeWorkSession({
            id: 'ws-extra',
            task_id: 'other',
            planned_start: extraStart.toISOString(),
            planned_end: extraEnd.toISOString()
          }));
        }

        const result = generateSmartPlan([task], classSessions, workSessions, prefs);

        const sessions = result.sessions;
        if (expectedSessionDuration === 'rejected') {
          expect(sessions.length).toBe(0);
        } else {
          expect(sessions.length).toBeGreaterThan(0);
          const s1 = sessions[0];
          const duration = (new Date(s1.planned_end).getTime() - new Date(s1.planned_start).getTime()) / 60000;
          expect(duration).toBe(expectedSessionDuration);
        }
      } finally {
        vi.useRealTimers();
      }
    });
  };

  testScenario('60m free / 60 preferred / 30 min -> 60m', 120, 60, 60);
  testScenario('45m free / 60 preferred / 30 min -> 45m', 120, 45, 45);
  testScenario('30m free -> 30m', 120, 30, 30);
  testScenario('29m free -> rejected', 120, 29, 'rejected');

  // existing WorkSession cuts block below 30m -> rejected
  // We want a free block of 60m, but an extra WorkSession at +20m cuts the first block to 20m.
  testScenario('existing WorkSession cuts block below 30m -> rejected', 120, 60, 'rejected', { start: 20, end: 60 });
});