import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID } from '@/config/personalPlan';
import {
  recordFocusSession,
  setScheduleBlockStatus,
  toggleTaskCompleted,
} from '@/services/storage/repositories';
import { formatDurationSeconds, getNowParts } from '@/lib/dateUtils';
import type { ResolvedScheduleBlock } from '@/types';
import { useToast } from './ToastProvider';

const ACTIVE_FOCUS_STORAGE_KEY = 'dayforge.activeFocus.v1';
const MAX_SESSION_SECONDS = 8 * 3600;

export type FocusFinishMode = 'done' | 'partial' | 'session';

export interface StartFocusInput {
  taskId?: string;
  scheduleBlock?: ResolvedScheduleBlock;
  taskTitle: string;
  objective?: string;
  minutes?: number;
}

interface PersistedFocusState {
  isOpen: boolean;
  isRunning: boolean;
  taskId?: string;
  scheduleBlock?: ResolvedScheduleBlock;
  taskTitle: string;
  objective: string;
  plannedMinutes: number;
  notes: string;
  startedAt: string | null;
  runStartMs: number | null;
  baseElapsedSec: number;
}

function loadPersistedFocus(): PersistedFocusState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_FOCUS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedFocusState;
    if (!parsed || typeof parsed.plannedMinutes !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedFocus(state: PersistedFocusState | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!state) {
      window.localStorage.removeItem(ACTIVE_FOCUS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ACTIVE_FOCUS_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota or private-mode failures.
  }
}

function computeInitialElapsed(p: PersistedFocusState | null): number {
  if (!p) return 0;
  const live = p.isRunning && p.runStartMs != null ? (Date.now() - p.runStartMs) / 1000 : 0;
  return Math.floor(Math.min(p.baseElapsedSec + live, MAX_SESSION_SECONDS));
}

interface FocusContextValue {
  isOpen: boolean;
  isRunning: boolean;
  hasLinkedTask: boolean;
  hasLinkedSchedule: boolean;
  taskTitle: string;
  objective: string;
  plannedMinutes: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  overtimeSeconds: number;
  notes: string;
  setNotes: (notes: string) => void;
  openFocus: (input?: StartFocusInput) => void;
  closeFocus: () => void;
  resetFocus: () => void;
  setDurationMinutes: (mins: number) => void;
  toggleRun: () => void;
  finishSession: (mode?: FocusFinishMode) => Promise<void>;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const initial = useRef<PersistedFocusState | null>(loadPersistedFocus());
  const initialElapsed = useRef<number>(computeInitialElapsed(initial.current));

  const [isOpen, setIsOpen] = useState(() => initial.current?.isOpen ?? false);
  const [isRunning, setIsRunning] = useState(() => initial.current?.isRunning ?? false);
  const [taskId, setTaskId] = useState<string | undefined>(() => initial.current?.taskId);
  const [scheduleBlock, setScheduleBlock] = useState<ResolvedScheduleBlock | undefined>(
    () => initial.current?.scheduleBlock
  );
  const [taskTitle, setTaskTitle] = useState(
    () => initial.current?.taskTitle ?? 'Focused Work'
  );
  const [objective, setObjective] = useState(() => initial.current?.objective ?? '');
  const [plannedMinutes, setPlannedMinutes] = useState(
    () => initial.current?.plannedMinutes ?? 25
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(() => initialElapsed.current);
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const total = (initial.current?.plannedMinutes ?? 25) * 60;
    return Math.max(0, total - initialElapsed.current);
  });
  const [overtimeSeconds, setOvertimeSeconds] = useState(() => {
    const total = (initial.current?.plannedMinutes ?? 25) * 60;
    return Math.max(0, initialElapsed.current - total);
  });
  const [notes, setNotes] = useState(() => initial.current?.notes ?? '');

  const startedAtRef = useRef<string | null>(initial.current?.startedAt ?? null);
  const runStartRef = useRef<number | null>(initial.current?.runStartMs ?? null);
  const baseElapsedRef = useRef<number>(initial.current?.baseElapsedSec ?? 0);
  const overtimeNotifiedRef = useRef<boolean>(
    initialElapsed.current >= (initial.current?.plannedMinutes ?? 25) * 60
  );

  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const timezone = profile?.timezone ?? 'Asia/Kolkata';

  const persistSnapshot = useCallback(
    (overrides?: Partial<PersistedFocusState>) => {
      const next: PersistedFocusState = {
        isOpen,
        isRunning,
        taskId,
        scheduleBlock,
        taskTitle,
        objective,
        plannedMinutes,
        notes,
        startedAt: startedAtRef.current,
        runStartMs: runStartRef.current,
        baseElapsedSec: baseElapsedRef.current,
        ...overrides,
      };
      if (!next.isOpen && !next.isRunning && next.baseElapsedSec === 0) {
        savePersistedFocus(null);
      } else {
        savePersistedFocus(next);
      }
    },
    [isOpen, isRunning, taskId, scheduleBlock, taskTitle, objective, plannedMinutes, notes]
  );

  useEffect(() => {
    persistSnapshot();
  }, [persistSnapshot]);

  useEffect(() => {
    if (!isRunning) return;
    const tick = () => {
      const started = runStartRef.current ?? Date.now();
      const elapsed = Math.min(
        baseElapsedRef.current + (Date.now() - started) / 1000,
        MAX_SESSION_SECONDS
      );
      const total = plannedMinutes * 60;
      const floored = Math.floor(elapsed);
      setElapsedSeconds(floored);
      setRemainingSeconds(Math.max(0, total - floored));
      const overtime = Math.max(0, floored - total);
      setOvertimeSeconds(overtime);

      if (floored >= total && !overtimeNotifiedRef.current) {
        overtimeNotifiedRef.current = true;
        toast('Slot time reached — continuing in overtime', {
          description: 'Timer keeps running until you tap Done or Pause.',
          tone: 'info',
        });
      }

      if (floored >= MAX_SESSION_SECONDS) {
        baseElapsedRef.current = MAX_SESSION_SECONDS;
        runStartRef.current = null;
        setIsRunning(false);
      }
    };
    tick();
    const id = window.setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [isRunning, plannedMinutes, toast]);

  const openFocus = useCallback(
    (input?: StartFocusInput) => {
      if (!input) {
        setIsOpen(true);
        return;
      }

      const liveNow =
        runStartRef.current != null ? (Date.now() - runStartRef.current) / 1000 : 0;
      const activeElapsed = Math.min(
        Math.round(baseElapsedRef.current + liveNow),
        MAX_SESSION_SECONDS
      );

      const isDifferentItem =
        (input.taskId && input.taskId !== taskId) ||
        (input.scheduleBlock &&
          (input.scheduleBlock.dateKey !== scheduleBlock?.dateKey ||
            input.scheduleBlock.templateId !== scheduleBlock?.templateId ||
            input.scheduleBlock.instanceId !== scheduleBlock?.instanceId)) ||
        (!input.taskId && !input.scheduleBlock && input.taskTitle !== taskTitle);

      if (activeElapsed > 0 && isDifferentItem) {
        const prevEndedAt = new Date().toISOString();
        const prevStartedAt = startedAtRef.current ?? prevEndedAt;
        const { dateKey: prevDateKey } = getNowParts(timezone);
        const prevBlock = scheduleBlock;
        const prevTitle = taskTitle;
        const prevTaskId = taskId;
        const prevPlanned = plannedMinutes;
        const prevObjective = objective.trim() || undefined;
        const prevNotes = notes.trim() || undefined;

        void (async () => {
          await recordFocusSession({
            taskId: prevTaskId,
            scheduleDateKey: prevBlock?.dateKey,
            scheduleTemplateId: prevBlock?.templateId,
            scheduleInstanceId: prevBlock?.instanceId,
            taskTitle: prevTitle,
            objective: prevObjective,
            plannedMinutes: prevPlanned,
            actualSeconds: activeElapsed,
            markedCompleted: false,
            completedEarly: false,
            notes: prevNotes,
            startedAt: prevStartedAt,
            endedAt: prevEndedAt,
            dateKey: prevDateKey,
          });
          if (prevBlock) {
            await setScheduleBlockStatus(prevBlock, 'partial', {
              addSeconds: activeElapsed,
              notes: prevNotes,
            });
          }
        })();

        toast('Previous focus saved as partial', {
          description: `Logged ${formatDurationSeconds(activeElapsed)} for "${prevTitle}" before switching.`,
          tone: 'info',
        });
      }

      const slotDuration = input.scheduleBlock
        ? Math.max(
            5,
            Math.min(
              240,
              input.scheduleBlock.endMinutes - input.scheduleBlock.startMinutes
            )
          )
        : undefined;
      const mins = input.minutes ?? slotDuration ?? 25;
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();

      setTaskId(input.taskId);
      setScheduleBlock(input.scheduleBlock);
      setTaskTitle(input.taskTitle);
      setObjective(input.objective ?? '');
      setPlannedMinutes(mins);
      setRemainingSeconds(mins * 60);
      setElapsedSeconds(0);
      setOvertimeSeconds(0);
      setNotes('');
      startedAtRef.current = nowIso;
      baseElapsedRef.current = 0;
      runStartRef.current = nowMs;
      overtimeNotifiedRef.current = false;
      setIsRunning(true);
      setIsOpen(true);

      savePersistedFocus({
        isOpen: true,
        isRunning: true,
        taskId: input.taskId,
        scheduleBlock: input.scheduleBlock,
        taskTitle: input.taskTitle,
        objective: input.objective ?? '',
        plannedMinutes: mins,
        notes: '',
        startedAt: nowIso,
        runStartMs: nowMs,
        baseElapsedSec: 0,
      });
    },
    [notes, objective, plannedMinutes, scheduleBlock, taskId, taskTitle, timezone, toast]
  );

  const closeFocus = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetFocus = useCallback(() => {
    setIsRunning(false);
    startedAtRef.current = null;
    baseElapsedRef.current = 0;
    runStartRef.current = null;
    overtimeNotifiedRef.current = false;
    setElapsedSeconds(0);
    setRemainingSeconds(plannedMinutes * 60);
    setOvertimeSeconds(0);
    setNotes('');
    setTaskId(undefined);
    setScheduleBlock(undefined);
    setIsOpen(false);
    savePersistedFocus(null);
  }, [plannedMinutes]);

  const setDurationMinutes = useCallback((mins: number) => {
    const safe = Math.max(1, Math.min(240, Math.round(mins)));
    const live =
      runStartRef.current != null ? (Date.now() - runStartRef.current) / 1000 : 0;
    const currentElapsed = Math.floor(
      Math.min(baseElapsedRef.current + live, MAX_SESSION_SECONDS)
    );
    const nextTarget = safe * 60;
    setPlannedMinutes(safe);
    setRemainingSeconds(Math.max(0, nextTarget - currentElapsed));
    setOvertimeSeconds(Math.max(0, currentElapsed - nextTarget));
    overtimeNotifiedRef.current = currentElapsed >= nextTarget;
  }, []);

  const toggleRun = useCallback(() => {
    setIsRunning((prev) => {
      if (prev) {
        if (runStartRef.current != null) {
          baseElapsedRef.current += (Date.now() - runStartRef.current) / 1000;
          runStartRef.current = null;
        }
        return false;
      }
      if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
      runStartRef.current = Date.now();
      return true;
    });
  }, []);

  const finishSession = useCallback(
    async (mode: FocusFinishMode = 'session') => {
      setIsRunning(false);
      const endedAt = new Date().toISOString();
      const startedAt = startedAtRef.current ?? endedAt;
      const { dateKey } = getNowParts(timezone);

      const liveSegment =
        runStartRef.current != null ? (Date.now() - runStartRef.current) / 1000 : 0;
      const finalElapsed = Math.min(
        Math.round(baseElapsedRef.current + liveSegment),
        MAX_SESSION_SECONDS
      );
      const targetSeconds = plannedMinutes * 60;
      const completedEarly =
        mode === 'done' && finalElapsed > 0 && finalElapsed < targetSeconds;
      const overtimeSecs = Math.max(0, finalElapsed - targetSeconds);
      const exactLabel = formatDurationSeconds(finalElapsed);
      const trimmedNotes = notes.trim() || undefined;

      if (finalElapsed > 0) {
        await recordFocusSession({
          taskId,
          scheduleDateKey: scheduleBlock?.dateKey,
          scheduleTemplateId: scheduleBlock?.templateId,
          scheduleInstanceId: scheduleBlock?.instanceId,
          taskTitle,
          objective: objective.trim() || undefined,
          plannedMinutes,
          actualSeconds: finalElapsed,
          markedCompleted: mode === 'done',
          completedEarly,
          notes: trimmedNotes,
          startedAt,
          endedAt,
          dateKey,
        });
      }

      if (mode === 'done') {
        const earlyDiffLabel = formatDurationSeconds(targetSeconds - finalElapsed);
        const overtimeDiffLabel = formatDurationSeconds(overtimeSecs);
        const detail =
          overtimeSecs > 0
            ? `Completed "${taskTitle}" in ${exactLabel} (+${overtimeDiffLabel} overtime).`
            : completedEarly
              ? `Completed "${taskTitle}" in ${exactLabel} (${earlyDiffLabel} early).`
              : finalElapsed > 0
                ? `${exactLabel} logged and marked completed.`
                : `"${taskTitle}" marked completed.`;

        if (scheduleBlock) {
          await setScheduleBlockStatus(scheduleBlock, 'done', {
            addSeconds: finalElapsed > 0 ? finalElapsed : undefined,
            notes: trimmedNotes,
          });
          toast('Slot marked Done', { description: detail, tone: 'success' });
        } else if (taskId) {
          const existingTask = await db.tasks.get(taskId);
          if (existingTask && !existingTask.completed) {
            await toggleTaskCompleted(existingTask);
          }
          toast('Task marked Done', { description: detail, tone: 'success' });
        } else if (finalElapsed > 0) {
          toast('Focus session saved', {
            description: `${exactLabel} logged for "${taskTitle}".`,
            tone: 'success',
          });
        }
      } else if (mode === 'partial') {
        if (scheduleBlock) {
          await setScheduleBlockStatus(scheduleBlock, 'partial', {
            addSeconds: finalElapsed > 0 ? finalElapsed : undefined,
            notes: trimmedNotes,
          });
          toast('Partial progress saved', {
            description:
              finalElapsed > 0
                ? `${exactLabel} logged on "${taskTitle}" — slot marked Partial.`
                : `"${taskTitle}" marked Partial.`,
            tone: 'info',
          });
        } else if (finalElapsed > 0) {
          toast('Partial session saved', {
            description: `${exactLabel} logged for "${taskTitle}". Task kept active.`,
            tone: 'info',
          });
        }
      } else if (finalElapsed > 0) {
        toast('Focus session saved', {
          description: `${exactLabel} logged for "${taskTitle}".`,
          tone: 'success',
        });
      }

      startedAtRef.current = null;
      baseElapsedRef.current = 0;
      runStartRef.current = null;
      overtimeNotifiedRef.current = false;
      setElapsedSeconds(0);
      setRemainingSeconds(plannedMinutes * 60);
      setOvertimeSeconds(0);
      setNotes('');
      setTaskId(undefined);
      setScheduleBlock(undefined);
      setIsOpen(false);
      savePersistedFocus(null);
    },
    [notes, objective, plannedMinutes, scheduleBlock, taskId, taskTitle, toast, timezone]
  );

  return (
    <FocusContext.Provider
      value={{
        isOpen,
        isRunning,
        hasLinkedTask: Boolean(taskId),
        hasLinkedSchedule: Boolean(scheduleBlock),
        taskTitle,
        objective,
        plannedMinutes,
        remainingSeconds,
        elapsedSeconds,
        overtimeSeconds,
        notes,
        setNotes,
        openFocus,
        closeFocus,
        resetFocus,
        setDurationMinutes,
        toggleRun,
        finishSession,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocusTimer() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocusTimer must be used inside FocusProvider');
  return ctx;
}
