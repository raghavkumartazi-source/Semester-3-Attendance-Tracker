import { SEMESTER_START, SEMESTER_END } from './config';

/** No implicit migration: legacy/guest records never become another user's data. */
export function accountStorageKey(key: string, ownerId: string | null, semester = `${SEMESTER_START}_${SEMESTER_END}`): string {
  return `${key}:${encodeURIComponent(semester)}:${ownerId ? `user:${encodeURIComponent(ownerId)}` : 'guest'}`;
}
