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
import { BarChart3 } from 'lucide-react';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID } from '@/config/personalPlan';
import { useIstClock } from '@/hooks/useIstClock';
import {
  addDaysToDateKey,
  formatDurationMinutes,
  getDateKeyFromIso,
  getShortDayLabel,
  getWeekDateKeys,
} from '@/lib/dateUtils';
import { resolveDaySchedule } from '@/lib/scheduleEngine';
import { EmptyState, PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar, SegmentedTabs } from '@/components/ui/Primitives';

type AnalyticsPeriod = 'weekly' | 'monthly' | 'long_term';

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
      }).filter((b) => b.category !== 'break' && b.title !== 'Sleep');
      const blocksDone = dayBlocks.filter((b) => b.completed).length;

      return {
        day: getShortDayLabel(dk),
        focusHours: Number((focusMins / 60).toFixed(2)),
        tasksDone,
        dsaSolved,
        blocksDone,
      };
    });
  }, [weekKeys, focusSessions, tasks, dsaProblems, templates, instances, profile?.electiveThreeName, timezone]);

  const weekStart = weekKeys[0] ?? istNow.dateKey;
  // -29 so the inclusive window today..monthStart spans exactly 30 days.
  const monthStart = addDaysToDateKey(istNow.dateKey, -29);

  const weeklyTotals = useMemo(() => {
    const focusMins = Math.round(
      focusSessions
        .filter((s) => s.dateKey >= weekStart)
        .reduce((acc, s) => acc + s.actualSeconds, 0) / 60
    );
    const tasksDone = tasks.filter(
      (t) =>
        t.completed &&
        t.completedAt &&
        getDateKeyFromIso(t.completedAt, timezone) >= weekStart
    ).length;
    const dsaSolved = dsaProblems.filter(
      (p) => p.status === 'solved' && (p.dateSolved ?? '') >= weekStart
    ).length;
    const awareDays = awarenessLogs.filter(
      (l) =>
        l.dateKey >= weekStart &&
        (l.dailyDevDone || l.hackerNewsDone || l.youtubeDone || l.githubTrendingDone)
    ).length;
    return { focusMins, tasksDone, dsaSolved, awareDays };
  }, [focusSessions, tasks, dsaProblems, awarenessLogs, weekStart, timezone]);

  const monthlyTotals = useMemo(() => {
    const focusMins = Math.round(
      focusSessions
        .filter((s) => s.dateKey >= monthStart)
        .reduce((acc, s) => acc + s.actualSeconds, 0) / 60
    );
    const projectMilestonesDone = projects.reduce(
      (acc, p) => acc + p.milestones.filter((m) => m.completed).length,
      0
    );
    const projectMilestonesTotal = projects.reduce(
      (acc, p) => acc + p.milestones.length,
      0
    );
    const appsActive = internships.filter(
      (i) => !['Interested', 'Rejected', 'Withdrawn'].includes(i.status)
    ).length;

    return {
      focusMins,
      projectMilestonesDone,
      projectMilestonesTotal,
      appsActive,
    };
  }, [focusSessions, projects, internships, monthStart]);

  const totalConcepts = stages.reduce((acc, s) => acc + s.concepts.length, 0);
  const completedConcepts = stages.reduce(
    (acc, s) => acc + s.concepts.filter((c) => c.completed).length,
    0
  );
  const curriculumPct =
    totalConcepts > 0 ? Math.round((completedConcepts / totalConcepts) * 100) : 0;

  const hasWeeklyChartActivity = weeklyChartData.some(
    (d) => d.focusHours > 0 || d.tasksDone > 0 || d.dsaSolved > 0 || d.blocksDone > 0
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Derived strictly from your real stored tasks, focus logs, DSA records, and milestones"
      />

      <SegmentedTabs
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'long_term', label: 'Long-Term (2026–2028)' },
        ]}
      />

      {period === 'weekly' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--df-text-muted)]">Tasks Completed (Week)</p>
                <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[var(--df-text)]">
                  {weeklyTotals.tasksDone}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--df-text-muted)]">Study / Focus Hours</p>
                <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[var(--df-text)]">
                  {formatDurationMinutes(weeklyTotals.focusMins)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--df-text-muted)]">DSA Problems Solved</p>
                <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#8178F5]">
                  {weeklyTotals.dsaSolved}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--df-text-muted)]">Tech Awareness Days</p>
                <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#16A34A]">
                  {weeklyTotals.awareDays}/7
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Focus Hours &amp; Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasWeeklyChartActivity ? (
                <EmptyState
                  icon={BarChart3}
                  title="No weekly activity logged yet"
                  description="Complete a schedule block, finish a focus session, or log a solved DSA problem to populate real weekly trends."
                />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" />
                      <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#191D25',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#F3F4F6',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="focusHours" name="Focus (hrs)" fill="#635BDB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="blocksDone" name="Schedule Blocks" fill="#16A34A" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="tasksDone" name="Tasks Done" fill="#8178F5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {period === 'monthly' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-[var(--df-text-muted)]">Focus Time (30 Days)</p>
              <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[var(--df-text)]">
                {formatDurationMinutes(monthlyTotals.focusMins)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-[var(--df-text-muted)]">Project Milestones (all-time)</p>
              <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[var(--df-text)]">
                {monthlyTotals.projectMilestonesDone}/{monthlyTotals.projectMilestonesTotal}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-[var(--df-text-muted)]">Active Internship Applications (current)</p>
              <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#8178F5]">
                {monthlyTotals.appsActive}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {period === 'long_term' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Curriculum Completion (16 Stages)</CardTitle>
              <span className="font-mono-tabular text-xs text-[#8178F5]">
                {curriculumPct}%
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProgressBar value={curriculumPct} />
              <p className="text-xs text-[var(--df-text-muted)]">
                {completedConcepts} of {totalConcepts} concepts checked off ·{' '}
                {stages.filter((s) => s.status === 'completed').length}/16 stages marked completed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>US Master&apos;s Milestones (Fall 2028)</CardTitle>
              <span className="font-mono-tabular text-xs text-[#8178F5]">
                {milestones.filter((m) => m.status === 'completed').length}/{milestones.length}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProgressBar
                value={
                  milestones.length > 0
                    ? (milestones.filter((m) => m.status === 'completed').length /
                        milestones.length) *
                      100
                    : 0
                }
              />
              <p className="text-xs text-[var(--df-text-muted)]">
                Total DSA solved: {dsaProblems.filter((p) => p.status === 'solved').length} ·
                Tracked internships: {internships.length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
