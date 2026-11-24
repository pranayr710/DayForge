import type { UserProfile } from '@/types';

export const DEFAULT_USER_ID = 'local-user-1';

export const PERSONAL_PLAN_DEFAULTS = {
  planningPeriod: 'November 2026 – June 2028',
  timezone: 'Asia/Kolkata',
  academicProgramme: 'B.Tech Computer Science and Engineering',
  institution: 'Amrita Vishwa Vidyapeetham, Amrita School of Computing, Coimbatore',
  semester: 'Semester VI',
  electiveThreeName: 'Professional Elective III',
  mainCareerGoals: [
    'Indian campus placements',
    'Summer 2027 international internships',
    "Fall 2028 US Master's applications",
    'Strong foundations in software engineering and AI',
  ],
  longTermGoals: [
    {
      id: 'goal-dsa-placements',
      title: 'DSA & Placements — 2028',
      horizon: '2026 – 2028',
      category: 'Placement & DSA',
    },
    {
      id: 'goal-internships',
      title: 'International Internship — Summer 2027',
      horizon: 'Summer 2027',
      category: 'Global Research / Industry',
    },
    {
      id: 'goal-masters',
      title: "US Master's — Fall 2028",
      horizon: 'Nov 2026 – Jun 2028',
      category: 'MS in CS (AI/ML & Systems)',
    },
    {
      id: 'goal-curriculum',
      title: 'Software Engineering Curriculum',
      horizon: '16 Stages',
      category: 'Fundamentals to AI Engineering',
    },
  ],
} as const;

export function createDefaultUserProfile(nowIso: string): UserProfile {
  return {
    id: DEFAULT_USER_ID,
    displayName: 'Sujith',
    timezone: PERSONAL_PLAN_DEFAULTS.timezone,
    academicProgramme: PERSONAL_PLAN_DEFAULTS.academicProgramme,
    institution: PERSONAL_PLAN_DEFAULTS.institution,
    semester: PERSONAL_PLAN_DEFAULTS.semester,
    planningPeriod: PERSONAL_PLAN_DEFAULTS.planningPeriod,
    electiveThreeName: PERSONAL_PLAN_DEFAULTS.electiveThreeName,
    theme: 'dark',
    weekStartsOn: 'monday',
    notificationsEnabled: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
