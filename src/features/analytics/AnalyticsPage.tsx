import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  Flag,
  GraduationCap,
  Radio,
  Timer,
} from 'lucide-react';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID } from '@/config/personalPlan';
import { useIstClock } from '@/hooks/useIstClock';
import {
  addDaysToDateKey,
  formatDurationSeconds,
  getDateKeyFromIso,
  getShortDayLabel,
  getWeekDateKeys,
} from '@/lib/dateUtils';
import { resolveDaySchedule } from '@/lib/scheduleEngine';
import { EmptyState, PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  AnimatedNumber,
  ProgressBar,
  ProgressRing,
  Reveal,
  SegmentedTabs,
} from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';

type AnalyticsPeriod = 'weekly' | 'monthly' | 'long_term';

/** Presentation-only legend metadata for the weekly chart (matches the Bar series below). */
const CHART_SERIES = [
  { key: 'focusHours', label: 'Focus (hrs)', swatch: 'linear-gradient(180deg,#A78BFA,#5145C8)', glow: 'rgba(143,135,250,0.8)' },
  { key: 'blocksDone', label: 'Schedule Blocks', swatch: 'linear-gradient(180deg,#5EE7F7,#22C55E)', glow: 'rgba(94,231,247,0.7)' },
  { key: 'tasksDone', label: 'Tasks Done', swatch: 'linear-gradient(180deg,#F59AC8,#8F87FA)', glow: 'rgba(245,154,200,0.7)' },
] as const;

