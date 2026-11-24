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
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  // Position of the glowing comet head at the tip of the progress arc
  // (the SVG is rotated -90°, so angle 0 renders at 12 o'clock).
  const tipAngle = progress * 2 * Math.PI;
  const tipX = 100 + radius * Math.cos(tipAngle);
  const tipY = 100 + radius * Math.sin(tipAngle);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[radial-gradient(70%_60%_at_50%_35%,rgba(45,36,130,0.55),rgba(3,4,8,0.92))] backdrop-blur-2xl p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Focus Mode"
        >
          {/* Ambient focus aurora */}
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
            <div
              className={cn(
                'absolute left-1/2 top-[38%] h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(109,100,240,0.45),transparent)] blur-3xl',
                isRunning && 'df-breathe'
              )}
            />
            <div className="absolute left-[30%] top-[60%] h-[40vmin] w-[40vmin] rounded-full bg-[radial-gradient(closest-side,rgba(94,231,247,0.18),transparent)] blur-3xl" />
          </div>

          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: 'spring', stiffness: 300, damping: 28 }
            }
            className="relative my-auto w-full max-w-md rounded-[32px] df-glass-elevated p-6 sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 rounded-full df-well px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--df-accent-secondary)]">
                <span
                  className={cn(
                    'df-dot-live h-1.5 w-1.5 rounded-full',
                    isRunning
                      ? 'bg-[var(--df-success)] text-[var(--df-success)]'
                      : 'bg-[var(--df-accent-secondary)] text-transparent'
                  )}
                />
                <Timer className="h-3.5 w-3.5" />
                <span>{isRunning ? 'In Flow' : 'Focus Mode'}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeFocus}
                aria-label="Minimize Focus Mode"
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 text-center">
              <h2 className="df-text-gradient text-xl font-semibold tracking-[-0.025em]">
                {taskTitle}
              </h2>
              {objective && (
                <p className="mt-1 text-xs text-[var(--df-text-muted)]">
                  Objective: {objective}
                </p>
              )}
            </div>

            <div className="my-6 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <svg className="h-56 w-56 -rotate-90 overflow-visible" viewBox="0 0 200 200" aria-hidden="true">
                  <defs>
                    <linearGradient id="focus-ring-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8F87FA" />
                      <stop offset="50%" stopColor="#B79CFF" />
                      <stop offset="100%" stopColor="#5EE7F7" />
                    </linearGradient>
                    <filter id="focus-ring-glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="4" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Tick marks around the dial */}
                  {Array.from({ length: 60 }, (_, i) => {
                    const a = (i / 60) * 2 * Math.PI;
                    const major = i % 5 === 0;
                    const r1 = 98;
                    const r2 = major ? 92 : 95;
                    return (
                      <line
                        key={i}
                        x1={100 + r1 * Math.cos(a)}
                        y1={100 + r1 * Math.sin(a)}
                        x2={100 + r2 * Math.cos(a)}
                        y2={100 + r2 * Math.sin(a)}
                        stroke="var(--df-text-faint)"
                        strokeOpacity={major ? 0.55 : 0.22}
                        strokeWidth={major ? 1.2 : 0.8}
                      />
                    );
                  })}
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="var(--df-border-strong)"
                    strokeOpacity="0.6"
                    strokeWidth="7"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="url(#focus-ring-grad)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    filter="url(#focus-ring-glow)"
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                  />
                  {progress > 0.002 && (
                    <circle
                      cx={tipX}
                      cy={tipY}
                      r="5.5"
                      fill="#fff"
                      filter="url(#focus-ring-glow)"
                      className="transition-all duration-1000 ease-linear"
                    />
                  )}
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-mono-tabular text-[46px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-text)] drop-shadow-[0_0_24px_rgba(143,135,250,0.45)]">
                    {formatClock(remainingSeconds)}
                  </span>
                  <span className="mt-2 df-eyebrow">
                    {isRunning ? 'remaining' : elapsedSeconds > 0 ? 'paused' : 'ready'}
                  </span>
                </div>
              </div>
              <span className="mt-4 rounded-full df-well px-3 py-1 font-mono-tabular text-[11px] text-[var(--df-text-muted)]">
                Logged {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s · Target {plannedMinutes}m
              </span>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-mono-tabular transition-all duration-200 cursor-pointer',
                    plannedMinutes === mins
                      ? 'border-[#8F87FA]/60 bg-[linear-gradient(135deg,rgba(109,100,240,0.35),rgba(94,231,247,0.1))] text-white shadow-[0_0_18px_-4px_rgba(109,100,240,0.8)]'
                      : 'border-[var(--df-border)] bg-[var(--df-inset)] text-[var(--df-text-muted)] hover:border-[var(--df-border-strong)] hover:text-[var(--df-text)]'
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
                  className="h-8 w-24 rounded-full text-xs"
                  aria-label="Custom duration in minutes"
                />
                <Button type="submit" size="sm" variant="outline" className="rounded-full">
                  Set
                </Button>
              </form>
            </div>

            <div className="mb-5">
              <label
                htmlFor="focus-session-notes"
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--df-text-faint)]"
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
              <Button variant="primary" size="lg" className="flex-1 rounded-2xl" onClick={toggleRun}>
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
              <Button variant="secondary" size="lg" className="rounded-2xl" onClick={() => void finishSession()}>
                <CheckSquare className="h-4 w-4" />
                Finish Session
              </Button>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--df-text-faint)]">
              Finishing logs your actual focus time without automatically marking the task completed.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
