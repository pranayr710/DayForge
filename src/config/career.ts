import type { MastersMilestone, PlacementTopicRecord } from '@/types';
import { DEFAULT_USER_ID } from './personalPlan';

export interface PlacementDayRotation {
  dayOfWeek: number;
  dayName: string;
  focus: string;
  defaultTopics: string[];
}

export const PLACEMENT_WEEKLY_ROTATION: PlacementDayRotation[] = [
  { dayOfWeek: 1, dayName: 'Monday', focus: 'OOP + aptitude', defaultTopics: ['Java OOP & SOLID', 'Quantitative Aptitude', 'Logical Reasoning'] },
  { dayOfWeek: 2, dayName: 'Tuesday', focus: 'DBMS + SQL', defaultTopics: ['Normalization & Keys', 'Transactions & ACID', 'SQL Joins, CTEs & Window Functions'] },
  { dayOfWeek: 3, dayName: 'Wednesday', focus: 'Operating Systems', defaultTopics: ['Processes & Threads', 'CPU Scheduling & Deadlocks', 'Virtual Memory & Paging'] },
  { dayOfWeek: 4, dayName: 'Thursday', focus: 'Computer Networks', defaultTopics: ['OSI & TCP/IP Layers', 'HTTP/HTTPS & DNS', 'Congestion Control & Sockets'] },
  { dayOfWeek: 5, dayName: 'Friday', focus: 'Company-specific preparation', defaultTopics: ['Target Company Patterns', 'Past OA Problems', 'Resume & Project Deep Dive'] },
  { dayOfWeek: 6, dayName: 'Saturday', focus: 'Timed assessment', defaultTopics: ['Timed Coding OA', 'Aptitude + Core CS MCQ Test', 'Post-Test Error Review'] },
  { dayOfWeek: 0, dayName: 'Sunday', focus: 'Interview practice', defaultTopics: ['Technical Mock Interview', 'System Design / LLD Basics', 'Behavioral STAR Stories'] },
];

export interface InternshipSourcePortal {
  name: string;
  url: string;
  region: string;
}

export const INTERNSHIP_OPPORTUNITY_SOURCES: InternshipSourcePortal[] = [
  { name: 'IAESTE', url: 'https://www.iaeste.org/', region: 'Global' },
  { name: 'Aalto AScI', url: 'https://www.aalto.fi/en/aalto-university-science-institute-asci', region: 'Finland' },
  { name: 'DAAD', url: 'https://www.daad.de/en/', region: 'Germany' },
  { name: 'EURAXESS', url: 'https://euraxess.ec.europa.eu/', region: 'Europe' },
  { name: 'Mitacs Globalink', url: 'https://www.mitacs.ca/our-programs/globalink-research-internship-students/', region: 'Canada' },
  { name: 'Google Careers', url: 'https://www.google.com/about/careers/', region: 'Global' },
  { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/', region: 'Global' },
  { name: 'AICTE Internship Portal', url: 'https://internship.aicte-india.org/', region: 'India' },
];

export const INTERNSHIP_APPLICATION_CHECKLIST: Array<{ id: string; label: string }> = [
  { id: 'chk-resume', label: 'One-page resume' },
  { id: 'chk-transcript', label: 'Updated transcript and CGPA details' },
  { id: 'chk-enrollment', label: 'Enrollment certificate' },
  { id: 'chk-passport', label: 'Passport and validity check' },
  { id: 'chk-linkedin', label: 'Updated LinkedIn profile' },
  { id: 'chk-github', label: 'GitHub profile with strong pinned repositories' },
  { id: 'chk-research', label: 'Research interest statement' },
  { id: 'chk-motivation', label: 'Motivation letter' },
  { id: 'chk-lor', label: 'Professor recommendation' },
  { id: 'chk-grad', label: 'Expected graduation confirmation' },
];

export const MASTERS_TARGET_DIRECTION = {
  degree: 'MS in Computer Science',
  specializations: ['AI/ML', 'Systems'],
  intake: 'Fall 2028',
} as const;

export const MASTERS_TIMELINE_TEMPLATE: Array<{ period: string; goal: string }> = [
  { period: 'Nov 2026–Feb 2027', goal: 'Explore universities and requirements' },
  { period: 'Mar–Jun 2027', goal: 'Begin English-test preparation' },
  { period: 'Jul–Sep 2027', goal: 'Take IELTS/TOEFL if required' },
  { period: 'Sep–Nov 2027', goal: 'GRE if needed; finalize shortlist' },
  { period: 'Oct 2027–Jan 2028', goal: 'SOP, LORs and applications' },
  { period: 'Jan–Mar 2028', goal: 'Follow-ups, funding and decisions' },
  { period: 'Mar–Jun 2028', goal: 'Offers, graduation and visa planning' },
];

export function createDefaultPlacementTopics(nowIso: string): PlacementTopicRecord[] {
  return PLACEMENT_WEEKLY_ROTATION.map((rot) => ({
    id: `placement-day-${rot.dayOfWeek}`,
    userId: DEFAULT_USER_ID,
    dayOfWeek: rot.dayOfWeek,
    focusArea: rot.focus,
    topics: rot.defaultTopics,
    notes: '',
    practiceQuestionsCount: 0,
    interviewQuestionsCount: 0,
    revisionStatus: 'not_started',
    updatedAt: nowIso,
  }));
}

export function createDefaultMastersMilestones(nowIso: string): MastersMilestone[] {
  return MASTERS_TIMELINE_TEMPLATE.map((item, idx) => ({
    id: `masters-milestone-${idx + 1}`,
    userId: DEFAULT_USER_ID,
    period: item.period,
    goal: item.goal,
    status: 'not_started',
    notes: '',
    order: idx + 1,
    updatedAt: nowIso,
  }));
}
