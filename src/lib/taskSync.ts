import { supabase } from './supabase';
import { Task } from './types';

export class TaskSyncError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'TaskSyncError';
  }
}

export const taskSync = {
  fetchCloudTasks: async (userId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new TaskSyncError('Failed to fetch tasks from cloud', error);
    }

    return (data || []) as Task[];
  },

  uploadLocalTasks: async (userId: string, tasks: Task[]): Promise<void> => {
    if (tasks.length === 0) return;

    const records = tasks.map(t => ({
      ...t,
      user_id: userId
    }));

    const { error } = await supabase
      .from('tasks')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      throw new TaskSyncError('Failed to upload local tasks', error);
    }
  },

  syncSingleTask: async (userId: string, task: Task): Promise<void> => {
    const record = {
      ...task,
      user_id: userId
    };

    const { error } = await supabase
      .from('tasks')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      throw new TaskSyncError('Failed to sync task', error);
    }
  }
};
