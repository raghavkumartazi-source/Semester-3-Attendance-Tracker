// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateReverseCountdownPlan } from '../calculations';
import type { PlannerConfig, SyllabusTopic } from '../types';

const stamp = '2026-10-09T12:00:00.000Z';
const config: PlannerConfig = {
  id: 'plan-settings', subject_code: 'EC-201', target_exam_date: '2026-10-20',
  buffer_days: 2, revision_cycles: 1, daily_study_hours: 2,
  preferred_session_length_minutes: 60, break_between_sessions_minutes: 10,
  weak_topic_extra_time_multiplier: 1.5, created_at: stamp, updated_at: stamp,
};
const topic: SyllabusTopic = {
  id: 'topic-1', subject_code: 'EC-201', topic_code: 'UNIT-1',
  topic_name: 'Semiconductor junctions', unit_number: 1, estimated_hours: 2.5,
  difficulty: 3, weightage_estimate: 25, is_core: true, order_in_subject: 1,
  prerequisites: [], created_at: stamp, updated_at: stamp,
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('reverse countdown local calendar dates', () => {
  it('counts exam days and milestones using the local day in India near midnight', () => {
    vi.stubEnv('TZ', 'Asia/Kolkata');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-09T18:00:00.000Z')); // 23:30 in India
    expect(new Date().getTimezoneOffset()).toBe(-330);

    const result = generateReverseCountdownPlan('EC-201', [topic], [], [], config);

    expect(result.days_remaining).toBe(11);
    expect(result.study_days_available).toBe(9);
    expect(result.daily_plan[0].plan_date).toBe('2026-10-09');
    expect(result.milestones.map(milestone => milestone.date)).toEqual(['2026-10-14', '2026-10-18']);
  });

  it('assigns split sessions to successive local dates and stops before exam day', () => {
    vi.stubEnv('TZ', 'Asia/Kolkata');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T20:00:00.000Z')); // 01:30 on 9 October in India
    expect(new Date().getDate()).toBe(9);

    const result = generateReverseCountdownPlan('EC-201', [topic], [], [], { ...config, buffer_days: 0, target_exam_date: '2026-10-12' });
    expect(result.daily_plan.map(session => session.plan_date)).toEqual(['2026-10-09', '2026-10-10', '2026-10-11']);
    expect(result.daily_plan.map(session => session.planned_hours)).toEqual([1, 1, .5]);

    const shortened = generateReverseCountdownPlan('EC-201', [topic], [], [], { ...config, buffer_days: 0, target_exam_date: '2026-10-11' });
    expect(shortened.daily_plan.map(session => session.plan_date)).toEqual(['2026-10-09', '2026-10-10']);
  });

  it('keeps dates successive across the daylight-saving transition west of UTC', () => {
    vi.stubEnv('TZ', 'America/New_York');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T03:30:00.000Z')); // 23:30 on 31 October in New York
    expect(new Date().getDate()).toBe(31);
    const result = generateReverseCountdownPlan('EC-201', [{ ...topic, estimated_hours: 3.5 }], [], [], { ...config, buffer_days: 0, target_exam_date: '2026-11-04' });
    expect(result.days_remaining).toBe(4);
    expect(result.daily_plan.map(session => session.plan_date)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03']);
  });

  it('keeps buffer days free and generates no sessions when no study days are available', () => {
    vi.stubEnv('TZ', 'Asia/Kolkata');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-09T05:00:00.000Z'));
    const longTopic = { ...topic, estimated_hours: 10 };
    const buffered = generateReverseCountdownPlan('EC-201', [longTopic], [], [], { ...config, target_exam_date: '2026-10-13', buffer_days: 2 });
    expect(buffered.study_days_available).toBe(2);
    expect(buffered.daily_plan.map(session => session.plan_date)).toEqual(['2026-10-09', '2026-10-10']);
    expect(buffered.milestones[1].date).toBe('2026-10-11');

    const unavailable = generateReverseCountdownPlan('EC-201', [longTopic], [], [], { ...config, target_exam_date: '2026-10-11', buffer_days: 2 });
    expect(unavailable.study_days_available).toBe(0);
    expect(unavailable.daily_plan).toEqual([]);
    expect(unavailable.warnings.some(warning => warning.includes('No study days available'))).toBe(true);
  });
});
