import type { ScheduleCategory, ScheduleTemplate } from '@/types';
import { DEFAULT_USER_ID } from './personalPlan';

export interface ClassSlotDefinition {
  slot: string;
  startTime: string;
  endTime: string;
  label: string;
  isBreak?: boolean;
}

export const COLLEGE_CLASS_SLOTS: ClassSlotDefinition[] = [
  { slot: '1', startTime: '08:00', endTime: '08:50', label: '08:00–08:50 AM' },
  { slot: '2', startTime: '08:50', endTime: '09:40', label: '08:50–09:40 AM' },
  { slot: '3', startTime: '09:40', endTime: '10:30', label: '09:40–10:30 AM' },
  { slot: 'Break', startTime: '10:30', endTime: '10:45', label: '10:30–10:45 AM', isBreak: true },
  { slot: '4', startTime: '10:45', endTime: '11:35', label: '10:45–11:35 AM' },
  { slot: '5', startTime: '11:35', endTime: '12:25', label: '11:35 AM–12:25 PM' },
  { slot: '6', startTime: '12:25', endTime: '13:15', label: '12:25–01:15 PM' },
  { slot: 'Lunch', startTime: '13:15', endTime: '14:05', label: '01:15–02:05 PM', isBreak: true },
  { slot: '8', startTime: '14:05', endTime: '14:55', label: '02:05–02:55 PM' },
  { slot: '9', startTime: '14:55', endTime: '15:45', label: '02:55–03:45 PM' },
  { slot: '10', startTime: '15:45', endTime: '16:35', label: '03:45–04:35 PM' },
  { slot: '11', startTime: '16:35', endTime: '17:25', label: '04:35–05:25 PM' },
  { slot: '12', startTime: '17:25', endTime: '18:15', label: '05:25–06:15 PM' },
];

interface RawTimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectCode?: string;
  title: string;
  subtitle?: string;
  location?: string;
  category: ScheduleCategory;
}

