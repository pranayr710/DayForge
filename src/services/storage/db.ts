import Dexie, { type Table } from 'dexie';
import type {
  AwarenessLog,
  CareerChecklistItem,
  DsaProblem,
  FocusSession,
  HabitItem,
  HabitLog,
  InternshipApplication,
  LearningStage,
  MastersMilestone,
  PlacementSessionLog,
  PlacementTopicRecord,
  ProjectItem,
  SavedTechResource,
  ScheduleInstance,
  ScheduleTemplate,
  TaskItem,
  UniversityTarget,
  UserProfile,
} from '@/types';

export class DayForgeDatabase extends Dexie {
  userProfile!: Table<UserProfile, string>;
  scheduleTemplates!: Table<ScheduleTemplate, string>;
  scheduleInstances!: Table<ScheduleInstance, string>;
  tasks!: Table<TaskItem, string>;
  habits!: Table<HabitItem, string>;
  habitLogs!: Table<HabitLog, string>;
  focusSessions!: Table<FocusSession, string>;
  learningStages!: Table<LearningStage, string>;
  dsaProblems!: Table<DsaProblem, string>;
  awarenessLogs!: Table<AwarenessLog, string>;
  savedResources!: Table<SavedTechResource, string>;
  placementTopics!: Table<PlacementTopicRecord, string>;
  placementSessions!: Table<PlacementSessionLog, string>;
  projects!: Table<ProjectItem, string>;
  internshipApplications!: Table<InternshipApplication, string>;
  mastersMilestones!: Table<MastersMilestone, string>;
  universities!: Table<UniversityTarget, string>;
  careerChecklist!: Table<CareerChecklistItem, string>;

  constructor() {
    super('DayForgeDB');
    this.version(1).stores({
      userProfile: 'id',
      scheduleTemplates: 'id, userId, source, dayOfWeek, isActive',
      scheduleInstances: 'id, userId, dateKey, templateId, [dateKey+templateId]',
      tasks: 'id, userId, category, priority, dueDate, completed, recurrence',
      habits: 'id, userId, archived',
      habitLogs: 'id, userId, habitId, dateKey, [habitId+dateKey]',
      focusSessions: 'id, userId, dateKey, taskId, startedAt',
      learningStages: 'id, userId, stageNumber, status',
      dsaProblems: 'id, userId, topic, difficulty, platform, status, dateAttempted, revisitDate',
      awarenessLogs: 'id, userId, dateKey',
      savedResources: 'id, userId, read, createdAt',
      placementTopics: 'id, userId, dayOfWeek, revisionStatus',
      placementSessions: 'id, userId, dateKey, kind',
      projects: 'id, userId, category, isPrimary',
      internshipApplications: 'id, userId, status, deadline',
      mastersMilestones: 'id, userId, order, status',
      universities: 'id, userId, applicationStatus, deadline',
    });
    this.version(2).stores({
      careerChecklist: 'id, userId',
    });
  }
}

export const db = new DayForgeDatabase();
