import { Subject, TimetableSlot } from './types';

export const MINIMUM_ATTENDANCE = 0.75;

export const SEMESTER_START = '2026-07-23';
export const SEMESTER_END = '2026-11-10';

export const SUBJECTS: Subject[] = [
  { code: 'EC-201', name: 'Solid State Electronic Devices', shortName: 'SSED', lectures: 3, tutorials: 0, practicals: 0 },
  { code: 'EC-202', name: 'Signal & Systems', shortName: 'S&S', lectures: 3, tutorials: 0, practicals: 0 },
  { code: 'EC-203', name: 'Digital Circuits & Systems', shortName: 'DCS', lectures: 3, tutorials: 0, practicals: 0 },
  { code: 'EO-201', name: 'Network Analysis & Synthesis', shortName: 'NAS', lectures: 3, tutorials: 1, practicals: 0 },
  { code: 'MA-201', name: 'Mathematical Methods', shortName: 'Maths', lectures: 3, tutorials: 1, practicals: 0 },
  { code: 'MO-201', name: 'Material Science', shortName: 'MatSci', lectures: 3, tutorials: 0, practicals: 2 },
  { code: 'EO-103', name: 'Basic Electrical Engineering Lab', shortName: 'BEE Lab', lectures: 0, tutorials: 0, practicals: 2 },
  { code: 'HLM', name: 'HLM', shortName: 'HLM', lectures: 0, tutorials: 0, practicals: 0 }, // 0-0-0 implies undefined/unknown
];

// Day: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday
export const TIMETABLE: TimetableSlot[] = [
  // MONDAY
  { day: 1, subjectCode: 'EO-201', startTime: '09:00', endTime: '09:55', classType: 'Lecture' },
  { day: 1, subjectCode: 'HLM', startTime: '10:00', endTime: '10:55', classType: 'Lecture' },
  { day: 1, subjectCode: 'HLM', startTime: '11:00', endTime: '11:55', classType: 'Lecture' },
  { day: 1, subjectCode: 'MO-201', startTime: '17:30', endTime: '18:25', classType: 'Tutorial' },

  // TUESDAY
  { day: 2, subjectCode: 'MA-201', startTime: '08:00', endTime: '08:55', classType: 'Lecture' },
  { day: 2, subjectCode: 'EC-201', startTime: '10:00', endTime: '10:55', classType: 'Lecture' },
  { day: 2, subjectCode: 'EC-203', startTime: '11:00', endTime: '11:55', classType: 'Lecture' },
  { day: 2, subjectCode: 'MO-201', startTime: '12:00', endTime: '12:55', classType: 'Lecture' },
  { day: 2, subjectCode: 'EO-103', startTime: '15:30', endTime: '17:25', classType: 'Lab' },
  { day: 2, subjectCode: 'EC-202', startTime: '17:30', endTime: '18:25', classType: 'Lecture' },

  // WEDNESDAY
  { day: 3, subjectCode: 'MA-201', startTime: '08:00', endTime: '08:55', classType: 'Lecture' },
  { day: 3, subjectCode: 'EC-202', startTime: '10:00', endTime: '10:55', classType: 'Lecture' },
  { day: 3, subjectCode: 'EC-203', startTime: '11:00', endTime: '11:55', classType: 'Lecture' },
  { day: 3, subjectCode: 'MO-201', startTime: '12:00', endTime: '12:55', classType: 'Lecture' },
  { day: 3, subjectCode: 'MA-201', startTime: '15:30', endTime: '16:25', classType: 'Tutorial' },
  { day: 3, subjectCode: 'EO-201', startTime: '16:30', endTime: '17:25', classType: 'Tutorial' },
  { day: 3, subjectCode: 'EC-202', startTime: '17:30', endTime: '18:25', classType: 'Lecture' },

  // THURSDAY
  { day: 4, subjectCode: 'EO-201', startTime: '08:00', endTime: '08:55', classType: 'Lecture' },
  { day: 4, subjectCode: 'EO-201', startTime: '09:00', endTime: '09:55', classType: 'Lecture' },
  { day: 4, subjectCode: 'HLM', startTime: '10:00', endTime: '10:55', classType: 'Lecture' },
  { day: 4, subjectCode: 'HLM', startTime: '11:00', endTime: '11:55', classType: 'Lecture' },

  // FRIDAY
  { day: 5, subjectCode: 'MA-201', startTime: '08:00', endTime: '08:55', classType: 'Lecture' },
  { day: 5, subjectCode: 'EO-201', startTime: '10:00', endTime: '10:55', classType: 'Lecture' },
  { day: 5, subjectCode: 'EC-203', startTime: '11:00', endTime: '11:55', classType: 'Lecture' },
  { day: 5, subjectCode: 'MO-201', startTime: '12:00', endTime: '12:55', classType: 'Lecture' },
  { day: 5, subjectCode: 'EC-202', startTime: '17:30', endTime: '18:25', classType: 'Lecture' },
];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
