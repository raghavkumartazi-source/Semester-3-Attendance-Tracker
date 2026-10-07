import { supabase } from './supabase';
import { Session } from './types';

export interface CloudRecord {
  user_id: string;
  session_id: string;
  status: string;
  updated_at: string;
}

export const syncRepo = {
  /**
   * Fetch all cloud records for a user.
   */
  async fetchCloudRecords(userId: string): Promise<CloudRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase fetch failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    return data || [];
  },

  /**
   * Sync a single session change to the cloud.
   * UNMARKED is retained with its timestamp so offline undo survives a resync.
   */
  async syncSingleSession(userId: string, session: Session): Promise<void> {
    const { error } = await supabase
      .from('attendance_records')
      .upsert({
        user_id: userId,
        session_id: session.id,
        status: session.status,
        updated_at: new Date(session.updatedAt || Date.now()).toISOString(),
      });

    if (error) {
      console.warn('Supabase upsert failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
  },

  /**
   * Upload marked records and timestamped undo records, leaving untouched slots local.
   */
  async uploadLocalRecords(userId: string, sessions: Session[]): Promise<void> {
    const recordsToUpload = sessions
      .filter(s => s.status !== 'UNMARKED' || s.updatedAt)
      .map(s => ({
        user_id: userId,
        session_id: s.id,
        status: s.status,
        updated_at: new Date(s.updatedAt || Date.now()).toISOString(),
      }));

    if (recordsToUpload.length === 0) return;

    const { error } = await supabase
      .from('attendance_records')
      .upsert(recordsToUpload);

    if (error) {
      console.warn('Supabase bulk upload failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
  }
};
