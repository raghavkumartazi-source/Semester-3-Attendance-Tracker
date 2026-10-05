import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import type { User } from '@supabase/supabase-js';
import { AttendanceProvider, useAttendance } from '@/components/AttendanceProvider';
import { TaskProvider, useTasks } from '@/components/TaskProvider';
import { createStorage } from '../storage';
import { createTaskStorage } from '../taskStorage';
import type { CloudRecord } from '../sync';
const mocks = vi.hoisted(() => ({ listener: null as null | ((event: string, session: { user: User } | null) => void), getSession: vi.fn(), signOut: vi.fn(), fetch: vi.fn(), upload: vi.fn(), single: vi.fn(), taskUpload: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: {
  getSession: mocks.getSession, signOut: mocks.signOut,
  onAuthStateChange: (listener: typeof mocks.listener) => { mocks.listener = listener; return { data: { subscription: { unsubscribe: vi.fn() } } }; },
} } }));
vi.mock('@/lib/sync', () => ({ syncRepo: { fetchCloudRecords: mocks.fetch, uploadLocalRecords: mocks.upload, syncSingleSession: mocks.single } }));
vi.mock('@/lib/taskSync', () => ({ taskSync: { fetchCloudTasks: async () => [], uploadLocalTasks: mocks.taskUpload, syncSingleTask: async () => {} } }));
vi.mock('@/components/UndoToast', () => ({ default: () => null }));
const user = (id: string) => ({ id } as User);
function Probe() {
  const attendance = useAttendance(); const { tasks } = useTasks(); const session = attendance.sessions[0];
  return <><p data-testid="owner">{attendance.user?.id ?? 'guest'}</p><p data-testid="mark">{session?.status}</p><p data-testid="tasks">{tasks.map(task => task.title).join(',')}</p><button onClick={() => attendance.signOut()}>Sign out</button><button onClick={() => attendance.updateSessionStatus(session.id, 'ABSENT')}>Absent</button></>;
}
const mount = () => render(<AttendanceProvider><TaskProvider><Probe /></TaskProvider></AttendanceProvider>);
function seed(status: 'PRESENT' | 'UNMARKED') {
  const store = createStorage('alice'); const sessions = store.load(); sessions[0] = { ...sessions[0], status, updatedAt: '2026-10-03T12:00:00Z' }; store.save(sessions); return sessions[0];
}
beforeEach(() => {
  vi.stubGlobal('localStorage', new JSDOM('', { url: 'http://localhost' }).window.localStorage);
  mocks.getSession.mockResolvedValue({ data: { session: { user: user('alice') } } });
  mocks.fetch.mockResolvedValue([]); mocks.upload.mockResolvedValue(undefined); mocks.single.mockResolvedValue(undefined); mocks.taskUpload.mockResolvedValue(undefined);
  mocks.signOut.mockImplementation(async () => { mocks.listener?.('SIGNED_OUT', null); return { error: null }; });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });
describe('workspace lifecycle', () => {
  it('remounts nested domains on account change and never uploads prior account data', async () => {
    seed('PRESENT');
    createTaskStorage('alice').importData(JSON.stringify({ type: 'semester_os_tasks', tasks: [{ id: 'task-a', title: 'Alice task', created_at: '2026-10-04', updated_at: '2026-10-04', deleted_at: null }] }));
    mount(); await waitFor(() => expect(screen.getByTestId('mark').textContent).toBe('PRESENT'));
    expect(screen.getByTestId('tasks').textContent).toBe('Alice task');
    await act(async () => mocks.listener?.('SIGNED_IN', { user: user('bob') }));
    await waitFor(() => expect(screen.getByTestId('owner').textContent).toBe('bob'));
    expect(screen.getByTestId('mark').textContent).toBe('UNMARKED'); expect(screen.getByTestId('tasks').textContent).toBe('');
    expect(mocks.upload.mock.calls.filter(([id]) => id === 'bob')).toEqual([]); expect(mocks.taskUpload.mock.calls.filter(([id]) => id === 'bob')).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByTestId('owner').textContent).toBe('guest'));
    expect(screen.getByTestId('mark').textContent).toBe('UNMARKED'); expect(createStorage('alice').load()[0].status).toBe('PRESENT');
  });
  it('ignores a previous account response after switching users', async () => {
    const first = seed('UNMARKED'); let resolve!: (value: CloudRecord[]) => void;
    mocks.fetch.mockImplementationOnce(() => new Promise<CloudRecord[]>(done => { resolve = done; }));
    mount(); await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('alice'));
    await act(async () => mocks.listener?.('SIGNED_IN', { user: user('bob') }));
    await act(async () => resolve([{ user_id: 'alice', session_id: first.id, status: 'PRESENT', updated_at: '2026-10-04T12:00:00Z' }]));
    expect(screen.getByTestId('owner').textContent).toBe('bob'); expect(screen.getByTestId('mark').textContent).toBe('UNMARKED'); expect(createStorage('bob').load()[0].status).toBe('UNMARKED');
  });
  it('preserves an edit made during a pending cloud request', async () => {
    const first = seed('PRESENT'); let resolve!: (value: CloudRecord[]) => void;
    mocks.fetch.mockImplementationOnce(() => new Promise<CloudRecord[]>(done => { resolve = done; }));
    mount(); await waitFor(() => expect(screen.getByTestId('mark').textContent).toBe('PRESENT'));
    fireEvent.click(screen.getByRole('button', { name: 'Absent' }));
    await act(async () => resolve([{ user_id: 'alice', session_id: first.id, status: 'PRESENT', updated_at: '2026-10-04T12:00:00Z' }]));
    expect(screen.getByTestId('mark').textContent).toBe('ABSENT'); expect(createStorage('alice').load()[0].status).toBe('ABSENT');
  });
  it('a newer cloud clear wins and cannot be reuploaded as an old mark', async () => {
    const first = seed('PRESENT'); mocks.fetch.mockResolvedValue([{ user_id: 'alice', session_id: first.id, status: 'UNMARKED', updated_at: '2026-10-04T12:00:00Z' }]);
    mount(); await waitFor(() => expect(createStorage('alice').load()[0].status).toBe('UNMARKED'));
    expect(screen.getByTestId('mark').textContent).toBe('UNMARKED'); expect(mocks.upload).not.toHaveBeenCalled();
  });
});
