import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkComponent, Session } from '../types';

const api = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), upsert: vi.fn(), delete: vi.fn() }));
vi.mock('../supabase', () => ({ supabase: { from: api.from } }));

import { marksSync } from '../marksSync';
import { syncRepo } from '../sync';

beforeEach(() => {
  vi.clearAllMocks();
  api.from.mockReturnValue(api);
  api.select.mockReturnValue(api);
  api.eq.mockReturnValue(api);
  api.order.mockResolvedValue({ data: [], error: null });
  api.upsert.mockResolvedValue({ error: null });
});

const mark: MarkComponent = {
  id: 'assessment', subject_code: 'EC-201', component_type: 'QUIZ', component_name: 'Quiz 1',
  weightage: 10, scored: 7, max_marks: 10, date: null, is_published: true, notes: null,
  created_at: '2026-10-06T12:00:00Z', updated_at: '2026-10-07T12:00:00Z', deleted_at: '2026-10-07T12:00:00Z',
};

describe('cloud recovery contracts', () => {
  it('attaches the signed-in owner to a local assessment and retains soft deletion', async () => {
    await marksSync.syncSingleComponent('signed-in-user', mark);
    expect(api.upsert.mock.calls[0][0]).toMatchObject({ user_id: 'signed-in-user', deleted_at: mark.deleted_at, scored: 7 });
  });

  it('returns cloud tombstones so another device can remove the deleted assessment', async () => {
    api.order.mockResolvedValue({ data: [{ ...mark, user_id: 'signed-in-user' }], error: null });
    const records = await marksSync.fetchCloudComponents('signed-in-user');
    expect(records[0]).toMatchObject({ id: mark.id, deleted_at: mark.deleted_at });
    expect(api.eq).toHaveBeenCalledWith('user_id', 'signed-in-user');
  });

  it('uploads timestamped undo and never physically deletes an attendance record', async () => {
    const session: Session = { id: 'class', subjectCode: 'EC-201', date: '2026-10-07', day: 3, startTime: '09:00', endTime: '09:55', classType: 'Lecture', isExtra: false, status: 'UNMARKED', updatedAt: '2026-10-07T12:00:00Z' };
    await syncRepo.syncSingleSession('signed-in-user', session);
    expect(api.delete).not.toHaveBeenCalled();
    expect(api.upsert.mock.calls[0][0]).toMatchObject({ session_id: 'class', status: 'UNMARKED', updated_at: '2026-10-07T12:00:00.000Z' });
    api.upsert.mockClear();
    await syncRepo.uploadLocalRecords('signed-in-user', [session, { ...session, id: 'untouched-slot', updatedAt: undefined }]);
    expect(api.upsert.mock.calls[0][0]).toHaveLength(1);
  });
});
