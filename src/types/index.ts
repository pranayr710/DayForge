export type ThemeMode = 'dark' | 'light' | 'system';

export type ScheduleCategory =
  | 'class'
  | 'lab'
  | 'mentoring'
  | 'project'
  | 'cir'
  | 'break'
  | 'routine'
  | 'dsa'
  | 'awareness'
  | 'placement'
  | 'career'
  | 'personal';

export type ScheduleSource = 'college' | 'routine' | 'custom';

export interface UserProfile {
  id: string;
  displayName: string;
  timezone: string;
  academicProgramme: string;
  institution: string;
  semester: string;
  planningPeriod: string;
  electiveThreeName: string;
  theme: ThemeMode;
  weekStartsOn: 'monday' | 'sunday';
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleTemplate {
  id: string;
  userId: string;
  source: 'college' | 'routine';
  category: ScheduleCategory;
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  subjectCode?: string;
  title: string;
  subtitle?: string;
  location?: string;
  startTime: string; // HH:mm 24h IST
  endTime: string; // HH:mm 24h IST (if <= startTime, crosses midnight)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleInstance {
  id: string;
  userId: string;
  dateKey: string; // YYYY-MM-DD in IST
  templateId?: string;
  source: ScheduleSource;
  category: ScheduleCategory;
  subjectCode?: string;
  title: string;
  subtitle?: string;
  location?: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  completedAt?: string;
  isCustom: boolean;
  isCancelled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedScheduleBlock {
  instanceId?: string;
  templateId?: string;
  dateKey: string;
  source: ScheduleSource;
  category: ScheduleCategory;
  subjectCode?: string;
  title: string;
  subtitle?: string;
  location?: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  crossesMidnight: boolean;
  completed: boolean;
  completedAt?: string;
  isCustom: boolean;
  isRescheduled: boolean;
  notes?: string;
  hasConflict?: boolean;
}

export type TaskCategory =
  | 'College'
  | 'DSA'
  | 'Software Engineering'
  | 'Technology Awareness'
  | 'Placement Preparation'
  | 'Projects'
  | 'Internship'
  | "Master's"
  | 'Personal';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskRecurrence = 'none' | 'daily' | 'weekly';

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  recurrence: TaskRecurrence;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitItem {
  id: string;
  userId: string;
  title: string;
  category: TaskCategory;
  targetDaysPerWeek: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  dateKey: string;
  completed: boolean;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  taskTitle: string;
  objective?: string;
  plannedMinutes: number;
  actualSeconds: number;
  notes?: string;
  startedAt: string;
  endedAt: string;
  dateKey: string;
}

export type StageStatus = 'not_started' | 'in_progress' | 'completed';

export interface CurriculumConcept {
  id: string;
  title: string;
  completed: boolean;
}

export interface LearningStage {
  id: string;
  userId: string;
  stageNumber: number;
  title: string;
  description: string;
  objectives: string[];
  recommendedChannels: string[];
  externalResources: { label: string; url: string }[];
  weekMapping: string;
  concepts: CurriculumConcept[];
  assignment: string;
  notes: string;
  status: StageStatus;
  updatedAt: string;
}

export type DsaDifficulty = 'Easy' | 'Medium' | 'Hard';
export type DsaPlatform = 'LeetCode' | 'NeetCode' | 'Striver' | 'GFG' | 'Other';
export type DsaStatus = 'attempted' | 'solved';

export interface DsaProblem {
  id: string;
  userId: string;
  problemName: string;
  platform: DsaPlatform;
  topic: string;
  difficulty: DsaDifficulty;
  status: DsaStatus;
  dateAttempted: string;
  dateSolved?: string;
  timeTakenMinutes: number;
  solutionLink?: string;
  notes: string;
  mistakes: string;
  timeComplexity: string;
  spaceComplexity: string;
  revisitDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AwarenessLog {
  id: string;
  userId: string;
  dateKey: string;
  dailyDevDone: boolean;
  hackerNewsDone: boolean;
  youtubeDone: boolean;
  youtubeChannel: string;
  githubTrendingDone: boolean;
  notesDone: boolean;
  notes: string;
  updatedAt: string;
}

export interface SavedTechResource {
  id: string;
  userId: string;
  title: string;
  url: string;
  source: string;
  tags: string[];
  read: boolean;
  notes?: string;
  createdAt: string;
}

export interface PlacementTopicRecord {
  id: string;
  userId: string;
  dayOfWeek: number;
  focusArea: string;
  topics: string[];
  notes: string;
  practiceQuestionsCount: number;
  interviewQuestionsCount: number;
  revisionStatus: StageStatus;
  lastStudiedDate?: string;
  updatedAt: string;
}

export interface PlacementSessionLog {
  id: string;
  userId: string;
  dateKey: string;
  focusArea: string;
  kind: 'aptitude' | 'coding_assessment' | 'mock_interview' | 'company_prep' | 'core_cs';
  companyOrLabel?: string;
  durationMinutes: number;
  notes: string;
  createdAt: string;
}

export type ProjectCategory =
  | 'AI Engineering'
  | 'Backend / Distributed Systems'
  | 'AI/ML Research';

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectItem {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: ProjectCategory;
  isPrimary: boolean;
  githubUrl?: string;
  deploymentUrl?: string;
  techStack: string[];
  startDate?: string;
  targetCompletionDate?: string;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  documentationStatus: StageStatus;
  testingStatus: StageStatus;
  createdAt: string;
  updatedAt: string;
}

export type InternshipStatus =
  | 'Interested'
  | 'Researching'
  | 'Preparing'
  | 'Applied'
  | 'Interview'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn';

export interface InternshipApplication {
  id: string;
  userId: string;
  organization: string;
  opportunityTitle: string;
  country: string;
  officialUrl?: string;
  openingDate?: string;
  deadline?: string;
  eligibility?: string;
  stipend?: string;
  travelFunding?: string;
  accommodationSupport?: string;
  requiredDocuments: string[];
  status: InternshipStatus;
  notes: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MastersMilestone {
  id: string;
  userId: string;
  period: string;
  goal: string;
  status: StageStatus;
  notes: string;
  order: number;
  updatedAt: string;
}

export type ChecklistState = 'not_started' | 'in_progress' | 'ready' | 'submitted';

export interface UniversityTarget {
  id: string;
  userId: string;
  university: string;
  programme: string;
  country: string;
  tuition?: string;
  funding?: string;
  deadline?: string;
  ieltsStatus: ChecklistState;
  toeflStatus: ChecklistState;
  greStatus: ChecklistState;
  duolingoStatus: ChecklistState;
  sopStatus: ChecklistState;
  lorStatus: ChecklistState;
  transcriptsStatus: ChecklistState;
  resumeStatus: ChecklistState;
  applicationStatus: 'Shortlisted' | 'Preparing' | 'Applied' | 'Interview' | 'Admitted' | 'Rejected';
  notes: string;
  createdAt: string;
  updatedAt: string;
}
