import { db } from './db';
import { createDefaultUserProfile } from '@/config/personalPlan';
import { createDefaultCollegeTemplates } from '@/config/timetable';
import { createDefaultRoutineTemplates } from '@/config/routine';
import { createDefaultLearningStages } from '@/config/curriculum';
import {
  createDefaultMastersMilestones,
  createDefaultPlacementTopics,
} from '@/config/career';

let initPromise: Promise<void> | null = null;

/**
 * Ensures initial configurable templates (user profile, Amrita Sem VI timetable,
 * master daily routines, 16-stage curriculum, placement rotation, and US Master's
 * timeline) are seeded exactly once into IndexedDB. Never fabricates fake progress.
 */
export async function ensureDatabaseSeeded(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const nowIso = new Date().toISOString();

    await db.transaction(
      'rw',
      [
        db.userProfile,
        db.scheduleTemplates,
        db.learningStages,
        db.placementTopics,
        db.mastersMilestones,
      ],
      async () => {
        const profileCount = await db.userProfile.count();
        if (profileCount === 0) {
          await db.userProfile.put(createDefaultUserProfile(nowIso));
        }

        const templateCount = await db.scheduleTemplates.count();
        if (templateCount === 0) {
          await db.scheduleTemplates.bulkPut([
            ...createDefaultCollegeTemplates(nowIso),
            ...createDefaultRoutineTemplates(nowIso),
          ]);
        }

        const stageCount = await db.learningStages.count();
        if (stageCount === 0) {
          await db.learningStages.bulkPut(createDefaultLearningStages(nowIso));
        }

        const placementCount = await db.placementTopics.count();
        if (placementCount === 0) {
          await db.placementTopics.bulkPut(createDefaultPlacementTopics(nowIso));
        }

        const milestoneCount = await db.mastersMilestones.count();
        if (milestoneCount === 0) {
          await db.mastersMilestones.bulkPut(
            createDefaultMastersMilestones(nowIso)
          );
        }
      }
    );
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

export async function resetRecurringTemplatesToDefaults(): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.transaction('rw', [db.scheduleTemplates], async () => {
    await db.scheduleTemplates.clear();
    await db.scheduleTemplates.bulkPut([
      ...createDefaultCollegeTemplates(nowIso),
      ...createDefaultRoutineTemplates(nowIso),
    ]);
  });
}
