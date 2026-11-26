import { db } from './db';
import { DEFAULT_USER_ID } from '@/config/personalPlan';
import { getYoutubeChannelForDay } from '@/config/awareness';
import { createId } from '@/lib/utils';
import { addDaysToDateKey, getDayOfWeekFromDateKey } from '@/lib/dateUtils';
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
  ResolvedScheduleBlock,
  SavedTechResource,
  ScheduleBlockStatus,
  ScheduleInstance,
  ScheduleTemplate,
  StageStatus,
  TaskItem,
  UniversityTarget,
  UserProfile,
} from '@/types';

export async function updateUserProfile(
  patch: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
): Promise<void> {
  const existing = await db.userProfile.get(DEFAULT_USER_ID);
  if (!existing) return;
  await db.userProfile.put({
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

// --- Schedule Operations ---
async function findExistingScheduleInstance(
  block: Pick<ResolvedScheduleBlock, 'instanceId' | 'dateKey' | 'templateId'>
): Promise<ScheduleInstance | undefined> {
  if (block.instanceId) {
    const byId = await db.scheduleInstances.get(block.instanceId);
    if (byId) return byId;
  }
  if (block.templateId) {
    return db.scheduleInstances
      .where('[dateKey+templateId]')
      .equals([block.dateKey, block.templateId])
      .first();
  }
  return undefined;
}

export async function toggleScheduleBlockCompleted(
  block: ResolvedScheduleBlock
): Promise<void> {
  const nowIso = new Date().toISOString();
  const nextCompleted = !block.completed;

  await db.transaction('rw', db.scheduleInstances, async () => {
    const existing = await findExistingScheduleInstance(block);
    const loggedSeconds =
      existing?.loggedSeconds ??
      (existing?.loggedMinutes != null ? existing.loggedMinutes * 60 : block.loggedSeconds ?? 0);
    const nextStatus: ScheduleBlockStatus = nextCompleted
      ? 'done'
      : loggedSeconds > 0
        ? 'partial'
        : 'planned';

    if (existing) {
      await db.scheduleInstances.update(existing.id, {
        completed: nextCompleted,
        completedAt: nextCompleted ? nowIso : undefined,
        status: nextStatus,
        updatedAt: nowIso,
      });
      return;
    }

    const instance: ScheduleInstance = {
      id: createId('sinst'),
      userId: DEFAULT_USER_ID,
      dateKey: block.dateKey,
      templateId: block.templateId,
      source: block.source,
      category: block.category,
      subjectCode: block.subjectCode,
      title: block.title,
      subtitle: block.subtitle,
      location: block.location,
      startTime: block.startTime,
      endTime: block.endTime,
      completed: nextCompleted,
      completedAt: nextCompleted ? nowIso : undefined,
      status: nextStatus,
      loggedMinutes: loggedSeconds > 0 ? Math.floor(loggedSeconds / 60) : undefined,
      loggedSeconds: loggedSeconds > 0 ? loggedSeconds : undefined,
      isCustom: false,
      isCancelled: false,
      notes: block.notes,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await db.scheduleInstances.put(instance);
  });
}

export async function setScheduleBlockStatus(
  block: ResolvedScheduleBlock,
  status: ScheduleBlockStatus,
  opts?: {
    addSeconds?: number;
    loggedSeconds?: number;
    notes?: string;
    startTime?: string;
    endTime?: string;
  }
): Promise<void> {
  const nowIso = new Date().toISOString();
  const nextCompleted = status === 'done';

  await db.transaction('rw', db.scheduleInstances, async () => {
    const existing = await findExistingScheduleInstance(block);
    const prevSeconds =
      existing?.loggedSeconds ??
      (existing?.loggedMinutes != null ? existing.loggedMinutes * 60 : block.loggedSeconds ?? 0);
    const nextSeconds =
      opts?.loggedSeconds !== undefined
        ? Math.max(0, Math.round(opts.loggedSeconds))
        : opts?.addSeconds !== undefined
          ? Math.max(0, prevSeconds + Math.round(opts.addSeconds))
          : prevSeconds;
    const nextMinutes = Math.floor(nextSeconds / 60);
    const nextNotes =
      opts?.notes !== undefined ? opts.notes : (existing?.notes ?? block.notes);

    if (existing) {
      await db.scheduleInstances.update(existing.id, {
        status,
        completed: nextCompleted,
        completedAt: nextCompleted
          ? (existing.completedAt ?? nowIso)
          : undefined,
        loggedMinutes: nextMinutes,
        loggedSeconds: nextSeconds,
        notes: nextNotes,
        ...(opts?.startTime ? { startTime: opts.startTime } : {}),
        ...(opts?.endTime ? { endTime: opts.endTime } : {}),
        updatedAt: nowIso,
      });
      return;
    }

    await db.scheduleInstances.put({
      id: createId('sinst'),
      userId: DEFAULT_USER_ID,
      dateKey: block.dateKey,
      templateId: block.templateId,
      source: block.source,
      category: block.category,
      subjectCode: block.subjectCode,
      title: block.title,
      subtitle: block.subtitle,
      location: block.location,
      startTime: opts?.startTime ?? block.startTime,
      endTime: opts?.endTime ?? block.endTime,
      completed: nextCompleted,
      completedAt: nextCompleted ? nowIso : undefined,
      status,
      loggedMinutes: nextMinutes,
      loggedSeconds: nextSeconds,
      isCustom: block.isCustom,
      isCancelled: false,
      notes: nextNotes,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  });
}

export async function rescheduleScheduleBlock(
  block: ResolvedScheduleBlock,
  startTime: string,
  endTime: string,
  notes?: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  if (block.instanceId) {
    await db.scheduleInstances.update(block.instanceId, {
      startTime,
      endTime,
      notes: notes ?? block.notes,
      updatedAt: nowIso,
    });
    return;
  }

  await db.scheduleInstances.put({
    id: createId('sinst'),
    userId: DEFAULT_USER_ID,
    dateKey: block.dateKey,
    templateId: block.templateId,
    source: block.source,
    category: block.category,
    subjectCode: block.subjectCode,
    title: block.title,
    subtitle: block.subtitle,
    location: block.location,
    startTime,
    endTime,
    completed: block.completed,
    completedAt: block.completedAt,
    isCustom: false,
    isCancelled: false,
    notes: notes ?? block.notes,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function resetScheduleBlockInstance(
  block: ResolvedScheduleBlock
): Promise<void> {
  if (block.instanceId && !block.isCustom) {
    await db.scheduleInstances.delete(block.instanceId);
  }
}

export async function addCustomScheduleEvent(
  input: Omit<
    ScheduleInstance,
    'id' | 'userId' | 'source' | 'completed' | 'isCustom' | 'isCancelled' | 'createdAt' | 'updatedAt'
  >
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.scheduleInstances.put({
    ...input,
    id: createId('cevt'),
    userId: DEFAULT_USER_ID,
    source: 'custom',
    completed: false,
    isCustom: true,
    isCancelled: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function deleteOrSkipScheduleBlock(
  block: ResolvedScheduleBlock
): Promise<void> {
  const nowIso = new Date().toISOString();
  if (block.isCustom && block.instanceId) {
    await db.scheduleInstances.delete(block.instanceId);
    return;
  }
  if (block.instanceId) {
    await db.scheduleInstances.update(block.instanceId, {
      isCancelled: true,
      updatedAt: nowIso,
    });
    return;
  }
  await db.scheduleInstances.put({
    id: createId('sinst'),
    userId: DEFAULT_USER_ID,
    dateKey: block.dateKey,
    templateId: block.templateId,
    source: block.source,
    category: block.category,
    subjectCode: block.subjectCode,
    title: block.title,
    subtitle: block.subtitle,
    location: block.location,
    startTime: block.startTime,
    endTime: block.endTime,
    completed: false,
    isCustom: false,
    isCancelled: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function addScheduleTemplate(
  input: Omit<ScheduleTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.scheduleTemplates.put({
    ...input,
    id: createId('tpl'),
    userId: DEFAULT_USER_ID,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function updateScheduleTemplate(
  id: string,
  patch: Partial<Omit<ScheduleTemplate, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  await db.scheduleTemplates.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateScheduleTemplate(
  id: string,
  patch: Partial<Omit<ScheduleTemplate, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  await db.scheduleTemplates.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteScheduleTemplate(id: string): Promise<void> {
  await db.scheduleTemplates.delete(id);
}

// --- Tasks ---
export async function createTask(
  input: Omit<TaskItem, 'id' | 'userId' | 'completed' | 'completedAt' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.tasks.put({
    ...input,
    id: createId('task'),
    userId: DEFAULT_USER_ID,
    completed: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function updateTask(
  id: string,
  patch: Partial<Omit<TaskItem, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  await db.tasks.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function toggleTaskCompleted(task: TaskItem): Promise<void> {
  const nowIso = new Date().toISOString();
  const nextCompleted = !task.completed;
  await db.tasks.update(task.id, {
    completed: nextCompleted,
    completedAt: nextCompleted ? nowIso : undefined,
    updatedAt: nowIso,
  });

  // If completing a recurring task that has a dueDate, schedule the next occurrence if none exists
  if (nextCompleted && task.recurrence !== 'none' && task.dueDate) {
    const delta = task.recurrence === 'daily' ? 1 : 7;
    const nextDueDate = addDaysToDateKey(task.dueDate, delta);
    // `title` is not an indexed field, so query with filter() (a where() on it
    // throws and previously fell through to always creating a duplicate).
    const existing = await db.tasks
      .filter((t) => t.title === task.title && !t.completed && t.dueDate === nextDueDate)
      .count()
      .catch(() => 0);

    if (existing === 0) {
      await db.tasks.put({
        ...task,
        id: createId('task'),
        dueDate: nextDueDate,
        completed: false,
        completedAt: undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }
  }
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

// --- Habits ---
export async function createHabit(
  input: Omit<HabitItem, 'id' | 'userId' | 'archived' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.habits.put({
    ...input,
    id: createId('habit'),
    userId: DEFAULT_USER_ID,
    archived: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function deleteHabit(id: string): Promise<void> {
  await db.transaction('rw', [db.habits, db.habitLogs], async () => {
    await db.habits.delete(id);
    await db.habitLogs.where('habitId').equals(id).delete();
  });
}

export async function toggleHabitForDate(
  habitId: string,
  dateKey: string
): Promise<void> {
  const existing = await db.habitLogs
    .where('[habitId+dateKey]')
    .equals([habitId, dateKey])
    .first();

  if (existing) {
    await db.habitLogs.delete(existing.id);
  } else {
    await db.habitLogs.put({
      id: createId('hlog'),
      userId: DEFAULT_USER_ID,
      habitId,
      dateKey,
      completed: true,
      createdAt: new Date().toISOString(),
    });
  }
}

// --- Focus Sessions ---
export async function recordFocusSession(
  input: Omit<FocusSession, 'id' | 'userId'>
): Promise<void> {
  await db.focusSessions.put({
    ...input,
    id: createId('focus'),
    userId: DEFAULT_USER_ID,
  });
}

// --- Learning Stages ---
export async function toggleStageConcept(
  stage: LearningStage,
  conceptId: string
): Promise<void> {
  // Re-read inside a transaction so rapid toggles don't overwrite each other
  // from a stale render snapshot.
  await db.transaction('rw', db.learningStages, async () => {
    const current = await db.learningStages.get(stage.id);
    if (!current) return;
    await db.learningStages.update(stage.id, {
      concepts: current.concepts.map((c) =>
        c.id === conceptId ? { ...c, completed: !c.completed } : c
      ),
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function updateLearningStage(
  stageId: string,
  patch: Partial<Pick<LearningStage, 'status' | 'notes' | 'assignment'>>
): Promise<void> {
  await db.learningStages.update(stageId, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

// --- DSA Problems ---
export async function upsertDsaProblem(
  input: Omit<DsaProblem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  if (existingId) {
    await db.dsaProblems.update(existingId, {
      ...input,
      updatedAt: nowIso,
    });
    return;
  }
  await db.dsaProblems.put({
    ...input,
    id: createId('dsa'),
    userId: DEFAULT_USER_ID,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function deleteDsaProblem(id: string): Promise<void> {
  await db.dsaProblems.delete(id);
}

// --- Tech Awareness ---
export async function upsertAwarenessLog(
  dateKey: string,
  patch: Partial<
    Omit<AwarenessLog, 'id' | 'userId' | 'dateKey' | 'youtubeChannel' | 'updatedAt'>
  >
): Promise<void> {
  const nowIso = new Date().toISOString();
  const existing = await db.awarenessLogs.where('dateKey').equals(dateKey).first();
  const dow = getDayOfWeekFromDateKey(dateKey);
  const yt = getYoutubeChannelForDay(dow);

  if (existing) {
    await db.awarenessLogs.update(existing.id, {
      ...patch,
      updatedAt: nowIso,
    });
    return;
  }

  await db.awarenessLogs.put({
    id: `aware-${dateKey}`,
    userId: DEFAULT_USER_ID,
    dateKey,
    dailyDevDone: false,
    hackerNewsDone: false,
    youtubeDone: false,
    youtubeChannel: yt.channel,
    githubTrendingDone: false,
    notesDone: false,
    notes: '',
    ...patch,
    updatedAt: nowIso,
  });
}

export async function addSavedTechResource(
  input: Omit<SavedTechResource, 'id' | 'userId' | 'read' | 'createdAt'>
): Promise<void> {
  await db.savedResources.put({
    ...input,
    id: createId('res'),
    userId: DEFAULT_USER_ID,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function toggleSavedTechResourceRead(
  item: SavedTechResource
): Promise<void> {
  await db.savedResources.update(item.id, { read: !item.read });
}

export async function deleteSavedTechResource(id: string): Promise<void> {
  await db.savedResources.delete(id);
}

// --- Placement Prep ---
export async function updatePlacementTopic(
  id: string,
  patch: Partial<
    Pick<
      PlacementTopicRecord,
      'notes' | 'practiceQuestionsCount' | 'interviewQuestionsCount' | 'revisionStatus' | 'lastStudiedDate' | 'topics'
    >
  >
): Promise<void> {
  await db.placementTopics.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function logPlacementSession(
  input: Omit<PlacementSessionLog, 'id' | 'userId' | 'createdAt'>
): Promise<void> {
  await db.placementSessions.put({
    ...input,
    id: createId('psess'),
    userId: DEFAULT_USER_ID,
    createdAt: new Date().toISOString(),
  });
}

// --- Projects ---
export async function upsertProject(
  input: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.transaction('rw', [db.projects], async () => {
    if (input.isPrimary) {
      const all = await db.projects.toArray();
      for (const p of all) {
        if (p.id !== existingId && p.isPrimary) {
          await db.projects.update(p.id, { isPrimary: false, updatedAt: nowIso });
        }
      }
    }
    if (existingId) {
      await db.projects.update(existingId, { ...input, updatedAt: nowIso });
    } else {
      await db.projects.put({
        ...input,
        id: createId('proj'),
        userId: DEFAULT_USER_ID,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }
  });
}

export async function updateProjectTasksAndMilestones(
  projectId: string,
  patch: Partial<
    Pick<ProjectItem, 'tasks' | 'milestones' | 'documentationStatus' | 'testingStatus' | 'isPrimary'>
  >
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.transaction('rw', [db.projects], async () => {
    if (patch.isPrimary) {
      const all = await db.projects.toArray();
      for (const p of all) {
        if (p.id !== projectId && p.isPrimary) {
          await db.projects.update(p.id, { isPrimary: false, updatedAt: nowIso });
        }
      }
    }
    await db.projects.update(projectId, { ...patch, updatedAt: nowIso });
  });
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

// Item-level project edits re-read inside a transaction so rapid clicks don't
// clobber each other from a stale render snapshot.
export async function toggleProjectMilestone(
  projectId: string,
  milestoneId: string
): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return;
    await db.projects.update(projectId, {
      milestones: p.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      ),
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function addProjectMilestone(
  projectId: string,
  title: string
): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return;
    await db.projects.update(projectId, {
      milestones: [...p.milestones, { id: createId('pm'), title, completed: false }],
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function toggleProjectTask(
  projectId: string,
  taskId: string
): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return;
    await db.projects.update(projectId, {
      tasks: p.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function addProjectTask(
  projectId: string,
  title: string
): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return;
    await db.projects.update(projectId, {
      tasks: [...p.tasks, { id: createId('pt'), title, completed: false }],
      updatedAt: new Date().toISOString(),
    });
  });
}

// --- Internships ---
export async function upsertInternship(
  input: Omit<InternshipApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  if (existingId) {
    await db.internshipApplications.update(existingId, { ...input, updatedAt: nowIso });
    return;
  }
  await db.internshipApplications.put({
    ...input,
    id: createId('intern'),
    userId: DEFAULT_USER_ID,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function deleteInternship(id: string): Promise<void> {
  await db.internshipApplications.delete(id);
}

// --- US Master's ---
export async function updateMastersMilestone(
  id: string,
  patch: { period?: string; goal?: string; status?: StageStatus; notes?: string }
): Promise<void> {
  await db.mastersMilestones.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function upsertUniversityTarget(
  input: Omit<UniversityTarget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  if (existingId) {
    await db.universities.update(existingId, { ...input, updatedAt: nowIso });
    return;
  }
  await db.universities.put({
    ...input,
    id: createId('uni'),
    userId: DEFAULT_USER_ID,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function deleteUniversityTarget(id: string): Promise<void> {
  await db.universities.delete(id);
}

export async function toggleCareerChecklistItem(
  id: string,
  completed: boolean
): Promise<void> {
  await db.careerChecklist.update(id, {
    completed: !completed,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Merges a partial patch into a university record. update() applies against the
 * current stored row, so changing one checklist field won't revert another
 * field edited moments earlier (unlike spreading a stale snapshot).
 */
export async function patchUniversityTarget(
  id: string,
  patch: Partial<Omit<UniversityTarget, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  await db.universities.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

// --- Export / Import JSON Backup ---
export interface DayForgeBackupPayload {
  schemaVersion: 1;
  exportedAt: string;
  tables: {
    userProfile: UserProfile[];
    scheduleTemplates: ScheduleTemplate[];
    scheduleInstances: ScheduleInstance[];
    tasks: TaskItem[];
    habits: HabitItem[];
    habitLogs: HabitLog[];
    focusSessions: FocusSession[];
    learningStages: LearningStage[];
    dsaProblems: DsaProblem[];
    awarenessLogs: AwarenessLog[];
    savedResources: SavedTechResource[];
    placementTopics: PlacementTopicRecord[];
    placementSessions: PlacementSessionLog[];
    projects: ProjectItem[];
    internshipApplications: InternshipApplication[];
    mastersMilestones: MastersMilestone[];
    universities: UniversityTarget[];
    careerChecklist?: CareerChecklistItem[];
  };
}

export async function exportDayForgeBackup(): Promise<DayForgeBackupPayload> {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      userProfile: await db.userProfile.toArray(),
      scheduleTemplates: await db.scheduleTemplates.toArray(),
      scheduleInstances: await db.scheduleInstances.toArray(),
      tasks: await db.tasks.toArray(),
      habits: await db.habits.toArray(),
      habitLogs: await db.habitLogs.toArray(),
      focusSessions: await db.focusSessions.toArray(),
      learningStages: await db.learningStages.toArray(),
      dsaProblems: await db.dsaProblems.toArray(),
      awarenessLogs: await db.awarenessLogs.toArray(),
      savedResources: await db.savedResources.toArray(),
      placementTopics: await db.placementTopics.toArray(),
      placementSessions: await db.placementSessions.toArray(),
      projects: await db.projects.toArray(),
      internshipApplications: await db.internshipApplications.toArray(),
      mastersMilestones: await db.mastersMilestones.toArray(),
      universities: await db.universities.toArray(),
      careerChecklist: await db.careerChecklist.toArray(),
    },
  };
}

export async function importDayForgeBackup(
  payload: DayForgeBackupPayload
): Promise<void> {
  const t = payload.tables;
  await db.transaction(
    'rw',
    [
      db.userProfile,
      db.scheduleTemplates,
      db.scheduleInstances,
      db.tasks,
      db.habits,
      db.habitLogs,
      db.focusSessions,
      db.learningStages,
      db.dsaProblems,
      db.awarenessLogs,
      db.savedResources,
      db.placementTopics,
      db.placementSessions,
      db.projects,
      db.internshipApplications,
      db.mastersMilestones,
      db.universities,
      db.careerChecklist,
    ],
    async () => {
      await Promise.all([
        db.userProfile.clear(),
        db.scheduleTemplates.clear(),
        db.scheduleInstances.clear(),
        db.tasks.clear(),
        db.habits.clear(),
        db.habitLogs.clear(),
        db.focusSessions.clear(),
        db.learningStages.clear(),
        db.dsaProblems.clear(),
        db.awarenessLogs.clear(),
        db.savedResources.clear(),
        db.placementTopics.clear(),
        db.placementSessions.clear(),
        db.projects.clear(),
        db.internshipApplications.clear(),
        db.mastersMilestones.clear(),
        db.universities.clear(),
        db.careerChecklist.clear(),
      ]);

      await Promise.all([
        t.userProfile.length ? db.userProfile.bulkPut(t.userProfile) : Promise.resolve(),
        t.scheduleTemplates.length ? db.scheduleTemplates.bulkPut(t.scheduleTemplates) : Promise.resolve(),
        t.scheduleInstances.length ? db.scheduleInstances.bulkPut(t.scheduleInstances) : Promise.resolve(),
        t.tasks.length ? db.tasks.bulkPut(t.tasks) : Promise.resolve(),
        t.habits.length ? db.habits.bulkPut(t.habits) : Promise.resolve(),
        t.habitLogs.length ? db.habitLogs.bulkPut(t.habitLogs) : Promise.resolve(),
        t.focusSessions.length ? db.focusSessions.bulkPut(t.focusSessions) : Promise.resolve(),
        t.learningStages.length ? db.learningStages.bulkPut(t.learningStages) : Promise.resolve(),
        t.dsaProblems.length ? db.dsaProblems.bulkPut(t.dsaProblems) : Promise.resolve(),
        t.awarenessLogs.length ? db.awarenessLogs.bulkPut(t.awarenessLogs) : Promise.resolve(),
        t.savedResources.length ? db.savedResources.bulkPut(t.savedResources) : Promise.resolve(),
        t.placementTopics.length ? db.placementTopics.bulkPut(t.placementTopics) : Promise.resolve(),
        t.placementSessions.length ? db.placementSessions.bulkPut(t.placementSessions) : Promise.resolve(),
        t.projects.length ? db.projects.bulkPut(t.projects) : Promise.resolve(),
        t.internshipApplications.length ? db.internshipApplications.bulkPut(t.internshipApplications) : Promise.resolve(),
        t.mastersMilestones.length ? db.mastersMilestones.bulkPut(t.mastersMilestones) : Promise.resolve(),
        t.universities.length ? db.universities.bulkPut(t.universities) : Promise.resolve(),
        t.careerChecklist?.length ? db.careerChecklist.bulkPut(t.careerChecklist) : Promise.resolve(),
      ]);
    }
  );
}
