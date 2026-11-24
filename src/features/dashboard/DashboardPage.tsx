import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
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
} from 'lucide-react';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID, PERSONAL_PLAN_DEFAULTS } from '@/config/personalPlan';
import { PLACEMENT_WEEKLY_ROTATION } from '@/config/career';
import { useIstClock } from '@/hooks/useIstClock';
import { useFocusTimer } from '@/app/providers/FocusProvider';
import { useToast } from '@/app/providers/ToastProvider';
import {
  createTask,
  toggleScheduleBlockCompleted,
  toggleTaskCompleted,
} from '@/services/storage/repositories';
import {
  daysBetweenDateKeys,
  getDateKeyFromIso,
  formatDurationMinutes,
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
import { ProgressBar } from '@/components/ui/Primitives';
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

  const { currentBlock, nextBlock, remainingMinutes } = useMemo(
    () => findCurrentAndNextBlocks(todaySchedule, istNow.minutesFromMidnight),
    [todaySchedule, istNow.minutesFromMidnight]
  );

  const actionableTodayBlocks = useMemo(
    () => todaySchedule.filter((b) => b.category !== 'break' && b.title !== 'Sleep'),
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
  const focusMinutesToday = useMemo(() => {
    const secs = focusSessions
      .filter((s) => s.dateKey === istNow.dateKey)
      .reduce((acc, s) => acc + s.actualSeconds, 0);
    return Math.round(secs / 60);
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
      }).filter((b) => b.category !== 'break' && b.title !== 'Sleep');
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#8178F5]">
            {istNow.dayName}, {istNow.formattedDate} · {profile?.semester ?? 'Semester VI'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--df-text)]">
            {getGreeting(istNow.hour)}, {profile?.displayName ?? 'Sujith'}
          </h1>
          <p className="mt-0.5 text-xs text-[var(--df-text-muted)]">
            Plan your day. Build your future. · {todayPlacement.focus} day
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/schedule">
            <Button variant="outline" size="sm">
              <CalendarClock className="h-3.5 w-3.5" />
              Full Timetable
            </Button>
          </Link>
          <Link to="/tasks">
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Overview Strip */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Daily overview">
        <Card interactive>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-xs text-[var(--df-text-muted)]">
              <span>Tasks Completed</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BDB]/15 text-[#8178F5]">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono-tabular text-2xl font-semibold text-[var(--df-text)]">
                {completedTodayTasks}
              </span>
              <span className="font-mono-tabular text-sm text-[var(--df-text-muted)]">
                / {todayTasks.length}
              </span>
            </div>
            <ProgressBar
              className="mt-3"
              value={
                todayTasks.length > 0
                  ? (completedTodayTasks / todayTasks.length) * 100
                  : 0
              }
            />
          </CardContent>
        </Card>

        <Card interactive>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-xs text-[var(--df-text-muted)]">
              <span>Focus Time Today</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#16A34A]/15 text-[#22C55E]">
                <Timer className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono-tabular text-2xl font-semibold text-[var(--df-text)]">
                {formatDurationMinutes(focusMinutesToday)}
              </span>
              <span className="text-xs text-[var(--df-text-muted)]">logged</span>
            </div>
            <p className="mt-2.5 text-[11px] text-[var(--df-text-muted)]">
              {focusSessions.filter((s) => s.dateKey === istNow.dateKey).length} focus session(s) recorded
            </p>
          </CardContent>
        </Card>

        <Card interactive>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-xs text-[var(--df-text-muted)]">
              <span>Daily Schedule Completion</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E5A03C]/15 text-[#E5A03C]">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono-tabular text-2xl font-semibold text-[var(--df-text)]">
                {scheduleCompletionPct}%
              </span>
              <span className="font-mono-tabular text-xs text-[var(--df-text-muted)]">
                ({completedTodayBlocks}/{actionableTodayBlocks.length} blocks)
              </span>
            </div>
            <ProgressBar className="mt-3" value={scheduleCompletionPct} />
          </CardContent>
        </Card>
      </section>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Primary Column */}
        <div className="space-y-6 lg:col-span-7">
          {/* Now & Next Spotlight */}
          <Card elevated>
            <CardContent className="pt-4 sm:pt-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--df-text-muted)]">
                      Current Activity
                    </span>
                    {currentBlock && (
                      <Badge tone="accent" className="font-mono-tabular">
                        {formatDurationMinutes(remainingMinutes)} left
                      </Badge>
                    )}
                  </div>
                  {currentBlock ? (
                    <div className="mt-2">
                      <p className="text-base font-semibold text-[var(--df-text)]">
                        {currentBlock.subjectCode ? (
                          <span className="mr-2 font-mono-tabular text-xs text-[#8178F5]">
                            {currentBlock.subjectCode}
                          </span>
                        ) : null}
                        {currentBlock.title}
                      </p>
                      <p className="mt-0.5 font-mono-tabular text-xs text-[var(--df-text-muted)]">
                        {formatTime24To12(currentBlock.startTime)} –{' '}
                        {formatTime24To12(currentBlock.endTime)}
                        {currentBlock.subtitle ? ` · ${currentBlock.subtitle}` : ''}
                        {currentBlock.location ? ` · ${currentBlock.location}` : ''}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--df-text-muted)]">
                      No active scheduled block right now.
                    </p>
                  )}
                </div>

                {currentBlock && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      openFocus({
                        taskTitle: currentBlock.subjectCode
                          ? `${currentBlock.subjectCode} ${currentBlock.title}`
                          : currentBlock.title,
                        objective: currentBlock.subtitle,
                      })
                    }
                    className="shrink-0"
                  >
                    <Timer className="h-3.5 w-3.5" />
                    Focus Now
                  </Button>
                )}
              </div>

              {nextBlock && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)] px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-[#8178F5] shrink-0">UP NEXT</span>
                    <span className="font-mono-tabular text-[var(--df-text-muted)] shrink-0">
                      {formatTime24To12(nextBlock.startTime)}
                    </span>
                    <span className="truncate text-[var(--df-text)]">
                      {nextBlock.subjectCode ? `${nextBlock.subjectCode} ` : ''}
                      {nextBlock.title}
                    </span>
                  </div>
                  <Link
                    to="/schedule"
                    className="shrink-0 text-[var(--df-text-muted)] hover:text-[var(--df-text)]"
                    aria-label="Open schedule"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Today&apos;s Schedule</CardTitle>
                <p className="text-xs text-[var(--df-text-muted)]">
                  College timetable &amp; {istNow.dayName} routine (IST)
                </p>
              </div>
              <Link to="/schedule" className="text-xs font-medium text-[#8178F5] hover:underline">
                Manage →
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {todaySchedule.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="No blocks scheduled"
                  description="Add a custom event or enable recurring templates in Schedule."
                />
              ) : (
                todaySchedule.map((block) => {
                  const style = CATEGORY_ACCENT[block.category];
                  const isCurrent =
                    currentBlock &&
                    currentBlock.templateId === block.templateId &&
                    currentBlock.startTime === block.startTime &&
                    currentBlock.title === block.title;

                  return (
                    <div
                      key={`${block.templateId ?? block.instanceId}-${block.startTime}`}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border border-[var(--df-border)] border-l-2 px-3 py-2.5 transition-colors',
                        style.border,
                        isCurrent
                          ? 'bg-[#635BDB]/10 border-[#635BDB]/40'
                          : 'bg-[var(--df-bg)]/70 hover:bg-[var(--df-elevated)]/60'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => void handleToggleBlock(block)}
                        aria-label={`Mark ${block.title} as ${block.completed ? 'incomplete' : 'completed'}`}
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer',
                          block.completed
                            ? 'border-[#16A34A] bg-[#16A34A] text-white'
                            : 'border-[var(--df-text-muted)]/50 hover:border-[#8178F5]'
                        )}
                      >
                        {block.completed && <Check className="h-3 w-3" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-tabular text-[11px] text-[var(--df-text-muted)]">
                            {formatTime24To12(block.startTime)} – {formatTime24To12(block.endTime)}
                          </span>
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-medium',
                              style.badge
                            )}
                          >
                            {style.label}
                          </span>
                          {block.hasConflict && (
                            <span className="inline-flex items-center gap-1 rounded bg-[#E05252]/15 px-1.5 py-0.5 text-[10px] text-[#E05252]">
                              <AlertCircle className="h-3 w-3" /> Overlap
                            </span>
                          )}
                        </div>

                        <p
                          className={cn(
                            'mt-1 text-sm font-medium text-[var(--df-text)]',
                            block.completed && 'line-through text-[var(--df-text-muted)]'
                          )}
                        >
                          {block.subjectCode && (
                            <span className="mr-1.5 font-mono-tabular text-xs text-[#8178F5]">
                              {block.subjectCode}
                            </span>
                          )}
                          {block.title}
                        </p>
                        {(block.subtitle || block.location) && (
                          <p className="text-xs text-[var(--df-text-muted)]">
                            {[block.subtitle, block.location].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Today's Priorities */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Today&apos;s Priorities</CardTitle>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Focused action items from your task store
                </p>
              </div>
              <Link to="/tasks" className="text-xs font-medium text-[#8178F5] hover:underline">
                View all ({tasks.filter((t) => !t.completed).length}) →
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
                  {priorityTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)]/70 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => void toggleTaskCompleted(task)}
                          aria-label={`Complete ${task.title}`}
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--df-text-muted)]/50 hover:border-[#8178F5] cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--df-text)]">
                            {task.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--df-text-muted)]">
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
                        size="sm"
                        onClick={() =>
                          openFocus({
                            taskId: task.id,
                            taskTitle: task.title,
                            objective: task.category,
                          })
                        }
                        aria-label={`Focus on ${task.title}`}
                        className="shrink-0"
                      >
                        <Timer className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleQuickAdd} className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Input
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Quick add a priority task for today..."
                  aria-label="Quick add task title"
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
                    aria-label="Quick add task category"
                    className="w-36"
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
                    className="w-24"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select>
                  <Button type="submit" variant="primary" size="md">
                    Add
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Contextual Column */}
        <div className="space-y-6 lg:col-span-5">
          {/* 4 Long-Term Goals */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Long-Term Goals</CardTitle>
                <p className="text-xs text-[var(--df-text-muted)]">
                  {PERSONAL_PLAN_DEFAULTS.planningPeriod}
                </p>
              </div>
              <Flag className="h-4 w-4 text-[#8178F5]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)]/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--df-text)]">
                    1. DSA and placements — 2028
                  </span>
                  <span className="font-mono-tabular text-[#8178F5]">
                    {solvedDsaCount} solved
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--df-text-muted)]">
                  Java DSA · Placement rotation {placementPct}% started
                </p>
                <ProgressBar className="mt-2" value={placementPct} />
              </div>

              <div className="rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)]/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--df-text)]">
                    2. International internship — Summer 2027
                  </span>
                  <span className="font-mono-tabular text-[#8178F5]">
                    {internships.length} tracked
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--df-text-muted)]">
                  {internships.filter((i) => i.status === 'Applied').length} applied · IAESTE, AScI, DAAD, Mitacs
                </p>
              </div>

              <div className="rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)]/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--df-text)]">
                    3. US Master&apos;s — Fall 2028
                  </span>
                  <span className="font-mono-tabular text-[#8178F5]">
                    {mastersCompletedCount}/{mastersMilestones.length} phases
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--df-text-muted)]">
                  {universities.length} universities shortlisted · MS CS (AI/ML &amp; Systems)
                </p>
                <ProgressBar className="mt-2" value={mastersPct} />
              </div>

              <div className="rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)]/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--df-text)]">
                    4. Software engineering curriculum
                  </span>
                  <span className="font-mono-tabular text-[#8178F5]">
                    {curriculumPct}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--df-text-muted)]">
                  {completedConcepts}/{totalConcepts} concepts across 16 stages
                </p>
                <ProgressBar className="mt-2" value={curriculumPct} />
              </div>
            </CardContent>
          </Card>

          {/* Learning Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <Link to="/learning" className="text-xs font-medium text-[#8178F5] hover:underline">
                Open Hub →
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-[var(--df-text-muted)]">DSA (Java)</span>
                  <span className="font-mono-tabular text-[var(--df-text)]">
                    {solvedDsaCount} solved / {dsaProblems.length} logged
                  </span>
                </div>
                <ProgressBar
                  value={dsaProblems.length > 0 ? (solvedDsaCount / dsaProblems.length) * 100 : 0}
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-[var(--df-text-muted)]">Software Engineering (16 Stages)</span>
                  <span className="font-mono-tabular text-[var(--df-text)]">{curriculumPct}%</span>
                </div>
                <ProgressBar value={curriculumPct} />
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-[var(--df-text-muted)]">Placement Preparation</span>
                  <span className="font-mono-tabular text-[var(--df-text)]">{placementPct}%</span>
                </div>
                <ProgressBar value={placementPct} />
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-[var(--df-text-muted)]">Projects ({projects.length})</span>
                  <span className="font-mono-tabular text-[var(--df-text)]">{activeProjectsPct}%</span>
                </div>
                <ProgressBar value={activeProjectsPct} />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <Clock className="h-4 w-4 text-[#E5A03C]" />
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-[var(--df-text-muted)]">
                  No dated deadlines yet. Add due dates on tasks, project targets, internships, or university applications.
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingDeadlines.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)]/60 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--df-text)]">{item.title}</p>
                        <p className="text-[11px] text-[var(--df-text-muted)]">
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

          {/* Weekly Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
              <Link to="/analytics" className="text-xs font-medium text-[#8178F5] hover:underline">
                Analytics →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weeklySummary.map((day) => (
                  <div key={day.dateKey} className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        'flex h-12 w-full items-end overflow-hidden rounded-md border p-0.5',
                        day.isToday
                          ? 'border-[#635BDB] bg-[#635BDB]/10'
                          : 'border-[var(--df-border)] bg-[var(--df-bg)]'
                      )}
                      title={`${day.label}: ${day.done}/${day.total} blocks`}
                    >
                      <div
                        className={cn(
                          'w-full rounded-xs transition-all',
                          day.isToday ? 'bg-[#635BDB]' : 'bg-[#8178F5]/70'
                        )}
                        style={{ height: `${Math.max(day.pct > 0 ? 12 : 0, day.pct)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-[11px] font-medium',
                        day.isToday ? 'text-[#8178F5]' : 'text-[var(--df-text-muted)]'
                      )}
                    >
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
