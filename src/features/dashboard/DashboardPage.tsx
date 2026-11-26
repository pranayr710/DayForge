import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Flag,
  Plus,
  Sparkles,
  Timer,
  AlertCircle,
  ExternalLink,
  Tv,
  Code2,
} from 'lucide-react';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID, PERSONAL_PLAN_DEFAULTS } from '@/config/personalPlan';
import { PLACEMENT_WEEKLY_ROTATION } from '@/config/career';
import {
  DAILY_READING_WEBSITES,
  getQuickLinksForScheduleBlock,
  getYoutubeChannelForDay,
} from '@/config/awareness';
import { DSA_RESOURCES } from '@/config/curriculum';
import { useIstClock } from '@/hooks/useIstClock';
import { useFocusTimer } from '@/app/providers/FocusProvider';
import { useToast } from '@/app/providers/ToastProvider';
import {
  createTask,
  toggleScheduleBlockCompleted,
  toggleTaskCompleted,
} from '@/services/storage/repositories';
import {
  addDaysToDateKey,
  daysBetweenDateKeys,
  getDateKeyFromIso,
  formatDurationMinutes,
  formatDurationSeconds,
  formatShortDateLabel,
  formatTime24To12,
  getGreeting,
  getShortDayLabel,
  getWeekDateKeys,
} from '@/lib/dateUtils';
import { findCurrentAndNextBlocks, resolveDaySchedule } from '@/lib/scheduleEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormControls';
import { AnimatedNumber, ProgressBar, ProgressRing, Reveal } from '@/components/ui/Primitives';
import { EmptyState } from '@/components/shared/SharedComponents';
import { cn } from '@/lib/utils';
import type { ResolvedScheduleBlock, ScheduleCategory, TaskCategory, TaskPriority } from '@/types';

const CATEGORY_ACCENT: Record<ScheduleCategory, { border: string; badge: string; label: string }> = {
  class: { border: 'border-l-[#635BDB]', badge: 'bg-[#635BDB]/15 text-[#8178F5]', label: 'Class' },
  lab: { border: 'border-l-[#8178F5]', badge: 'bg-[#8178F5]/15 text-[#A59FF8]', label: 'Lab' },
  mentoring: { border: 'border-l-[#16A34A]', badge: 'bg-[#16A34A]/15 text-[#22C55E]', label: 'Mentoring' },
  project: { border: 'border-l-sky-400', badge: 'bg-sky-500/15 text-sky-400', label: 'Project' },
  cir: { border: 'border-l-cyan-400', badge: 'bg-cyan-500/15 text-cyan-300', label: 'CIR' },
  break: { border: 'border-l-[#E5A03C]', badge: 'bg-[#E5A03C]/15 text-[#E5A03C]', label: 'Break' },
  dsa: { border: 'border-l-[#635BDB]', badge: 'bg-[#635BDB]/15 text-[#8178F5]', label: 'DSA' },
  awareness: { border: 'border-l-violet-400', badge: 'bg-violet-500/15 text-violet-300', label: 'Tech 8–9 PM' },
  placement: { border: 'border-l-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300', label: 'Placement' },
  career: { border: 'border-l-amber-400', badge: 'bg-amber-500/15 text-amber-300', label: 'Career' },
  routine: { border: 'border-l-slate-400', badge: 'bg-slate-500/15 text-slate-300', label: 'Routine' },
  personal: { border: 'border-l-zinc-500', badge: 'bg-zinc-500/15 text-zinc-300', label: 'Personal' },
};

const QUICK_CATEGORIES: TaskCategory[] = [
  'College',
  'DSA',
  'Software Engineering',
  'Technology Awareness',
  'Placement Preparation',
  'Projects',
  'Internship',
  "Master's",
  'Personal',
];