export default function AnalyticsPage() {
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const rawTemplates = useLiveQuery(() => db.scheduleTemplates.toArray(), []);
  const rawInstances = useLiveQuery(() => db.scheduleInstances.toArray(), []);
  const rawTasks = useLiveQuery(() => db.tasks.toArray(), []);
  const rawFocusSessions = useLiveQuery(() => db.focusSessions.toArray(), []);
  const rawDsaProblems = useLiveQuery(() => db.dsaProblems.toArray(), []);
  const rawStages = useLiveQuery(() => db.learningStages.toArray(), []);
  const rawAwarenessLogs = useLiveQuery(() => db.awarenessLogs.toArray(), []);
  const rawProjects = useLiveQuery(() => db.projects.toArray(), []);
  const rawInternships = useLiveQuery(() => db.internshipApplications.toArray(), []);
  const rawMilestones = useLiveQuery(() => db.mastersMilestones.toArray(), []);

  const templates = useMemo(() => rawTemplates ?? [], [rawTemplates]);
  const instances = useMemo(() => rawInstances ?? [], [rawInstances]);
  const tasks = useMemo(() => rawTasks ?? [], [rawTasks]);
  const focusSessions = useMemo(() => rawFocusSessions ?? [], [rawFocusSessions]);
  const dsaProblems = useMemo(() => rawDsaProblems ?? [], [rawDsaProblems]);
  const stages = useMemo(() => rawStages ?? [], [rawStages]);
  const awarenessLogs = useMemo(() => rawAwarenessLogs ?? [], [rawAwarenessLogs]);
  const projects = useMemo(() => rawProjects ?? [], [rawProjects]);
  const internships = useMemo(() => rawInternships ?? [], [rawInternships]);
  const milestones = useMemo(() => rawMilestones ?? [], [rawMilestones]);

  const timezone = profile?.timezone ?? 'Asia/Kolkata';
  const istNow = useIstClock(timezone);
  const [period, setPeriod] = useState<AnalyticsPeriod>('weekly');

  const weekKeys = useMemo(
    () => getWeekDateKeys(istNow.dateKey, profile?.weekStartsOn ?? 'monday'),
    [istNow.dateKey, profile?.weekStartsOn]
  );

  const weeklyChartData = useMemo(() => {
    return weekKeys.map((dk) => {
      const focusMins = Math.round(
        focusSessions
          .filter((s) => s.dateKey === dk)
          .reduce((acc, s) => acc + s.actualSeconds, 0) / 60
      );
      const tasksDone = tasks.filter(
        (t) => t.completed && t.completedAt && getDateKeyFromIso(t.completedAt, timezone) === dk
      ).length;
      const dsaSolved = dsaProblems.filter(
        (p) => p.status === 'solved' && p.dateSolved === dk
      ).length;
      const dayBlocks = resolveDaySchedule({
        dateKey: dk,
        templates,
        instances,
        electiveThreeName: profile?.electiveThreeName,
      }).filter(
        (b) => b.category !== 'break' && b.title !== 'Sleep' && b.status !== 'skipped'
      );
      const blocksDone = dayBlocks.filter((b) => b.completed).length;
      const blocksPartial = dayBlocks.filter((b) => b.status === 'partial').length;
      const blocksWasted = dayBlocks.filter((b) => b.status === 'wasted').length;

      return {
        day: getShortDayLabel(dk),
        focusHours: Number((focusMins / 60).toFixed(2)),
        tasksDone,
        dsaSolved,
        blocksDone,
        blocksPartial,
        blocksWasted,
      };
    });
  }, [weekKeys, focusSessions, tasks, dsaProblems, templates, instances, profile?.electiveThreeName, timezone]);

  const weeklyBlockBreakdown = useMemo(
    () =>
      weeklyChartData.reduce(
        (acc, d) => ({
          done: acc.done + d.blocksDone,
          partial: acc.partial + d.blocksPartial,
          wasted: acc.wasted + d.blocksWasted,
        }),
        { done: 0, partial: 0, wasted: 0 }
      ),
    [weeklyChartData]
  );

  const weekStart = weekKeys[0] ?? istNow.dateKey;
  const weekEnd = weekKeys[weekKeys.length - 1] ?? istNow.dateKey;
  // -29 so the inclusive window today..monthStart spans exactly 30 days.
  const monthStart = addDaysToDateKey(istNow.dateKey, -29);
  const todayKey = istNow.dateKey;

  const weeklyTotals = useMemo(() => {
    const focusSeconds = focusSessions
      .filter((s) => s.dateKey >= weekStart && s.dateKey <= weekEnd)
      .reduce((acc, s) => acc + s.actualSeconds, 0);
    const tasksDone = tasks.filter((t) => {
      if (!t.completed || !t.completedAt) return false;
      const dk = getDateKeyFromIso(t.completedAt, timezone);
      return dk >= weekStart && dk <= weekEnd;
    }).length;
    const dsaSolved = dsaProblems.filter(
      (p) =>
        p.status === 'solved' &&
        (p.dateSolved ?? '') >= weekStart &&
        (p.dateSolved ?? '') <= weekEnd
    ).length;
    const awareDays = awarenessLogs.filter(
      (l) =>
        l.dateKey >= weekStart &&
        l.dateKey <= weekEnd &&
        (l.dailyDevDone || l.hackerNewsDone || l.youtubeDone || l.githubTrendingDone || l.notesDone)
    ).length;
    return { focusSeconds, tasksDone, dsaSolved, awareDays };
  }, [focusSessions, tasks, dsaProblems, awarenessLogs, weekStart, weekEnd, timezone]);

  const monthlyTotals = useMemo(() => {
    const focusSeconds = focusSessions
      .filter((s) => s.dateKey >= monthStart && s.dateKey <= todayKey)
      .reduce((acc, s) => acc + s.actualSeconds, 0);
    const projectMilestonesDone = projects.reduce(
      (acc, p) => acc + (p.milestones ?? []).filter((m) => m.completed).length,
      0
    );
    const projectMilestonesTotal = projects.reduce(
      (acc, p) => acc + (p.milestones?.length ?? 0),
      0
    );
    const appsActive = internships.filter(
      (i) => !['Interested', 'Rejected', 'Withdrawn'].includes(i.status)
    ).length;

    return {
      focusSeconds,
      projectMilestonesDone,
      projectMilestonesTotal,
      appsActive,
    };
  }, [focusSessions, projects, internships, monthStart, todayKey]);

  const totalConcepts = stages.reduce((acc, s) => acc + (s.concepts?.length ?? 0), 0);
  const completedConcepts = stages.reduce(
    (acc, s) => acc + (s.concepts ?? []).filter((c) => c.completed).length,
    0
  );
  const curriculumPct =
    totalConcepts > 0 ? Math.round((completedConcepts / totalConcepts) * 100) : 0;

  const hasWeeklyChartActivity = weeklyChartData.some(
    (d) => d.focusHours > 0 || d.tasksDone > 0 || d.dsaSolved > 0 || d.blocksDone > 0
  );

  const milestonesCompleted = milestones.filter((m) => m.status === 'completed').length;
  const milestonesPct = milestones.length > 0 ? (milestonesCompleted / milestones.length) * 100 : 0;
  const stagesCompleted = stages.filter((s) => s.status === 'completed').length;
  const totalDsaSolved = dsaProblems.filter((p) => p.status === 'solved').length;
  const projectMilestonesPct =
    monthlyTotals.projectMilestonesTotal > 0
      ? (monthlyTotals.projectMilestonesDone / monthlyTotals.projectMilestonesTotal) * 100
      : 0;

  const kpiNumber = 'text-[30px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-text)]';
  const iconChip =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#8F87FA]/30 bg-[#6D64F0]/12 text-[var(--df-accent-secondary)]';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Derived strictly from your real stored tasks, focus logs, DSA records, and milestones"
      />

      <Reveal delay={0.05}>
        <SegmentedTabs
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'long_term', label: 'Long-Term (2026–2028)' },
          ]}
        />
      </Reveal>

      {period === 'weekly' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
            <Reveal delay={0.08} className="h-full">
              <Card interactive className="h-full">
                <CardContent className="flex items-center justify-between gap-3 pt-5">
                  <div className="min-w-0">
                    <p className="df-eyebrow">Tasks Completed (Week)</p>
                    <AnimatedNumber value={weeklyTotals.tasksDone} className={cn('mt-2 block', kpiNumber)} />
                    <p className="mt-1.5 text-[11px] text-[var(--df-text-muted)]">since week start</p>
                  </div>
                  <div className={iconChip}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.12} className="h-full">
              <Card interactive className="h-full">
                <CardContent className="flex items-center justify-between gap-3 pt-5">
                  <div className="min-w-0">
                    <p className="df-eyebrow">Study / Focus Hours</p>
                    <AnimatedNumber
                      value={weeklyTotals.focusSeconds}
                      format={(n) => formatDurationSeconds(Math.round(n))}
                      className={cn('mt-2 block', kpiNumber)}
                    />
                    <p className="mt-1.5 text-[11px] text-[var(--df-text-muted)]">focus logged</p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#5EE7F7]/30 bg-[#5EE7F7]/10 text-[var(--df-cyan)]">
                    <Timer className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.16} className="h-full">
              <Card interactive className="h-full">
                <CardContent className="flex items-center justify-between gap-3 pt-5">
                  <div className="min-w-0">
                    <p className="df-eyebrow">DSA Problems Solved</p>
                    <AnimatedNumber
                      value={weeklyTotals.dsaSolved}
                      className="mt-2 block text-[30px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-accent-secondary)]"
                    />
                    <p className="mt-1.5 text-[11px] text-[var(--df-text-muted)]">this week</p>
                  </div>
                  <div className={iconChip}>
                    <Code2 className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.2} className="h-full">
              <Card interactive className="h-full">
                <CardContent className="flex items-center justify-between gap-3 pt-5">
                  <div className="min-w-0">
                    <p className="df-eyebrow">Tech Awareness Days</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <AnimatedNumber
                        value={weeklyTotals.awareDays}
                        className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-success)]"
                      />
                      <span className="font-mono-tabular text-sm text-[var(--df-text-faint)]">/7</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[var(--df-text-muted)]">days with a check-in</p>
                  </div>
                  <ProgressRing
                    value={(weeklyTotals.awareDays / 7) * 100}
                    size={56}
                    stroke={5}
                    colors={['#22C55E', '#5EE7F7', '#A78BFA']}
                    label="Tech awareness days this week"
                  >
                    <Radio className="h-4 w-4 text-[var(--df-success)]" />
                  </ProgressRing>
                </CardContent>
              </Card>
            </Reveal>
          </div>

          <Reveal delay={0.24}>
            <Card elevated>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className={iconChip}>
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="df-eyebrow">This week</p>
                    <CardTitle>Weekly Focus Hours &amp; Activity</CardTitle>
                  </div>
                </div>
                {hasWeeklyChartActivity && (
                  <div className="hidden flex-wrap items-center gap-3 sm:flex" aria-hidden="true">
                    {CHART_SERIES.map((s) => (
                      <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-[var(--df-text-muted)]">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: s.swatch, boxShadow: `0 0 10px ${s.glow}` }}
                        />
                        {s.label}
                      </span>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!hasWeeklyChartActivity ? (
                  <EmptyState
                    icon={BarChart3}
                    title="No weekly activity logged yet"
                    description="Complete a schedule block, finish a focus session, or log a solved DSA problem to populate real weekly trends."
                  />
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center gap-3 sm:hidden" aria-hidden="true">
                      {CHART_SERIES.map((s) => (
                        <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-[var(--df-text-muted)]">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: s.swatch, boxShadow: `0 0 10px ${s.glow}` }}
                          />
                          {s.label}
                        </span>
                      ))}
                    </div>
                    <div className="h-64 w-full rounded-2xl df-well px-1 pt-4 pb-1 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyChartData} barGap={3} barCategoryGap="22%">
                          <defs>
                            <linearGradient id="dfBarFocus" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#A78BFA" />
                              <stop offset="100%" stopColor="#5145C8" stopOpacity={0.85} />
                            </linearGradient>
                            <linearGradient id="dfBarBlocks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#5EE7F7" />
                              <stop offset="100%" stopColor="#22C55E" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="dfBarTasks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F59AC8" />
                              <stop offset="100%" stopColor="#8F87FA" stopOpacity={0.85} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="var(--df-border)" />
                          <XAxis
                            dataKey="day"
                            stroke="var(--df-text-faint)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <YAxis
                            stroke="var(--df-text-faint)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            width={32}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(143,135,250,0.08)', radius: 10 }}
                            contentStyle={{
                              background: 'var(--df-elevated)',
                              border: '1px solid var(--df-border-strong)',
                              borderRadius: 14,
                              backdropFilter: 'blur(20px)',
                              color: 'var(--df-text)',
                              fontSize: '12px',
                              boxShadow: '0 18px 40px -18px rgba(0,0,0,0.6)',
                            }}
                            labelStyle={{ color: 'var(--df-text)', fontWeight: 600, marginBottom: 4 }}
                            itemStyle={{ padding: '1px 0' }}
                          />
                          <Bar dataKey="focusHours" name="Focus (hrs)" fill="url(#dfBarFocus)" radius={[6, 6, 0, 0]} maxBarSize={22} />
                          <Bar dataKey="blocksDone" name="Schedule Blocks" fill="url(#dfBarBlocks)" radius={[6, 6, 0, 0]} maxBarSize={22} />
                          <Bar dataKey="tasksDone" name="Tasks Done" fill="url(#dfBarTasks)" radius={[6, 6, 0, 0]} maxBarSize={22} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-2.5 py-0.5 font-mono-tabular text-[var(--df-success)]">
                        {weeklyBlockBreakdown.done} slots done
                      </span>
                      <span className="rounded-full border border-[#F0B455]/30 bg-[#F0B455]/10 px-2.5 py-0.5 font-mono-tabular text-[var(--df-warning)]">
                        {weeklyBlockBreakdown.partial} partial
                      </span>
                      <span className="rounded-full border border-[#F06A6A]/30 bg-[#F06A6A]/10 px-2.5 py-0.5 font-mono-tabular text-[var(--df-error)]">
                        {weeklyBlockBreakdown.wasted} wasted
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>
      )}

      {period === 'monthly' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Reveal delay={0.08} className="h-full">
            <Card interactive className="h-full">
              <CardContent className="flex items-center gap-4 pt-5">
                <div className="relative flex h-[64px] w-[64px] shrink-0 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(94,231,247,0.3),transparent)] blur-md df-breathe" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#5EE7F7]/35 bg-[linear-gradient(145deg,rgba(94,231,247,0.2),rgba(109,100,240,0.08))] text-[var(--df-cyan)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                    <Timer className="h-5 w-5" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="df-eyebrow">Focus Time (30 Days)</p>
                  <AnimatedNumber
                    value={monthlyTotals.focusSeconds}
                    format={(n) => formatDurationSeconds(Math.round(n))}
                    className={cn('mt-2 block', kpiNumber)}
                  />
                </div>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal delay={0.14} className="h-full">
            <Card interactive className="h-full">
              <CardContent className="flex items-center gap-4 pt-5">
                <ProgressRing value={projectMilestonesPct} size={64} stroke={5} label="Project milestones completed">
                  <Flag className="h-4 w-4 text-[var(--df-accent-secondary)]" />
                </ProgressRing>
                <div className="min-w-0">
                  <p className="df-eyebrow">Project Milestones (all-time)</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <AnimatedNumber value={monthlyTotals.projectMilestonesDone} className={kpiNumber} />
                    <span className="font-mono-tabular text-sm text-[var(--df-text-faint)]">
                      /{monthlyTotals.projectMilestonesTotal}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal delay={0.2} className="h-full">
            <Card interactive className="h-full">
              <CardContent className="flex items-center gap-4 pt-5">
                <div className="relative flex h-[64px] w-[64px] shrink-0 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(109,100,240,0.35),transparent)] blur-md df-breathe" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#8F87FA]/35 bg-[linear-gradient(145deg,rgba(109,100,240,0.25),rgba(94,231,247,0.06))] text-[var(--df-accent-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="df-eyebrow">Active Internship Applications (current)</p>
                  <AnimatedNumber
                    value={monthlyTotals.appsActive}
                    className="mt-2 block text-[30px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-accent-secondary)]"
                  />
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      )}

      {period === 'long_term' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Reveal delay={0.08} className="h-full">
            <Card elevated className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className={iconChip}>
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <CardTitle>Curriculum Completion (16 Stages)</CardTitle>
                </div>
                <span className="rounded-full border border-[#8F87FA]/30 bg-[#6D64F0]/12 px-2.5 py-0.5 font-mono-tabular text-xs text-[var(--df-accent-secondary)]">
                  {curriculumPct}%
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <ProgressRing value={curriculumPct} size={84} stroke={6} label="Curriculum completion">
                    <span className="font-mono-tabular text-sm font-semibold text-[var(--df-text)]">
                      {curriculumPct}%
                    </span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1 space-y-2">
                    <ProgressBar value={curriculumPct} />
                  </div>
                </div>
                <div className="df-hairline" />
                <p className="text-xs text-[var(--df-text-muted)]">
                  {completedConcepts} of {totalConcepts} concepts checked off ·{' '}
                  {stagesCompleted}/16 stages marked completed.
                </p>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.14} className="h-full">
            <Card elevated className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#5EE7F7]/30 bg-[#5EE7F7]/10 text-[var(--df-cyan)]">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <CardTitle>US Master&apos;s Milestones (Fall 2028)</CardTitle>
                </div>
                <span className="rounded-full border border-[#5EE7F7]/30 bg-[#5EE7F7]/10 px-2.5 py-0.5 font-mono-tabular text-xs text-[var(--df-cyan)]">
                  {milestonesCompleted}/{milestones.length}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <ProgressRing
                    value={milestonesPct}
                    size={84}
                    stroke={6}
                    colors={['#5EE7F7', '#8F87FA', '#A78BFA']}
                    label="Master's milestones completion"
                  >
                    <span className="font-mono-tabular text-sm font-semibold text-[var(--df-text)]">
                      {Math.round(milestonesPct)}%
                    </span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1 space-y-2">
                    <ProgressBar value={milestonesPct} />
                  </div>
                </div>
                <div className="df-hairline" />
                <p className="text-xs text-[var(--df-text-muted)]">
                  Total DSA solved: {totalDsaSolved} · Tracked internships: {internships.length}
                </p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      )}
    </div>
  );
}
