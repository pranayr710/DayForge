import { useState } from 'react';
import { Pause, Play, CheckSquare, Timer, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useFocusTimer } from '@/app/providers/FocusProvider';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/FormControls';
import { cn } from '@/lib/utils';

const PRESETS = [25, 45, 60] as const;

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function FocusModal() {
  const {
    isOpen,
    isRunning,
    taskTitle,
    objective,
    plannedMinutes,
    remainingSeconds,
    elapsedSeconds,
    notes,
    setNotes,
    closeFocus,
    setDurationMinutes,
    toggleRun,
    finishSession,
  } = useFocusTimer();

  const [customInput, setCustomInput] = useState('');
  const reduced = useReducedMotion();

  const totalTargetSeconds = Math.max(1, plannedMinutes * 60);
  const progress = Math.min(1, Math.max(0, 1 - remainingSeconds / totalTargetSeconds));
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#090B10]/80 backdrop-blur-xl p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Focus Mode"
        >
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: 'spring', stiffness: 340, damping: 28 }
            }
            className="w-full max-w-md rounded-3xl df-glass-elevated p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#8178F5]">
                <span className={cn('h-2 w-2 rounded-full', isRunning ? 'bg-[#16A34A] animate-pulse' : 'bg-[#8178F5]')} />
                <Timer className="h-4 w-4" />
                <span>Focus Mode</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeFocus}
                aria-label="Minimize Focus Mode"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-semibold text-[var(--df-text)]">
                {taskTitle}
              </h2>
              {objective && (
                <p className="mt-1 text-xs text-[var(--df-text-muted)]">
                  Objective: {objective}
                </p>
              )}
            </div>

            <div className="my-5 flex flex-col items-center rounded-2xl border border-[var(--df-border)] bg-[var(--df-bg)]/65 py-6">
              <div className="relative flex items-center justify-center">
                <svg className="h-40 w-40 -rotate-90" viewBox="0 0 144 144" aria-hidden="true">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke="#635BDB"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    className="transition-[stroke-dashoffset] duration-700 ease-out"
                  />
                </svg>
                <span className="absolute font-mono-tabular text-3xl font-semibold tracking-tight text-[var(--df-text)]">
                  {formatClock(remainingSeconds)}
                </span>
              </div>
              <span className="mt-2 font-mono-tabular text-xs text-[var(--df-text-muted)]">
                Logged: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s · Target {plannedMinutes}m
              </span>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-mono-tabular transition-colors cursor-pointer',
                    plannedMinutes === mins
                      ? 'border-[#635BDB] bg-[#635BDB]/18 text-[#8178F5]'
                      : 'border-[var(--df-border)] text-[var(--df-text-muted)] hover:text-[var(--df-text)]'
                  )}
                >
                  {mins}m
                </button>
              ))}
              <form
                className="flex items-center gap-1.5 ml-auto"
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = Number(customInput);
                  if (Number.isFinite(val) && val >= 1 && val <= 240) {
                    setDurationMinutes(val);
                    setCustomInput('');
                  }
                }}
              >
                <Input
                  type="number"
                  min={1}
                  max={240}
                  placeholder="Custom m"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="h-8 w-24 text-xs"
                  aria-label="Custom duration in minutes"
                />
                <Button type="submit" size="sm" variant="outline">
                  Set
                </Button>
              </form>
            </div>

            <div className="mb-5">
              <label
                htmlFor="focus-session-notes"
                className="mb-1 block text-xs font-medium text-[var(--df-text-muted)]"
              >
                Session notes
              </label>
              <Textarea
                id="focus-session-notes"
                placeholder="Capture approach, blockers, or key takeaways..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[72px] text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="primary" className="flex-1" onClick={toggleRun}>
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    {elapsedSeconds > 0 ? 'Resume' : 'Start Timer'}
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={() => void finishSession()}>
                <CheckSquare className="h-4 w-4" />
                Finish Session
              </Button>
            </div>

            <p className="mt-3 text-center text-[11px] text-[var(--df-text-muted)]">
              Finishing logs your actual focus time without automatically marking the task completed.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