export default function DashboardPage() {
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const rawTemplates = useLiveQuery(() => db.scheduleTemplates.toArray(), []);
  const rawInstances = useLiveQuery(() => db.scheduleInstances.toArray(), []);
  const rawTasks = useLiveQuery(() => db.tasks.toArray(), []);
  const rawFocusSessions = useLiveQuery(() => db.focusSessions.toArray(), []);
  const rawStages = useLiveQuery(() => db.learningStages.toArray(), []);
  const rawDsaProblems = useLiveQuery(() => db.dsaProblems.toArray(), []);
  const rawProjects = useLiveQuery(() => db.projects.toArray(), []);
  const rawInternships = useLiveQuery(() => db.internshipApplications.toArray(), []);
  const rawMastersMilestones = useLiveQuery(() => db.mastersMilestones.toArray(), []);
  const rawUniversities = useLiveQuery(() => db.universities.toArray(), []);
  const rawPlacementTopics = useLiveQuery(() => db.placementTopics.toArray(), []);

  const templates = useMemo(() => rawTemplates ?? [], [rawTemplates]);
  const instances = useMemo(() => rawInstances ?? [], [rawInstances]);
  const tasks = useMemo(() => rawTasks ?? [], [rawTasks]);
  const focusSessions = useMemo(() => rawFocusSessions ?? [], [rawFocusSessions]);
  const stages = useMemo(() => rawStages ?? [], [rawStages]);
  const dsaProblems = useMemo(() => rawDsaProblems ?? [], [rawDsaProblems]);
  const projects = useMemo(() => rawProjects ?? [], [rawProjects]);
  const internships = useMemo(() => rawInternships ?? [], [rawInternships]);
  const mastersMilestones = useMemo(() => rawMastersMilestones ?? [], [rawMastersMilestones]);
  const universities = useMemo(() => rawUniversities ?? [], [rawUniversities]);
  const placementTopics = useMemo(() => rawPlacementTopics ?? [], [rawPlacementTopics]);

  const istNow = useIstClock(profile?.timezone ?? 'Asia/Kolkata');
  const { openFocus } = useFocusTimer();
  const { toast } = useToast();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('DSA');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [showAllScheduleOnMobile, setShowAllScheduleOnMobile] = useState(false);

  const todaySchedule = useMemo(
    () =>
      resolveDaySchedule({
        dateKey: istNow.dateKey,
        templates,
        instances,
        electiveThreeName: profile?.electiveThreeName,
      }),
    [istNow.dateKey, templates, instances, profile?.electiveThreeName]
  );

  const yesterdaySchedule = useMemo(
    () =>
      resolveDaySchedule({
        dateKey: addDaysToDateKey(istNow.dateKey, -1),
        templates,
        instances,
        electiveThreeName: profile?.electiveThreeName,
      }),
    [istNow.dateKey, templates, instances, profile?.electiveThreeName]
  );

  const { currentBlock, nextBlock, remainingMinutes } = useMemo(
    () =>
      findCurrentAndNextBlocks(
        todaySchedule,
        istNow.minutesFromMidnight,
        yesterdaySchedule
      ),
    [todaySchedule, istNow.minutesFromMidnight, yesterdaySchedule]
  );

  const actionableTodayBlocks = useMemo(
    () =>
      todaySchedule.filter(
        (b) => b.category !== 'break' && b.title !== 'Sleep' && b.status !== 'skipped'
      ),
    [todaySchedule]
  );

  const completedTodayBlocks = actionableTodayBlocks.filter((b) => b.completed).length;
  const scheduleCompletionPct =
    actionableTodayBlocks.length > 0
      ? Math.round((completedTodayBlocks / actionableTodayBlocks.length) * 100)
      : 0;

  const timezone = profile?.timezone ?? 'Asia/Kolkata';
  // "Today's tasks" = open tasks actionable today (due today or overdue) plus
  // tasks completed today. completedAt is stored in UTC, so compare via IST.
  const todayTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.completed) {
          return t.completedAt
            ? getDateKeyFromIso(t.completedAt, timezone) === istNow.dateKey
            : false;
        }
        return !t.dueDate || t.dueDate <= istNow.dateKey;
      }),
    [tasks, istNow.dateKey, timezone]
  );

  const completedTodayTasks = todayTasks.filter((t) => t.completed).length;
  const focusSecondsToday = useMemo(() => {
    return focusSessions
      .filter((s) => s.dateKey === istNow.dateKey)
      .reduce((acc, s) => acc + s.actualSeconds, 0);
  }, [focusSessions, istNow.dateKey]);

  const priorityTasks = useMemo(() => {
    const rank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return [...tasks]
      .filter((t) => !t.completed)
      .sort((a, b) => {
        const pDiff = rank[a.priority] - rank[b.priority];
        if (pDiff !== 0) return pDiff;
        return (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31');
      })
      .slice(0, 6);
  }, [tasks]);

  // Real progress calculations
  const totalConcepts = stages.reduce((acc, s) => acc + s.concepts.length, 0);
  const completedConcepts = stages.reduce(
    (acc, s) => acc + s.concepts.filter((c) => c.completed).length,
    0
  );
  const curriculumPct =
    totalConcepts > 0 ? Math.round((completedConcepts / totalConcepts) * 100) : 0;

  const solvedDsaCount = dsaProblems.filter((p) => p.status === 'solved').length;
  const placementStudiedCount = placementTopics.filter(
    (p) => p.revisionStatus !== 'not_started'
  ).length;
  const placementPct =
    placementTopics.length > 0
      ? Math.round((placementStudiedCount / placementTopics.length) * 100)
      : 0;

  const activeProjectsPct = useMemo(() => {
    if (projects.length === 0) return 0;
    const sum = projects.reduce((acc, p) => {
      const total = p.tasks.length + p.milestones.length;
      if (total === 0) return acc;
      const done =
        p.tasks.filter((t) => t.completed).length +
        p.milestones.filter((m) => m.completed).length;
      return acc + Math.round((done / total) * 100);
    }, 0);
    return Math.round(sum / projects.length);
  }, [projects]);

  const mastersCompletedCount = mastersMilestones.filter(
    (m) => m.status === 'completed'
  ).length;
  const mastersPct =
    mastersMilestones.length > 0
      ? Math.round((mastersCompletedCount / mastersMilestones.length) * 100)
      : 0;

  const upcomingDeadlines = useMemo(() => {
    const items: Array<{ id: string; title: string; source: string; dateKey: string; daysLeft: number }> = [];
    for (const t of tasks) {
      if (!t.completed && t.dueDate) {
        items.push({
          id: `t-${t.id}`,
          title: t.title,
          source: t.category,
          dateKey: t.dueDate,
          daysLeft: daysBetweenDateKeys(istNow.dateKey, t.dueDate),
        });
      }
    }
    for (const p of projects) {
      if (p.targetCompletionDate) {
        items.push({
          id: `p-${p.id}`,
          title: `${p.name} Target`,
          source: 'Project',
          dateKey: p.targetCompletionDate,
          daysLeft: daysBetweenDateKeys(istNow.dateKey, p.targetCompletionDate),
        });
      }
    }
    for (const i of internships) {
      if (i.deadline && !['Accepted', 'Rejected', 'Withdrawn'].includes(i.status)) {
        items.push({
          id: `i-${i.id}`,
          title: `${i.organization} — ${i.opportunityTitle}`,
          source: 'Internship',
          dateKey: i.deadline,
          daysLeft: daysBetweenDateKeys(istNow.dateKey, i.deadline),
        });
      }
    }
    for (const u of universities) {
      if (u.deadline && !['Admitted', 'Rejected'].includes(u.applicationStatus)) {
        items.push({
          id: `u-${u.id}`,
          title: `${u.university} (${u.programme})`,
          source: "US Master's",
          dateKey: u.deadline,
          daysLeft: daysBetweenDateKeys(istNow.dateKey, u.deadline),
        });
      }
    }
    return items.sort((a, b) => a.dateKey.localeCompare(b.dateKey)).slice(0, 5);
  }, [tasks, projects, internships, universities, istNow.dateKey]);

  const weekKeys = useMemo(
    () => getWeekDateKeys(istNow.dateKey, profile?.weekStartsOn ?? 'monday'),
    [istNow.dateKey, profile?.weekStartsOn]
  );

  const weeklySummary = useMemo(() => {
    return weekKeys.map((dk) => {
      const dayBlocks = resolveDaySchedule({
        dateKey: dk,
        templates,
        instances,
        electiveThreeName: profile?.electiveThreeName,
      }).filter(
        (b) => b.category !== 'break' && b.title !== 'Sleep' && b.status !== 'skipped'
      );
      const done = dayBlocks.filter((b) => b.completed).length;
      const pct = dayBlocks.length > 0 ? Math.round((done / dayBlocks.length) * 100) : 0;
      return {
        dateKey: dk,
        label: getShortDayLabel(dk),
        isToday: dk === istNow.dateKey,
        pct,
        done,
        total: dayBlocks.length,
      };
    });
  }, [weekKeys, templates, instances, profile?.electiveThreeName, istNow.dateKey]);

  const todayPlacement =
    PLACEMENT_WEEKLY_ROTATION.find((r) => r.dayOfWeek === istNow.dayOfWeek) ??
    PLACEMENT_WEEKLY_ROTATION[0]!;
  const todayYoutube = getYoutubeChannelForDay(istNow.dayOfWeek);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;
    await createTask({
      title: trimmed,
      category: quickCategory,
      priority: quickPriority,
      dueDate: istNow.dateKey,
      recurrence: 'none',
    });
    setQuickTitle('');
    toast('Task added for today', { tone: 'success' });
  }

  async function handleToggleBlock(block: ResolvedScheduleBlock) {
    await toggleScheduleBlockCompleted(block);
  }

  const reduced = useReducedMotion();
  const currentDuration = currentBlock ? currentBlock.endMinutes - currentBlock.startMinutes : 0;
  const currentProgressPct =
    currentBlock && currentDuration > 0
      ? Math.min(100, Math.max(0, ((currentDuration - remainingMinutes) / currentDuration) * 100))
      : 0;
  const focusSessionsTodayCount = focusSessions.filter((s) => s.dateKey === istNow.dateKey).length;
  const pendingTaskCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="space-y-6">
      {/* ============ HERO ============ */}
      <section className="relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full df-well px-3 py-1 text-[11px] font-medium text-[var(--df-text-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5EE7F7] shadow-[0_0_8px_#5EE7F7]" />
                {istNow.dayName}, {istNow.formattedDate}
              </span>
              <span className="inline-flex items-center rounded-full df-well px-3 py-1 text-[11px] font-medium text-[var(--df-text-muted)]">
                {profile?.semester ?? 'Semester VI'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8F87FA]/30 bg-[#6D64F0]/10 px-3 py-1 text-[11px] font-medium text-[var(--df-accent-secondary)]">
                <Sparkles className="h-3 w-3" />
                {todayPlacement.focus} day
              </span>
            </div>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-[var(--df-text)] sm:text-[46px]">
              {getGreeting(istNow.hour)},
              <br className="sm:hidden" />{' '}
              <span className="df-text-aurora">{profile?.displayName ?? 'Sujith'}</span>
            </h1>
            <p className="mt-3 text-sm text-[var(--df-text-muted)]">
              Plan your day. <span className="text-[var(--df-text)]">Build your future.</span>
            </p>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-2"
          >
            <Link to="/schedule">
              <Button variant="outline" size="md" className="rounded-full">
                <CalendarClock className="h-4 w-4" />
                Full Timetable
              </Button>
            </Link>
            <Link to="/tasks">
              <Button variant="primary" size="md" className="rounded-full">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============ NOW & NEXT SPOTLIGHT ============ */}
      <Reveal delay={0.1}>
        <Card elevated className={cn(currentBlock && 'df-live-border')}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(60%_120%_at_0%_0%,rgba(109,100,240,0.28),transparent_60%),radial-gradient(40%_100%_at_100%_100%,rgba(94,231,247,0.14),transparent_70%)]"
          />
          <CardContent className="pt-5 sm:pt-6 sm:pb-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'df-dot-live h-2 w-2 rounded-full',
                      currentBlock
                        ? 'bg-[var(--df-success)] text-[var(--df-success)]'
                        : 'bg-[var(--df-text-faint)] text-transparent'
                    )}
                  />
                  <span className="df-eyebrow">{currentBlock ? 'Live now' : 'Current activity'}</span>
                  {currentBlock && (
                    <Badge tone="accent" className="font-mono-tabular">
                      {formatDurationMinutes(remainingMinutes)} left
                    </Badge>
                  )}
                </div>

                {currentBlock ? (
                  <div className="mt-3">
                    <p className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-[var(--df-text)] sm:text-[28px]">
                      {currentBlock.subjectCode ? (
                        <span className="mr-2 align-middle font-mono-tabular text-sm text-[var(--df-accent-secondary)]">
                          {currentBlock.subjectCode}
                        </span>
                      ) : null}
                      {currentBlock.title}
                    </p>
                    <p className="mt-1.5 font-mono-tabular text-xs text-[var(--df-text-muted)]">
                      {formatTime24To12(currentBlock.startTime)} –{' '}
                      {formatTime24To12(currentBlock.endTime)}
                      {currentBlock.subtitle ? ` · ${currentBlock.subtitle}` : ''}
                      {currentBlock.location ? ` · ${currentBlock.location}` : ''}
                    </p>
                    <div className="mt-4 max-w-xl">
                      <ProgressBar value={currentProgressPct} className="h-2" label="Current block progress" />
                      <div className="mt-1.5 flex justify-between font-mono-tabular text-[10.5px] text-[var(--df-text-faint)]">
                        <span>{formatTime24To12(currentBlock.startTime)}</span>
                        <span>{Math.round(currentProgressPct)}% through</span>
                        <span>{formatTime24To12(currentBlock.endTime)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-lg font-medium tracking-tight text-[var(--df-text-muted)]">
                    No active scheduled block right now.
                  </p>
                )}
              </div>

              {currentBlock && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() =>
                    openFocus({
                      scheduleBlock: currentBlock,
                      taskTitle: currentBlock.subjectCode
                        ? `${currentBlock.subjectCode} ${currentBlock.title}`
                        : currentBlock.title,
                      objective: currentBlock.subtitle,
                    })
                  }
                  className="shrink-0 rounded-full px-6"
                >
                  <Timer className="h-4 w-4" />
                  Focus Now
                </Button>
              )}
            </div>

            {nextBlock && (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl df-well px-4 py-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 rounded-full bg-[linear-gradient(135deg,#7B72F6,#5145C8)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_4px_14px_-4px_rgba(109,100,240,0.8)]">
                    Up next
                  </span>
                  <span className="font-mono-tabular text-[var(--df-text-muted)] shrink-0">
                    {formatTime24To12(nextBlock.startTime)}
                  </span>
                  <span className="truncate text-sm font-medium text-[var(--df-text)]">
                    {nextBlock.subjectCode ? `${nextBlock.subjectCode} ` : ''}
                    {nextBlock.title}
                  </span>
                </div>
                <Link
                  to="/schedule"
                  className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--df-border)] text-[var(--df-text-muted)] transition-all hover:border-[#8F87FA]/50 hover:text-[var(--df-text)]"
                  aria-label="Open schedule"
                >
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>

      {/* ============ DAILY OVERVIEW STATS ============ */}
      <section
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pb-0"
        aria-label="Daily overview"
      >
        <Reveal delay={0.12} className="min-w-[235px] shrink-0 snap-start sm:min-w-0">
          <Card interactive className="h-full">
            <CardContent className="flex items-center gap-4 pt-5">
              <ProgressRing
                value={todayTasks.length > 0 ? (completedTodayTasks / todayTasks.length) * 100 : 0}
                size={76}
                label="Tasks completed"
              >
                <CheckCircle2 className="h-5 w-5 text-[var(--df-accent-secondary)]" />
              </ProgressRing>
              <div className="min-w-0">
                <p className="df-eyebrow">Tasks Completed</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <AnimatedNumber
                    value={completedTodayTasks}
                    className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-text)]"
                  />
                  <span className="font-mono-tabular text-sm text-[var(--df-text-faint)]">
                    / {todayTasks.length}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--df-text-muted)]">on today&apos;s list</p>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.18} className="min-w-[235px] shrink-0 snap-start sm:min-w-0">
          <Card interactive className="h-full">
            <CardContent className="flex items-center gap-4 pt-5">
              <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(34,197,94,0.35),transparent)] blur-md df-breathe" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#22C55E]/35 bg-[linear-gradient(145deg,rgba(34,197,94,0.25),rgba(94,231,247,0.06))] text-[var(--df-success)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                  <Timer className="h-5 w-5" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="df-eyebrow">Focus Time Today</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <AnimatedNumber
                    value={focusSecondsToday}
                    format={(n) => formatDurationSeconds(n)}
                    className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-text)]"
                  />
                  <span className="text-xs text-[var(--df-text-faint)]">logged</span>
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--df-text-muted)]">
                  {focusSessionsTodayCount} focus session(s) recorded
                </p>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.24} className="min-w-[235px] shrink-0 snap-start sm:min-w-0">
          <Card interactive className="h-full">
            <CardContent className="flex items-center gap-4 pt-5">
              <ProgressRing
                value={scheduleCompletionPct}
                size={76}
                colors={['#F0B455', '#F59AC8', '#A78BFA']}
                label="Daily schedule completion"
              >
                <span className="font-mono-tabular text-sm font-semibold text-[var(--df-text)]">
                  {scheduleCompletionPct}%
                </span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="df-eyebrow">Schedule Completion</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <AnimatedNumber
                    value={completedTodayBlocks}
                    className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-text)]"
                  />
                  <span className="font-mono-tabular text-sm text-[var(--df-text-faint)]">
                    / {actionableTodayBlocks.length}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--df-text-muted)]">blocks done today</p>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* ============ MAIN WORKSPACE ============ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Primary Column */}
        <div className="space-y-6 lg:col-span-7">
          {/* Today's Schedule — timeline */}
          <Reveal delay={0.05}>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Today&apos;s Schedule</CardTitle>
                  <p className="mt-0.5 text-xs text-[var(--df-text-muted)]">
                    College timetable &amp; {istNow.dayName} routine (IST)
                  </p>
                </div>
                <Link
                  to="/schedule"
                  className="group inline-flex items-center gap-1 rounded-full df-well px-3 py-1.5 text-xs font-medium text-[var(--df-accent-secondary)] transition-colors hover:text-[var(--df-text)]"
                >
                  Manage
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardHeader>
              <CardContent>
                {todaySchedule.length === 0 ? (
                  <EmptyState
                    icon={CalendarClock}
                    title="No blocks scheduled"
                    description="Add a custom event or enable recurring templates in Schedule."
                  />
                ) : (
                  <>
                  <ol className="relative">
                    {/* Timeline spine */}
                    <span
                      aria-hidden="true"
                      className="absolute left-[7px] top-2 bottom-2 w-px bg-[linear-gradient(180deg,rgba(143,135,250,0.6),var(--df-border)_30%,var(--df-border)_70%,rgba(94,231,247,0.5))]"
                    />
                    {(() => {
                      const activeIdx = currentBlock
                        ? todaySchedule.findIndex(
                            (b) =>
                              b.templateId === currentBlock.templateId &&
                              b.startTime === currentBlock.startTime &&
                              b.title === currentBlock.title
                          )
                        : todaySchedule.findIndex(
                            (b) =>
                              !b.completed &&
                              b.status !== 'skipped' &&
                              b.category !== 'break' &&
                              b.title !== 'Sleep'
                          );
                      const windowStart =
                        activeIdx >= 0
                          ? Math.min(activeIdx, Math.max(0, todaySchedule.length - 5))
                          : Math.max(0, todaySchedule.length - 5);
                      const windowEnd = windowStart + 5;

                      return todaySchedule.map((block, idx) => {
                      const hideOnCompactMobile =
                        !showAllScheduleOnMobile &&
                        todaySchedule.length > 5 &&
                        (idx < windowStart || idx >= windowEnd);
                      const style = CATEGORY_ACCENT[block.category];
                      const slotDuration = Math.max(1, block.endMinutes - block.startMinutes);
                      const slotDurationSeconds = slotDuration * 60;
                      const loggedSeconds = block.loggedSeconds ?? 0;
                      const partialPct = Math.min(
                        100,
                        Math.round((loggedSeconds / slotDurationSeconds) * 100)
                      );
                      const isCurrent =
                        currentBlock &&
                        currentBlock.templateId === block.templateId &&
                        currentBlock.startTime === block.startTime &&
                        currentBlock.title === block.title;

                      return (
                        <motion.li
                          key={`${block.templateId ?? block.instanceId}-${block.startTime}`}
                          initial={reduced ? false : { opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: reduced ? 0 : Math.min(idx * 0.03, 0.4), ease: [0.22, 1, 0.36, 1] }}
                          className={cn(
                            'relative items-start gap-3 py-1',
                            hideOnCompactMobile ? 'hidden lg:flex' : 'flex'
                          )}
                        >
                          {/* Node / toggle */}
                          <button
                            type="button"
                            onClick={() => void handleToggleBlock(block)}
                            aria-label={`Mark ${block.title} as ${block.completed ? 'incomplete' : 'completed'}`}
                            className={cn(
                              'relative z-10 mt-3 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border transition-all duration-300 cursor-pointer',
                              block.completed
                                ? 'border-[var(--df-success)] bg-[var(--df-success)] text-white shadow-[0_0_12px_rgba(34,197,94,0.7)]'
                                : block.status === 'partial'
                                  ? 'border-[#F0B455] bg-[#F0B455]/25 text-[#F0B455] shadow-[0_0_10px_rgba(240,180,85,0.6)]'
                                  : block.status === 'wasted'
                                    ? 'border-[#F06A6A]/80 bg-[#F06A6A]/20 text-[#F06A6A]'
                                    : isCurrent
                                      ? 'df-dot-live border-[#8F87FA] bg-[var(--df-bg)] text-[#8F87FA] shadow-[0_0_12px_rgba(143,135,250,0.8)]'
                                      : 'border-[var(--df-border-strong)] bg-[var(--df-bg)] hover:border-[#8F87FA] hover:shadow-[0_0_10px_rgba(143,135,250,0.6)]'
                            )}
                          >
                            {block.completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                            {block.status === 'partial' && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#F0B455]" />
                            )}
                          </button>

                          <div
                            className={cn(
                              'min-w-0 flex-1 rounded-2xl border border-l-2 px-3.5 py-2.5 transition-all duration-300',
                              style.border,
                              isCurrent
                                ? 'border-[#8F87FA]/45 bg-[linear-gradient(110deg,rgba(109,100,240,0.18),rgba(94,231,247,0.04))] shadow-[0_10px_30px_-14px_rgba(109,100,240,0.8)]'
                                : block.status === 'skipped'
                                  ? 'border-[var(--df-border)] bg-[var(--df-inset)] opacity-55'
                                  : 'border-[var(--df-border)] bg-[var(--df-inset)] hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]'
                            )}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono-tabular text-[11px] text-[var(--df-text-muted)]">
                                {formatTime24To12(block.startTime)} – {formatTime24To12(block.endTime)}
                              </span>
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                                  style.badge
                                )}
                              >
                                {style.label}
                              </span>
                              {isCurrent && <Badge tone="success">Now</Badge>}
                              {block.status === 'partial' && (
                                <Badge tone="warning" className="font-mono-tabular">
                                  Partial
                                  {loggedSeconds > 0
                                    ? ` · ${formatDurationSeconds(loggedSeconds)}/${formatDurationSeconds(slotDurationSeconds)}`
                                    : ''}
                                </Badge>
                              )}
                              {block.status === 'done' && loggedSeconds > slotDurationSeconds && (
                                <Badge tone="warning" className="font-mono-tabular">
                                  Done · +{formatDurationSeconds(loggedSeconds - slotDurationSeconds)} OT
                                </Badge>
                              )}
                              {block.status === 'done' &&
                                loggedSeconds > 0 &&
                                loggedSeconds < slotDurationSeconds && (
                                  <Badge tone="success" className="font-mono-tabular">
                                    Done · {formatDurationSeconds(loggedSeconds)}
                                  </Badge>
                                )}
                              {block.status === 'wasted' && <Badge tone="error">Wasted</Badge>}
                              {block.status === 'skipped' && <Badge tone="neutral">Skipped</Badge>}
                              {block.hasConflict && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#F06A6A]/15 px-2 py-0.5 text-[10px] text-[var(--df-error)]">
                                  <AlertCircle className="h-3 w-3" /> Overlap
                                </span>
                              )}
                            </div>

                            <p
                              className={cn(
                                'mt-1 text-sm font-medium text-[var(--df-text)]',
                                (block.completed || block.status === 'skipped') &&
                                  'line-through decoration-[var(--df-text-faint)] text-[var(--df-text-muted)]'
                              )}
                            >
                              {block.subjectCode && (
                                <span className="mr-1.5 font-mono-tabular text-xs text-[var(--df-accent-secondary)]">
                                  {block.subjectCode}
                                </span>
                              )}
                              {block.title}
                            </p>
                            {(block.subtitle || block.location) && (
                              <p className="mt-0.5 text-xs text-[var(--df-text-muted)]">
                                {[block.subtitle, block.location].filter(Boolean).join(' · ')}
                              </p>
                            )}
                            {block.status === 'partial' && loggedSeconds > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--df-bg)]">
                                  <div
                                    className="h-full rounded-full bg-[linear-gradient(90deg,#F0B455,#8F87FA)]"
                                    style={{ width: `${partialPct}%` }}
                                  />
                                </div>
                                <span className="font-mono-tabular text-[10px] text-[var(--df-text-faint)]">
                                  {partialPct}%
                                </span>
                              </div>
                            )}
                            {(() => {
                              const links = getQuickLinksForScheduleBlock(
                                block.title,
                                istNow.dayOfWeek
                              );
                              if (links.length === 0) return null;
                              return (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {links.map((lnk) => (
                                    <a
                                      key={lnk.url}
                                      href={lnk.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-full border border-[#8F87FA]/40 bg-[#635BDB]/12 px-2.5 py-0.5 text-[11px] font-medium text-[var(--df-accent-secondary)] transition-colors hover:bg-[#635BDB]/25 hover:text-white"
                                    >
                                      <span>{lnk.label}</span>
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </motion.li>
                      );
                    });
                    })()}
                  </ol>
                  {todaySchedule.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full rounded-full lg:hidden"
                      onClick={() => setShowAllScheduleOnMobile((v) => !v)}
                    >
                      {showAllScheduleOnMobile
                        ? 'Show compact view'
                        : `Show full day (${todaySchedule.length} blocks)`}
                    </Button>
                  )}
                  </>
                )}
              </CardContent>
            </Card>
          </Reveal>

          {/* Today's Priorities */}
          <Reveal delay={0.05}>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Today&apos;s Priorities</CardTitle>
                  <p className="mt-0.5 text-xs text-[var(--df-text-muted)]">
                    Focused action items from your task store
                  </p>
                </div>
                <Link
                  to="/tasks"
                  className="group inline-flex items-center gap-1 rounded-full df-well px-3 py-1.5 text-xs font-medium text-[var(--df-accent-secondary)] transition-colors hover:text-[var(--df-text)]"
                >
                  View all ({pendingTaskCount})
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {priorityTasks.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No pending tasks yet"
                    description="Add a real task below for college, DSA, projects, or career prep."
                  />
                ) : (
                  <div className="space-y-2">
                    {priorityTasks.map((task, idx) => (
                      <motion.div
                        key={task.id}
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: reduced ? 0 : idx * 0.04 }}
                        className="group flex items-center justify-between gap-3 rounded-2xl df-well px-3.5 py-3 transition-all duration-300 hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            aria-hidden="true"
                            className={cn(
                              'h-8 w-1 shrink-0 rounded-full',
                              task.priority === 'high'
                                ? 'bg-[linear-gradient(180deg,#F06A6A,#F59AC8)] shadow-[0_0_10px_rgba(240,106,106,0.6)]'
                                : task.priority === 'medium'
                                  ? 'bg-[linear-gradient(180deg,#F0B455,#F59AC8)]'
                                  : 'bg-[var(--df-border-strong)]'
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => void toggleTaskCompleted(task)}
                            aria-label={`Complete ${task.title}`}
                            className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border border-[var(--df-border-strong)] transition-all hover:border-[#8F87FA] hover:shadow-[0_0_10px_rgba(143,135,250,0.6)] cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--df-text)]">
                              {task.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--df-text-muted)]">
                              <Badge
                                tone={
                                  task.priority === 'high'
                                    ? 'error'
                                    : task.priority === 'medium'
                                      ? 'warning'
                                      : 'neutral'
                                }
                              >
                                {task.priority}
                              </Badge>
                              <span>{task.category}</span>
                              {task.dueDate && (
                                <span className="font-mono-tabular">
                                  · {formatShortDateLabel(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            openFocus({
                              taskId: task.id,
                              taskTitle: task.title,
                              objective: task.category,
                            })
                          }
                          aria-label={`Focus on ${task.title}`}
                          className="shrink-0 rounded-full opacity-70 transition-opacity group-hover:opacity-100"
                        >
                          <Timer className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={handleQuickAdd}
                  className="flex flex-col gap-2 rounded-2xl border border-dashed border-[var(--df-border-strong)] bg-[var(--df-inset)] p-2 sm:flex-row"
                >
                  <Input
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="Quick add a priority task for today..."
                    aria-label="Quick add task title"
                    className="flex-1 border-transparent bg-transparent shadow-none"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={quickCategory}
                      onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
                      aria-label="Quick add task category"
                      className="min-w-[130px] flex-1 sm:w-36 sm:flex-none"
                    >
                      {QUICK_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={quickPriority}
                      onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
                      aria-label="Quick add task priority"
                      className="w-24 shrink-0"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </Select>
                    <Button type="submit" variant="primary" size="md">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Right Contextual Column */}
        <div className="space-y-6 lg:col-span-5">
          {/* Today's YouTube & Dev Redirects */}
          <Reveal delay={0.08}>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>YouTube &amp; Dev Redirects</CardTitle>
                  <p className="mt-0.5 text-xs text-[var(--df-text-muted)]">
                    8:00–9:00 PM tech routine &amp; daily Java DSA links
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#8F87FA]/30 bg-[#6D64F0]/12 text-[var(--df-accent-secondary)]">
                  <Tv className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href={todayYoutube.channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#8F87FA]/40 bg-[linear-gradient(110deg,rgba(109,100,240,0.18),rgba(94,231,247,0.05))] p-3.5 transition-all hover:border-[#8F87FA]/70"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">8:30 PM · {todayYoutube.dayName}</Badge>
                      <span className="text-sm font-semibold text-[var(--df-text)] truncate">
                        {todayYoutube.channel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--df-text-muted)] truncate">
                      {todayYoutube.topic}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#7B72F6,#5145C8)] px-3 py-1.5 text-xs font-medium text-white shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                    Watch <ExternalLink className="h-3 w-3" />
                  </span>
                </a>

                <div>
                  <p className="df-eyebrow mb-1.5">Dev &amp; Reading Portals</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DAILY_READING_WEBSITES.map((site) => (
                      <a
                        key={site.id}
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--df-border)] bg-[var(--df-inset)] px-2.5 py-1 text-xs font-medium text-[var(--df-text)] transition-colors hover:border-[#8F87FA]/60 hover:text-[var(--df-accent-secondary)]"
                      >
                        <span>{site.name}</span>
                        <ExternalLink className="h-3 w-3 text-[var(--df-text-muted)]" />
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="df-eyebrow mb-1.5 flex items-center gap-1">
                    <Code2 className="h-3 w-3" />
                    Java DSA Resources
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DSA_RESOURCES.map((res) => (
                      <a
                        key={res.name}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--df-border)] bg-[var(--df-inset)] px-2.5 py-1 text-xs font-medium text-[var(--df-text)] transition-colors hover:border-[#8F87FA]/60 hover:text-[var(--df-accent-secondary)]"
                      >
                        <span>{res.name}</span>
                        <ExternalLink className="h-3 w-3 text-[var(--df-text-muted)]" />
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          {/* 4 Long-Term Goals */}
          <Reveal delay={0.1}>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Long-Term Goals</CardTitle>
                  <p className="mt-0.5 text-xs text-[var(--df-text-muted)]">
                    {PERSONAL_PLAN_DEFAULTS.planningPeriod}
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#8F87FA]/30 bg-[#6D64F0]/12 text-[var(--df-accent-secondary)]">
                  <Flag className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  {
                    n: '01',
                    title: 'DSA and placements — 2028',
                    stat: `${solvedDsaCount} solved`,
                    sub: `Java DSA · Placement rotation ${placementPct}% started`,
                    pct: placementPct as number | null,
                  },
                  {
                    n: '02',
                    title: 'International internship — Summer 2027',
                    stat: `${internships.length} tracked`,
                    sub: `${internships.filter((i) => i.status === 'Applied').length} applied · IAESTE, AScI, DAAD, Mitacs`,
                    pct: null as number | null,
                  },
                  {
                    n: '03',
                    title: "US Master's — Fall 2028",
                    stat: `${mastersCompletedCount}/${mastersMilestones.length} phases`,
                    sub: `${universities.length} universities shortlisted · MS CS (AI/ML & Systems)`,
                    pct: mastersPct as number | null,
                  },
                  {
                    n: '04',
                    title: 'Software engineering curriculum',
                    stat: `${curriculumPct}%`,
                    sub: `${completedConcepts}/${totalConcepts} concepts across 16 stages`,
                    pct: curriculumPct as number | null,
                  },
                ].map((goal) => (
                  <div
                    key={goal.n}
                    className="group relative overflow-hidden rounded-2xl df-well p-3.5 transition-all duration-300 hover:border-[var(--df-border-strong)]"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-4 right-2 font-mono-tabular text-[56px] font-bold leading-none text-[var(--df-text)] opacity-[0.04] transition-opacity group-hover:opacity-[0.08]"
                    >
                      {goal.n}
                    </span>
                    <div className="relative flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-[var(--df-text)]">{goal.title}</span>
                      <span className="shrink-0 font-mono-tabular text-[var(--df-accent-secondary)]">
                        {goal.stat}
                      </span>
                    </div>
                    <p className="relative mt-1 text-[11px] text-[var(--df-text-muted)]">{goal.sub}</p>
                    {goal.pct !== null && <ProgressBar className="relative mt-2.5" value={goal.pct} />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </Reveal>

          {/* Learning Progress — ring grid */}
          <Reveal delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <Link
                  to="/learning"
                  className="group inline-flex items-center gap-1 rounded-full df-well px-3 py-1.5 text-xs font-medium text-[var(--df-accent-secondary)] transition-colors hover:text-[var(--df-text)]"
                >
                  Open Hub
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'DSA (Java)',
                    pct: dsaProblems.length > 0 ? (solvedDsaCount / dsaProblems.length) * 100 : 0,
                    detail: `${solvedDsaCount} solved / ${dsaProblems.length} logged`,
                    colors: ['#8F87FA', '#A78BFA', '#5EE7F7'] as [string, string, string],
                  },
                  {
                    label: 'Software Engineering',
                    pct: curriculumPct,
                    detail: '16 stages',
                    colors: ['#5EE7F7', '#5EEAB0', '#A78BFA'] as [string, string, string],
                  },
                  {
                    label: 'Placement Prep',
                    pct: placementPct,
                    detail: 'weekly rotation',
                    colors: ['#5EEAB0', '#5EE7F7', '#8F87FA'] as [string, string, string],
                  },
                  {
                    label: `Projects (${projects.length})`,
                    pct: activeProjectsPct,
                    detail: 'tasks & milestones',
                    colors: ['#F59AC8', '#B79CFF', '#8F87FA'] as [string, string, string],
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center rounded-2xl df-well px-2 py-4 text-center transition-all duration-300 hover:border-[var(--df-border-strong)]"
                  >
                    <ProgressRing value={item.pct} size={68} stroke={5} colors={item.colors} label={item.label}>
                      <span className="font-mono-tabular text-[13px] font-semibold text-[var(--df-text)]">
                        {Math.round(item.pct)}%
                      </span>
                    </ProgressRing>
                    <p className="mt-2.5 text-xs font-medium text-[var(--df-text)]">{item.label}</p>
                    <p className="mt-0.5 text-[10.5px] text-[var(--df-text-faint)]">{item.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Reveal>

          {/* Upcoming Deadlines */}
          <Reveal delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#F0B455]/30 bg-[#F0B455]/10 text-[var(--df-warning)]">
                  <Clock className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                {upcomingDeadlines.length === 0 ? (
                  <p className="rounded-2xl df-well px-4 py-5 text-center text-xs leading-relaxed text-[var(--df-text-muted)]">
                    No dated deadlines yet. Add due dates on tasks, project targets, internships, or university applications.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingDeadlines.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl df-well px-3 py-2.5 text-xs transition-all hover:border-[var(--df-border-strong)]"
                      >
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border font-mono-tabular leading-none',
                            item.daysLeft <= 3
                              ? 'border-[#F0B455]/40 bg-[#F0B455]/12 text-[var(--df-warning)] shadow-[0_0_16px_-6px_rgba(240,180,85,0.8)]'
                              : 'border-[var(--df-border-strong)] bg-[var(--df-inset)] text-[var(--df-text)]'
                          )}
                        >
                          <span className="text-[15px] font-semibold">
                            {item.daysLeft === 0 ? '•' : Math.abs(item.daysLeft)}
                          </span>
                          <span className="mt-0.5 text-[8.5px] uppercase tracking-wider opacity-75">
                            {item.daysLeft === 0 ? 'today' : item.daysLeft < 0 ? 'ago' : 'days'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[var(--df-text)]">{item.title}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--df-text-muted)]">
                            {item.source} · {formatShortDateLabel(item.dateKey)}
                          </p>
                        </div>
                        <Badge tone={item.daysLeft <= 3 ? 'warning' : 'neutral'} className="font-mono-tabular shrink-0">
                          {item.daysLeft === 0
                            ? 'Today'
                            : item.daysLeft < 0
                              ? `${Math.abs(item.daysLeft)}d ago`
                              : `in ${item.daysLeft}d`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>

          {/* Weekly Overview */}
          <Reveal delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Weekly Overview</CardTitle>
                <Link
                  to="/analytics"
                  className="group inline-flex items-center gap-1 rounded-full df-well px-3 py-1.5 text-xs font-medium text-[var(--df-accent-secondary)] transition-colors hover:text-[var(--df-text)]"
                >
                  Analytics
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weeklySummary.map((day, idx) => (
                    <div key={day.dateKey} className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          'relative flex h-28 w-full items-end overflow-hidden rounded-xl border p-1',
                          day.isToday
                            ? 'border-[#8F87FA]/60 bg-[#6D64F0]/10 shadow-[0_0_20px_-8px_rgba(109,100,240,0.9)]'
                            : 'border-[var(--df-border)] bg-[var(--df-inset)]'
                        )}
                        title={`${day.label}: ${day.done}/${day.total} blocks`}
                      >
                        <motion.div
                          initial={reduced ? false : { height: 0 }}
                          whileInView={{ height: `${Math.max(day.pct > 0 ? 8 : 0, day.pct)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: reduced ? 0 : idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                          className={cn(
                            'w-full rounded-lg',
                            day.isToday
                              ? 'bg-[linear-gradient(180deg,#5EE7F7,#8F87FA_45%,#635BDB)] shadow-[0_0_16px_rgba(143,135,250,0.8)]'
                              : 'bg-[linear-gradient(180deg,rgba(167,139,250,0.9),rgba(99,91,219,0.6))]'
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-[11px] font-medium',
                          day.isToday ? 'text-[var(--df-accent-secondary)]' : 'text-[var(--df-text-muted)]'
                        )}
                      >
                        {day.label}
                      </span>
                      <span className="-mt-1.5 font-mono-tabular text-[9.5px] text-[var(--df-text-faint)]">
                        {day.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
