import { z } from 'zod';

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(160),
  category: z.enum([
    'College',
    'DSA',
    'Software Engineering',
    'Technology Awareness',
    'Placement Preparation',
    'Projects',
    'Internship',
    "Master's",
    'Personal',
  ]),
  priority: z.enum(['high', 'medium', 'low']),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly']),
  notes: z.string().max(2000).optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const dsaProblemFormSchema = z.object({
  problemName: z.string().trim().min(1, 'Problem name is required').max(160),
  platform: z.enum(['LeetCode', 'NeetCode', 'Striver', 'GFG', 'Other']),
  topic: z.string().trim().min(1, 'Topic is required').max(80),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  status: z.enum(['attempted', 'solved']),
  dateAttempted: z.string().min(1, 'Attempt date is required'),
  dateSolved: z.string().optional(),
  timeTakenMinutes: z.coerce.number().int().min(0).max(600),
  solutionLink: z.string().trim().optional(),
  timeComplexity: z.string().trim().max(40).default(''),
  spaceComplexity: z.string().trim().max(40).default(''),
  revisitDate: z.string().optional(),
  mistakes: z.string().max(1500).default(''),
  notes: z.string().max(2000).default(''),
});

export type DsaProblemFormValues = z.infer<typeof dsaProblemFormSchema>;

export const customEventFormSchema = z.object({
  title: z.string().trim().min(1, 'Event title is required').max(120),
  category: z.enum([
    'class',
    'lab',
    'mentoring',
    'project',
    'cir',
    'break',
    'routine',
    'dsa',
    'awareness',
    'placement',
    'career',
    'personal',
  ]),
  subjectCode: z.string().trim().max(24).optional(),
  location: z.string().trim().max(80).optional(),
  dateKey: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  notes: z.string().max(1000).optional(),
});

export type CustomEventFormValues = z.infer<typeof customEventFormSchema>;

export const backupPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  tables: z.object({
    userProfile: z.array(z.any()),
    scheduleTemplates: z.array(z.any()),
    scheduleInstances: z.array(z.any()),
    tasks: z.array(z.any()),
    habits: z.array(z.any()),
    habitLogs: z.array(z.any()),
    focusSessions: z.array(z.any()),
    learningStages: z.array(z.any()),
    dsaProblems: z.array(z.any()),
    awarenessLogs: z.array(z.any()),
    savedResources: z.array(z.any()),
    placementTopics: z.array(z.any()),
    placementSessions: z.array(z.any()),
    projects: z.array(z.any()),
    internshipApplications: z.array(z.any()),
    mastersMilestones: z.array(z.any()),
    universities: z.array(z.any()),
  }),
});