const RAW_TIMETABLE: RawTimetableEntry[] = [
  // Monday (1)
  {
    id: 'college-mon-1',
    dayOfWeek: 1,
    startTime: '08:50',
    endTime: '10:30',
    subjectCode: '23CSE312',
    title: 'Distributed Systems Lab',
    category: 'lab',
  },
  {
    id: 'college-mon-break',
    dayOfWeek: 1,
    startTime: '10:30',
    endTime: '10:45',
    title: 'Short Break',
    category: 'break',
  },
  {
    id: 'college-mon-2',
    dayOfWeek: 1,
    startTime: '10:45',
    endTime: '11:35',
    subjectCode: '23CSE311',
    title: 'Software Engineering',
    category: 'class',
  },
  {
    id: 'college-mon-3',
    dayOfWeek: 1,
    startTime: '11:35',
    endTime: '12:25',
    subjectCode: '23CSE313',
    title: 'Foundations of Cyber Security',
    category: 'class',
  },
  {
    id: 'college-mon-4',
    dayOfWeek: 1,
    startTime: '12:25',
    endTime: '13:15',
    title: 'Professional Elective III',
    category: 'class',
  },
  {
    id: 'college-mon-lunch',
    dayOfWeek: 1,
    startTime: '13:15',
    endTime: '14:05',
    title: 'Lunch',
    category: 'break',
  },
  {
    id: 'college-mon-5',
    dayOfWeek: 1,
    startTime: '14:05',
    endTime: '14:55',
    subjectCode: '23CSE314',
    title: 'Compiler Design',
    category: 'class',
  },
  {
    id: 'college-mon-6',
    dayOfWeek: 1,
    startTime: '14:55',
    endTime: '16:35',
    subjectCode: '23CSE399',
    title: 'Project Phase-I',
    category: 'project',
  },

  // Tuesday (2)
  {
    id: 'college-tue-1',
    dayOfWeek: 2,
    startTime: '09:40',
    endTime: '10:30',
    subjectCode: '23CSE314',
    title: 'Compiler Design',
    category: 'class',
  },
  {
    id: 'college-tue-break',
    dayOfWeek: 2,
    startTime: '10:30',
    endTime: '10:45',
    title: 'Short Break',
    category: 'break',
  },
  {
    id: 'college-tue-2',
    dayOfWeek: 2,
    startTime: '10:45',
    endTime: '11:35',
    subjectCode: '23CSE312',
    title: 'Distributed Systems',
    category: 'class',
  },
  {
    id: 'college-tue-3',
    dayOfWeek: 2,
    startTime: '11:35',
    endTime: '12:25',
    subjectCode: '23CSE313',
    title: 'Foundations of Cyber Security',
    category: 'class',
  },
  {
    id: 'college-tue-4',
    dayOfWeek: 2,
    startTime: '12:25',
    endTime: '13:15',
    subjectCode: '23CSE311',
    title: 'Software Engineering',
    category: 'class',
  },
  {
    id: 'college-tue-lunch',
    dayOfWeek: 2,
    startTime: '13:15',
    endTime: '14:05',
    title: 'Lunch',
    category: 'break',
  },
  {
    id: 'college-tue-5',
    dayOfWeek: 2,
    startTime: '14:05',
    endTime: '16:35',
    title: 'CIR',
    category: 'cir',
  },

  // Wednesday (3)
  {
    id: 'college-wed-1',
    dayOfWeek: 3,
    startTime: '08:50',
    endTime: '10:30',
    subjectCode: '23CSE314',
    title: 'Compiler Design Lab',
    category: 'lab',
  },
  {
    id: 'college-wed-break',
    dayOfWeek: 3,
    startTime: '10:30',
    endTime: '10:45',
    title: 'Short Break',
    category: 'break',
  },
  {
    id: 'college-wed-2',
    dayOfWeek: 3,
    startTime: '10:45',
    endTime: '11:35',
    subjectCode: '23CSE311',
    title: 'Software Engineering (ACHALA)',
    category: 'class',
  },
  {
    id: 'college-wed-3',
    dayOfWeek: 3,
    startTime: '11:35',
    endTime: '12:25',
    title: 'Mentoring',
    subtitle: 'Dr. N. Radhika',
    location: 'Respective Cabin',
    category: 'mentoring',
  },
  {
    id: 'college-wed-4',
    dayOfWeek: 3,
    startTime: '12:25',
    endTime: '13:15',
    title: 'Professional Elective III',
    category: 'class',
  },
  {
    id: 'college-wed-lunch',
    dayOfWeek: 3,
    startTime: '13:15',
    endTime: '14:05',
    title: 'Lunch',
    category: 'break',
  },
  {
    id: 'college-wed-5',
    dayOfWeek: 3,
    startTime: '14:05',
    endTime: '14:55',
    subjectCode: '23CSE312',
    title: 'Distributed Systems',
    category: 'class',
  },
  {
    id: 'college-wed-6',
    dayOfWeek: 3,
    startTime: '14:55',
    endTime: '15:45',
    subjectCode: '23CSE314',
    title: 'Compiler Design',
    category: 'class',
  },

  // Thursday (4) — No other classes scheduled after lunch
  {
    id: 'college-thu-1',
    dayOfWeek: 4,
    startTime: '08:50',
    endTime: '09:40',
    title: 'Professional Elective III',
    category: 'class',
  },
  {
    id: 'college-thu-break',
    dayOfWeek: 4,
    startTime: '10:30',
    endTime: '10:45',
    title: 'Short Break',
    category: 'break',
  },
  {
    id: 'college-thu-2',
    dayOfWeek: 4,
    startTime: '11:35',
    endTime: '13:15',
    subjectCode: '23CSE311',
    title: 'Software Engineering Lab',
    category: 'lab',
  },

  // Friday (5)
  {
    id: 'college-fri-1',
    dayOfWeek: 5,
    startTime: '08:50',
    endTime: '09:40',
    title: 'Mentoring',
    subtitle: 'Ms. G. Radhika',
    location: 'Respective Cabin',
    category: 'mentoring',
  },
  {
    id: 'college-fri-2',
    dayOfWeek: 5,
    startTime: '09:40',
    endTime: '10:30',
    subjectCode: '23CSE312',
    title: 'Distributed Systems',
    category: 'class',
  },
  {
    id: 'college-fri-break',
    dayOfWeek: 5,
    startTime: '10:30',
    endTime: '10:45',
    title: 'Short Break',
    category: 'break',
  },
  {
    id: 'college-fri-3',
    dayOfWeek: 5,
    startTime: '11:35',
    endTime: '12:25',
    subjectCode: '23CSE313',
    title: 'Foundations of Cyber Security',
    category: 'class',
  },
  {
    id: 'college-fri-lunch',
    dayOfWeek: 5,
    startTime: '13:15',
    endTime: '14:05',
    title: 'Lunch',
    category: 'break',
  },
  {
    id: 'college-fri-4',
    dayOfWeek: 5,
    startTime: '14:05',
    endTime: '16:35',
    subjectCode: '23CSE399',
    title: 'Project Phase-I',
    category: 'project',
  },
];

export function createDefaultCollegeTemplates(nowIso: string): ScheduleTemplate[] {
  return RAW_TIMETABLE.map((item) => ({
    id: item.id,
    userId: DEFAULT_USER_ID,
    source: 'college',
    category: item.category,
    dayOfWeek: item.dayOfWeek,
    subjectCode: item.subjectCode,
    title: item.title,
    subtitle: item.subtitle,
    location: item.location,
    startTime: item.startTime,
    endTime: item.endTime,
    isActive: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  }));
}
