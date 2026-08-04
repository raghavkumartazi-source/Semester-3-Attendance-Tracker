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
      return [];
    }
    return data || [];
  },

  /**
   * Sync a single session change to the cloud.
   * If status is UNMARKED, it deletes the record.
   */
  async syncSingleSession(userId: string, session: Session): Promise<void> {
    if (session.status === 'UNMARKED') {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('user_id', userId)
        .eq('session_id', session.id);
      
      if (error) {
        console.warn('Supabase delete failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      }
      return;
    }

    const { error } = await supabase
      .from('attendance_records')
      .upsert({
        user_id: userId,
        session_id: session.id,
        status: session.status,
        updated_at: new Date(session.updatedAt || Date.now()).toISOString(),
      }, {
        onConflict: 'user_id, session_id'
      });

    if (error) {
      console.warn('Supabase upsert failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
  },

  /**
   * Bulk upload local records that aren't UNMARKED.
   */
  async uploadLocalRecords(userId: string, sessions: Session[]): Promise<void> {
    const recordsToUpload = sessions
      .filter(s => s.status !== 'UNMARKED')
      .map(s => ({
        user_id: userId,
        session_id: s.id,
        status: s.status,
        updated_at: new Date(s.updatedAt || Date.now()).toISOString(),
      }));

    if (recordsToUpload.length === 0) return;

    const { error } = await supabase
      .from('attendance_records')
      .upsert(recordsToUpload, {
        onConflict: 'user_id, session_id'
      });

    if (error) {
      console.warn('Supabase bulk upload failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
  }
};
