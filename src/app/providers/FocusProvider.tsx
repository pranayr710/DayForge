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
import { recordFocusSession } from '@/services/storage/repositories';
import { getNowParts } from '@/lib/dateUtils';
import { useToast } from './ToastProvider';

export interface StartFocusInput {
  taskId?: string;
  taskTitle: string;
  objective?: string;
  minutes?: number;
}

interface FocusContextValue {
  isOpen: boolean;
  isRunning: boolean;
  taskTitle: string;
  objective: string;
  plannedMinutes: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  notes: string;
  setNotes: (notes: string) => void;
  openFocus: (input?: StartFocusInput) => void;
  closeFocus: () => void;
  setDurationMinutes: (mins: number) => void;
  toggleRun: () => void;
  finishSession: () => Promise<void>;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [taskId, setTaskId] = useState<string | undefined>(undefined);
  const [taskTitle, setTaskTitle] = useState('Focused Work');
  const [objective, setObjective] = useState('');
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const startedAtRef = useRef<string | null>(null);
  // Wall-clock timekeeping so background-tab throttling can't under-count.
  const runStartRef = useRef<number | null>(null); // ms timestamp of current run segment
  const baseElapsedRef = useRef(0); // seconds accumulated across previous segments

  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const timezone = profile?.timezone ?? 'Asia/Kolkata';

  useEffect(() => {
    if (!isRunning) return;
    const tick = () => {
      const started = runStartRef.current ?? Date.now();
      const elapsed = baseElapsedRef.current + (Date.now() - started) / 1000;
      const total = plannedMinutes * 60;
      const clamped = Math.min(elapsed, total);
      setElapsedSeconds(Math.floor(clamped));
      const remaining = Math.max(0, Math.round(total - clamped));
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        baseElapsedRef.current = total;
        runStartRef.current = null;
        setIsRunning(false);
      }
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [isRunning, plannedMinutes]);

  const openFocus = useCallback((input?: StartFocusInput) => {
    const mins = input?.minutes ?? 25;
    setTaskId(input?.taskId);
    setTaskTitle(input?.taskTitle ?? 'Focused Work');
    setObjective(input?.objective ?? '');
    setPlannedMinutes(mins);
    setRemainingSeconds(mins * 60);
    setElapsedSeconds(0);
    setNotes('');
    startedAtRef.current = new Date().toISOString();
    baseElapsedRef.current = 0;
    runStartRef.current = input ? Date.now() : null;
    setIsRunning(Boolean(input));
    setIsOpen(true);
  }, []);

  const closeFocus = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setDurationMinutes = useCallback((mins: number) => {
    const safe = Math.max(1, Math.min(240, Math.round(mins)));
    setPlannedMinutes(safe);
    setRemainingSeconds(safe * 60);
    setElapsedSeconds(0);
    baseElapsedRef.current = 0;
    runStartRef.current = null;
    setIsRunning(false);
  }, []);

  const toggleRun = useCallback(() => {
    setIsRunning((prev) => {
      if (prev) {
        // Pausing: fold the current run segment into the accumulator.
        if (runStartRef.current != null) {
          baseElapsedRef.current += (Date.now() - runStartRef.current) / 1000;
          runStartRef.current = null;
        }
        return false;
      }
      // Starting / resuming.
      if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
      runStartRef.current = Date.now();
      return true;
    });
  }, []);

  const finishSession = useCallback(async () => {
    setIsRunning(false);
    const endedAt = new Date().toISOString();
    const startedAt = startedAtRef.current ?? endedAt;
    const { dateKey } = getNowParts(timezone);

    // Compute final elapsed from wall-clock refs (accurate even if the tab was
    // backgrounded), capped at the planned duration.
    const liveSegment =
      runStartRef.current != null ? (Date.now() - runStartRef.current) / 1000 : 0;
    const finalElapsed = Math.min(
      Math.round(baseElapsedRef.current + liveSegment),
      plannedMinutes * 60
    );

    if (finalElapsed > 0) {
      await recordFocusSession({
        taskId,
        taskTitle,
        objective: objective.trim() || undefined,
        plannedMinutes,
        actualSeconds: finalElapsed,
        notes: notes.trim() || undefined,
        startedAt,
        endedAt,
        dateKey,
      });
      toast('Focus session saved', {
        description: `${Math.max(1, Math.round(finalElapsed / 60))}m logged for "${taskTitle}". Task status was left unchanged.`,
        tone: 'success',
      });
    }

    startedAtRef.current = null;
    baseElapsedRef.current = 0;
    runStartRef.current = null;
    setElapsedSeconds(0);
    setRemainingSeconds(plannedMinutes * 60);
    setIsOpen(false);
  }, [notes, objective, plannedMinutes, taskId, taskTitle, toast, timezone]);

  return (
    <FocusContext.Provider
      value={{
        isOpen,
        isRunning,
        taskTitle,
        objective,
        plannedMinutes,
        remainingSeconds,
        elapsedSeconds,
        notes,
        setNotes,
        openFocus,
        closeFocus,
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
