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

export const customEventFormSchema = z
  .object({
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
  })
  .refine((val) => val.startTime !== val.endTime, {
    message: 'End time must differ from start time',
    path: ['endTime'],
  });

export type CustomEventFormValues = z.infer<typeof customEventFormSchema>;

// --- Backup import validation ---------------------------------------------
// The import clears every table and bulk-puts the file's rows, so a malformed
// file must be rejected BEFORE anything is wiped. We validate with z.any()
// arrays plus refinements (rather than z.object schemas, which would silently
// strip unknown keys and drop data) so valid rows pass through untouched while
// crash-inducing rows — missing `id`, or missing the array fields the UI
// reduces/filters over — are rejected.
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
const hasStringId = (v: unknown): boolean => isRecord(v) && typeof v.id === 'string' && v.id.length > 0;
const hasArrays = (v: unknown, keys: string[]): boolean =>
  isRecord(v) && keys.every((k) => Array.isArray(v[k]));

/** Every row must be an object with a non-empty string id (bulkPut inbound key). */
function recordArray(message: string) {
  return z.array(z.any()).refine((rows) => rows.every(hasStringId), { message });
}
/** As recordArray, plus required array fields the UI iterates (prevents white-screens). */
function recordArrayWithArrays(keys: string[], message: string) {
  return z
    .array(z.any())
    .refine((rows) => rows.every((r) => hasStringId(r) && hasArrays(r, keys)), { message });
}

export const backupPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  tables: z.object({
    userProfile: recordArray('userProfile rows must each have an id'),
    scheduleTemplates: recordArray('scheduleTemplates rows must each have an id'),
    scheduleInstances: recordArray('scheduleInstances rows must each have an id'),
    tasks: recordArray('tasks rows must each have an id'),
    habits: recordArray('habits rows must each have an id'),
    habitLogs: recordArray('habitLogs rows must each have an id'),
    focusSessions: recordArray('focusSessions rows must each have an id'),
    learningStages: recordArrayWithArrays(
      ['concepts'],
      'learningStages rows must each have an id and a concepts array'
    ),
    dsaProblems: recordArray('dsaProblems rows must each have an id'),
    awarenessLogs: recordArray('awarenessLogs rows must each have an id'),
    savedResources: recordArray('savedResources rows must each have an id'),
    placementTopics: recordArray('placementTopics rows must each have an id'),
    placementSessions: recordArray('placementSessions rows must each have an id'),
    projects: recordArrayWithArrays(
      ['tasks', 'milestones', 'techStack'],
      'projects rows must each have an id and tasks/milestones/techStack arrays'
    ),
    internshipApplications: recordArrayWithArrays(
      ['requiredDocuments'],
      'internshipApplications rows must each have an id and a requiredDocuments array'
    ),
    mastersMilestones: recordArray('mastersMilestones rows must each have an id'),
    universities: recordArray('universities rows must each have an id'),
    careerChecklist: recordArray('careerChecklist rows must each have an id').optional(),
  }),
});
