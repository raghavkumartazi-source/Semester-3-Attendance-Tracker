import { supabase } from './supabase';
import { WorkSession } from './types';

export class SessionSyncError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'SessionSyncError';
  }
}

export const workSessionSync = {
  fetchCloudSessions: async (userId: string): Promise<WorkSession[]> => {
    const { data, error } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new SessionSyncError('Failed to fetch sessions from cloud', error);
    }

    return (data || []) as WorkSession[];
  },

  uploadLocalSessions: async (userId: string, sessions: WorkSession[]): Promise<void> => {
    if (sessions.length === 0) return;

    const records = sessions.map(s => ({
      ...s,
      user_id: userId
    }));

    const { error } = await supabase
      .from('work_sessions')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      throw new SessionSyncError('Failed to upload local sessions', error);
    }
  },

  syncSingleSession: async (userId: string, session: WorkSession): Promise<void> => {
    const record = {
      ...session,
      user_id: userId
    };

    const { error } = await supabase
      .from('work_sessions')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      throw new SessionSyncError('Failed to sync session', error);
    }
  }
};
