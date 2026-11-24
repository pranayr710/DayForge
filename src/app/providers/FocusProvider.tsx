import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

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
    setIsRunning(false);
  }, []);

  const toggleRun = useCallback(() => {
    if (!startedAtRef.current) {
      startedAtRef.current = new Date().toISOString();
    }
    setIsRunning((prev) => !prev);
  }, []);

  const finishSession = useCallback(async () => {
    setIsRunning(false);
    const endedAt = new Date().toISOString();
    const startedAt = startedAtRef.current ?? endedAt;
    const { dateKey } = getNowParts('Asia/Kolkata');

    if (elapsedSeconds > 0) {
      await recordFocusSession({
        taskId,
        taskTitle,
        objective: objective.trim() || undefined,
        plannedMinutes,
        actualSeconds: elapsedSeconds,
        notes: notes.trim() || undefined,
        startedAt,
        endedAt,
        dateKey,
      });
      toast('Focus session saved', {
        description: `${Math.max(1, Math.round(elapsedSeconds / 60))}m logged for "${taskTitle}". Task status was left unchanged.`,
        tone: 'success',
      });
    }

    startedAtRef.current = null;
    setElapsedSeconds(0);
    setRemainingSeconds(plannedMinutes * 60);
    setIsOpen(false);
  }, [elapsedSeconds, notes, objective, plannedMinutes, taskId, taskTitle, toast]);

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
