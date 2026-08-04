// Types for the attendance tracker application

export type AttendanceStatus = 'UNMARKED' | 'PRESENT' | 'ABSENT' | 'CANCELLED';

export type ClassType = 'Lecture' | 'Tutorial' | 'Lab';

export type AttendanceLevel = 'SAFE' | 'WARNING' | 'DANGER' | 'NO_DATA';

export interface Subject {
  code: string;
  name: string;
  shortName: string;
  lectures: number;
  tutorials: number;
  practicals: number;
}

export interface TimetableSlot {
  day: number; // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  subjectCode: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  classType: ClassType;
}

export interface Session {
  id: string;
  subjectCode: string;
  date: string;       // "YYYY-MM-DD"
  day: number;        // 0-6
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  classType: ClassType;
  status: AttendanceStatus;
  isExtra: boolean;
  updatedAt?: number;
}

export interface SubjectAttendance {
  present: number;
  absent: number;
  cancelled: number;
  unmarked: number;
  totalConducted: number;
  percentage: number | null;
  canBunk: number;
  needToAttend: number;
  level: AttendanceLevel;
}

export interface OverallAttendance {
  totalPresent: number;
  totalAbsent: number;
  totalConducted: number;
  percentage: number | null;
  level: AttendanceLevel;
}

export type SortOrder = 'lowest' | 'highest' | 'code';

export type TaskType = 'STUDY' | 'ASSIGNMENT' | 'PRACTICE' | 'REVISION' | 'PROJECT' | 'QUIZ_PREP' | 'OTHER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  subject_id: string | null;
  type: TaskType;
  due_at: string | null; // ISO string
  priority: TaskPriority;
  completed: boolean;
  completed_at: string | null; // ISO string
  deleted_at: string | null; // ISO string for tombstones
  notes: string | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}
