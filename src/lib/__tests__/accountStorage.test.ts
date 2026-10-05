import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { createStorage } from '../storage';
import { createTaskStorage } from '../taskStorage';
import { createWorkSessionStorage } from '../workSessionStorage';
import { createMarksStorage } from '../marksStorage';
import { createPlannerStorage } from '../plannerStorage';
import { accountStorageKey } from '../accountStorage';

describe('account-scoped offline data', () => {
  beforeEach(() => vi.stubGlobal('localStorage', new JSDOM('', { url: 'http://localhost' }).window.localStorage));
  it('keeps offline marks and timestamps on reload, including clears', () => {
    const store = createStorage('alice');
    const sessions = store.load();
    sessions[0] = { ...sessions[0], status: 'UNMARKED', updatedAt: '2026-10-05T10:00:00Z' };
    sessions[1] = { ...sessions[1], status: 'PRESENT', updatedAt: '2026-10-05T11:00:00Z' };
    store.save(sessions);
    expect(store.load()[0]).toMatchObject(sessions[0]);
    expect(store.load()[1]).toMatchObject(sessions[1]);
    expect(createStorage('bob').load().every(session => !session.updatedAt && session.status === 'UNMARKED')).toBe(true);
  });
  it('does not claim guest or ambiguous legacy attendance on sign-in', () => {
    const sessions = createStorage(null).load();
    sessions[0].status = 'PRESENT';
    createStorage(null).save(sessions);
    localStorage.setItem('attendance-tracker-v1', JSON.stringify({ sessions, version: 2 }));
    expect(createStorage('alice').load()[0].status).toBe('UNMARKED');
    expect(createStorage(null).load()[0].status).toBe('PRESENT');
  });
  it('isolates all domains, including writes from a previously mounted account', () => {
    const factories = [createTaskStorage, createWorkSessionStorage];
    for (const factory of factories) {
      const a = factory('alice');
      // Deliberately opaque data tests storage identity rather than domain validation.
      a.importData(JSON.stringify({ type: factory === createTaskStorage ? 'semester_os_tasks' : 'semester_os_sessions', tasks: [{ id: 'a' }], sessions: [{ id: 'a' }] }));
      expect(factory('bob').load()).toEqual([]);
      a.reset();
      expect(factory('bob').load()).toEqual([]);
    }
    createMarksStorage('alice').importData('{"components":[{"id":"a"}]}');
    expect(createMarksStorage('bob').loadComponents()).toEqual([]);
    createPlannerStorage('alice').importData('{"topics":[{"id":"a"}]}');
    expect(createPlannerStorage('bob').loadTopics()).toEqual([]);
  });
  it('includes the semester and cannot collide with the guest owner', () => {
    expect(accountStorageKey('x', 'guest')).not.toBe(accountStorageKey('x', null));
    expect(accountStorageKey('x', 'alice', 'semester-1')).not.toBe(accountStorageKey('x', 'alice', 'semester-2'));
  });
});
