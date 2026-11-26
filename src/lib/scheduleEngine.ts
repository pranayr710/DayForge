import type {
  ResolvedScheduleBlock,
  ScheduleInstance,
  ScheduleTemplate,
} from '@/types';
import { getDayOfWeekFromDateKey, parseTimeToMinutes } from './dateUtils';

function normalizeBlockTimes(startTime: string, endTime: string) {
  const startMinutes = parseTimeToMinutes(startTime);
  let endMinutes = parseTimeToMinutes(endTime);
  const crossesMidnight = endMinutes <= startMinutes;
  if (crossesMidnight) {
    endMinutes += 1440;
  }
  return { startMinutes, endMinutes, crossesMidnight };
}

export function resolveDaySchedule(params: {
  dateKey: string;
  templates: ScheduleTemplate[];
  instances: ScheduleInstance[];
  electiveThreeName?: string;
}): ResolvedScheduleBlock[] {
  const { dateKey, templates, instances, electiveThreeName } = params;
  const dayOfWeek = getDayOfWeekFromDateKey(dateKey);

  const dayInstances = instances.filter((inst) => inst.dateKey === dateKey);
  const instanceByTemplateId = new Map<string, ScheduleInstance>();
  const customInstances: ScheduleInstance[] = [];

  for (const inst of dayInstances) {
    if (inst.templateId) {
      instanceByTemplateId.set(inst.templateId, inst);
    } else if (inst.isCustom && !inst.isCancelled) {
      customInstances.push(inst);
    }
  }

  const resolved: ResolvedScheduleBlock[] = [];

  const dayTemplates = templates.filter(
    (tpl) => tpl.isActive && tpl.dayOfWeek === dayOfWeek
  );

  for (const tpl of dayTemplates) {
    const override = instanceByTemplateId.get(tpl.id);
    if (override?.isCancelled) {
      continue;
    }

    const baseTitle =
      tpl.title === 'Professional Elective III' &&
      electiveThreeName &&
      electiveThreeName.trim().length > 0
        ? electiveThreeName.trim()
        : tpl.title;

    const startTime = override?.startTime ?? tpl.startTime;
    const endTime = override?.endTime ?? tpl.endTime;
    const { startMinutes, endMinutes, crossesMidnight } = normalizeBlockTimes(
      startTime,
      endTime
    );

    const status =
      override?.status ?? (override?.completed ? 'done' : 'planned');
    const loggedSeconds =
      override?.loggedSeconds ??
      (override?.loggedMinutes != null ? override.loggedMinutes * 60 : 0);

    resolved.push({
      instanceId: override?.id,
      templateId: tpl.id,
      dateKey,
      source: tpl.source,
      category: override?.category ?? tpl.category,
      subjectCode: override?.subjectCode ?? tpl.subjectCode,
      title: override?.title ?? baseTitle,
      subtitle: override?.subtitle ?? tpl.subtitle,
      location: override?.location ?? tpl.location,
      startTime,
      endTime,
      startMinutes,
      endMinutes,
      crossesMidnight,
      completed: status === 'done',
      completedAt: override?.completedAt,
      status,
      loggedMinutes: Math.floor(loggedSeconds / 60),
      loggedSeconds,
      isCustom: false,
      isRescheduled: Boolean(
        override &&
          (override.startTime !== tpl.startTime ||
            override.endTime !== tpl.endTime)
      ),
      notes: override?.notes,
    });
  }

  for (const custom of customInstances) {
    const { startMinutes, endMinutes, crossesMidnight } = normalizeBlockTimes(
      custom.startTime,
      custom.endTime
    );
    const status = custom.status ?? (custom.completed ? 'done' : 'planned');
    const loggedSeconds =
      custom.loggedSeconds ??
      (custom.loggedMinutes != null ? custom.loggedMinutes * 60 : 0);
    resolved.push({
      instanceId: custom.id,
      dateKey,
      source: 'custom',
      category: custom.category,
      subjectCode: custom.subjectCode,
      title: custom.title,
      subtitle: custom.subtitle,
      location: custom.location,
      startTime: custom.startTime,
      endTime: custom.endTime,
      startMinutes,
      endMinutes,
      crossesMidnight,
      completed: status === 'done',
      completedAt: custom.completedAt,
      status,
      loggedMinutes: Math.floor(loggedSeconds / 60),
      loggedSeconds,
      isCustom: true,
      isRescheduled: false,
      notes: custom.notes,
    });
  }

  // Sort chronologically (keeping early morning 00:15 Sleep after 23:30 wind-down if ordered by template)
  resolved.sort((a, b) => {
    const aSort = a.startMinutes < 240 ? a.startMinutes + 1440 : a.startMinutes;
    const bSort = b.startMinutes < 240 ? b.startMinutes + 1440 : b.startMinutes;
    return aSort - bSort;
  });

  // Detect genuine overlaps between non-break blocks
  const nonBreakIndices: number[] = [];
  resolved.forEach((b, idx) => {
    if (b.category !== 'break' && b.title !== 'Sleep') {
      nonBreakIndices.push(idx);
    }
  });

  for (let i = 0; i < nonBreakIndices.length; i++) {
    for (let j = i + 1; j < nonBreakIndices.length; j++) {
      const a = resolved[nonBreakIndices[i]!]!;
      const b = resolved[nonBreakIndices[j]!]!;
      const aStart = a.startMinutes < 240 ? a.startMinutes + 1440 : a.startMinutes;
      const aEnd = a.endMinutes < 240 ? a.endMinutes + 1440 : a.endMinutes;
      const bStart = b.startMinutes < 240 ? b.startMinutes + 1440 : b.startMinutes;
      const bEnd = b.endMinutes < 240 ? b.endMinutes + 1440 : b.endMinutes;
      if (aStart < bEnd && bStart < aEnd) {
        a.hasConflict = true;
        b.hasConflict = true;
      }
    }
  }

  return resolved;
}

export function findCurrentAndNextBlocks(
  blocks: ResolvedScheduleBlock[],
  minutesFromMidnight: number
): {
  currentBlock: ResolvedScheduleBlock | null;
  nextBlock: ResolvedScheduleBlock | null;
  remainingMinutes: number;
} {
  const normalizedNow =
    minutesFromMidnight < 240 ? minutesFromMidnight + 1440 : minutesFromMidnight;

  let currentBlock: ResolvedScheduleBlock | null = null;
  let nextBlock: ResolvedScheduleBlock | null = null;

  for (const block of blocks) {
    const start =
      block.startMinutes < 240 ? block.startMinutes + 1440 : block.startMinutes;
    const end =
      block.endMinutes < 240 ? block.endMinutes + 1440 : block.endMinutes;

    if (normalizedNow >= start && normalizedNow < end && !currentBlock) {
      currentBlock = block;
      continue;
    }

    if (start > normalizedNow && !nextBlock) {
      nextBlock = block;
    }
  }

  const remainingMinutes = currentBlock
    ? Math.max(
        0,
        (currentBlock.endMinutes < 240
          ? currentBlock.endMinutes + 1440
          : currentBlock.endMinutes) - normalizedNow
      )
    : 0;

  return { currentBlock, nextBlock, remainingMinutes };
}
