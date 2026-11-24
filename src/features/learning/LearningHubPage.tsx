import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  Bookmark,
  Check,
  Code2,
  ExternalLink,
  Newspaper,
  Plus,
  Trash2,
  Tv,
  X,
} from 'lucide-react';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID } from '@/config/personalPlan';
import {
  DSA_DAILY_STRUCTURE,
  DSA_RESOURCES,
  FIRST_12_WEEK_CURRICULUM,
} from '@/config/curriculum';
import {
  DAILY_READING_WEBSITES,
  getYoutubeChannelForDay,
  YOUTUBE_ROTATION,
} from '@/config/awareness';
import { useIstClock } from '@/hooks/useIstClock';
import { useToast } from '@/app/providers/ToastProvider';
import {
  addSavedTechResource,
  deleteDsaProblem,
  deleteSavedTechResource,
  toggleSavedTechResourceRead,
  toggleStageConcept,
  updateLearningStage,
  upsertAwarenessLog,
  upsertDsaProblem,
} from '@/services/storage/repositories';
import {
  addDaysToDateKey,
  formatShortDateLabel,
} from '@/lib/dateUtils';
import { dsaProblemFormSchema, type DsaProblemFormValues } from '@/lib/validations';
import { ConfirmDialog, EmptyState, PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { DebouncedTextarea } from '@/components/ui/DebouncedField';
import { ProgressBar, SegmentedTabs } from '@/components/ui/Primitives';
import { cn, safeExternalUrl } from '@/lib/utils';
import type { DsaDifficulty, DsaPlatform, DsaProblem, LearningStage, StageStatus } from '@/types';

type HubTab = 'curriculum' | 'dsa' | 'awareness' | 'roadmap';

export default function LearningHubPage() {
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const rawStages = useLiveQuery(() => db.learningStages.orderBy('stageNumber').toArray(), []);
  const rawDsaProblems = useLiveQuery(() => db.dsaProblems.toArray(), []);
  const rawAwarenessLogs = useLiveQuery(() => db.awarenessLogs.toArray(), []);
  const rawSavedResources = useLiveQuery(() => db.savedResources.toArray(), []);
  const stages = useMemo(() => rawStages ?? [], [rawStages]);
  const dsaProblems = useMemo(() => rawDsaProblems ?? [], [rawDsaProblems]);
  const awarenessLogs = useMemo(() => rawAwarenessLogs ?? [], [rawAwarenessLogs]);
  const savedResources = useMemo(() => rawSavedResources ?? [], [rawSavedResources]);

  const istNow = useIstClock(profile?.timezone ?? 'Asia/Kolkata');
  const { toast } = useToast();

  const [tab, setTab] = useState<HubTab>('curriculum');
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // DSA filters & modal
  const [dsaSearch, setDsaSearch] = useState('');
  const [dsaDiffFilter, setDsaDiffFilter] = useState<DsaDifficulty | 'All'>('All');
  const [dsaPlatformFilter, setDsaPlatformFilter] = useState<DsaPlatform | 'All'>('All');
  const [dsaStatusFilter, setDsaStatusFilter] = useState<'all' | 'solved' | 'attempted' | 'revision'>('all');
  const [dsaModalOpen, setDsaModalOpen] = useState(false);
  const [editingDsa, setEditingDsa] = useState<DsaProblem | null>(null);
  const [deleteDsaTarget, setDeleteDsaTarget] = useState<DsaProblem | null>(null);

  // Tech awareness save-for-later
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resSource, setResSource] = useState('daily.dev');

  const selectedStage: LearningStage | null =
    stages.find((s) => s.id === selectedStageId) ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DsaProblemFormValues>({
    resolver: zodResolver(dsaProblemFormSchema) as never,
    defaultValues: {
      problemName: '',
      platform: 'LeetCode',
      topic: 'Arrays & Hashing',
      difficulty: 'Medium',
      status: 'solved',
      dateAttempted: istNow.dateKey,
      dateSolved: istNow.dateKey,
      timeTakenMinutes: 35,
      solutionLink: '',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      revisitDate: '',
      mistakes: '',
      notes: '',
    },
  });

  function openNewDsaModal() {
    setEditingDsa(null);
    reset({
      problemName: '',
      platform: 'LeetCode',
      topic: 'Arrays & Hashing',
      difficulty: 'Medium',
      status: 'solved',
      dateAttempted: istNow.dateKey,
      dateSolved: istNow.dateKey,
      timeTakenMinutes: 35,
      solutionLink: '',
      timeComplexity: '',
      spaceComplexity: '',
      revisitDate: '',
      mistakes: '',
      notes: '',
    });
    setDsaModalOpen(true);
  }

  function openEditDsaModal(prob: DsaProblem) {
    setEditingDsa(prob);
    reset({
      problemName: prob.problemName,
      platform: prob.platform,
      topic: prob.topic,
      difficulty: prob.difficulty,
      status: prob.status,
      dateAttempted: prob.dateAttempted,
      dateSolved: prob.dateSolved ?? '',
      timeTakenMinutes: prob.timeTakenMinutes,
      solutionLink: prob.solutionLink ?? '',
      timeComplexity: prob.timeComplexity,
      spaceComplexity: prob.spaceComplexity,
      revisitDate: prob.revisitDate ?? '',
      mistakes: prob.mistakes,
      notes: prob.notes,
    });
    setDsaModalOpen(true);
  }

  async function onSubmitDsa(values: DsaProblemFormValues) {
    await upsertDsaProblem(
      {
        problemName: values.problemName,
        platform: values.platform,
        topic: values.topic,
        difficulty: values.difficulty,
        status: values.status,
        dateAttempted: values.dateAttempted,
        dateSolved: values.status === 'solved' ? values.dateSolved || istNow.dateKey : undefined,
        timeTakenMinutes: values.timeTakenMinutes,
        solutionLink: values.solutionLink || undefined,
        timeComplexity: values.timeComplexity,
        spaceComplexity: values.spaceComplexity,
        revisitDate: values.revisitDate || undefined,
        mistakes: values.mistakes,
        notes: values.notes,
      },
      editingDsa?.id
    );
    toast(editingDsa ? 'DSA problem updated' : 'DSA problem logged', { tone: 'success' });
    setDsaModalOpen(false);
  }

  // Real DSA Analytics
  const dsaStats = useMemo(() => {
    const solved = dsaProblems.filter((p) => p.status === 'solved');
    // Inclusive windows: -6 / -29 so they span exactly 7 / 30 days including today.
    const weekAgo = addDaysToDateKey(istNow.dateKey, -6);
    const monthAgo = addDaysToDateKey(istNow.dateKey, -29);
    const solvedThisWeek = solved.filter((p) => (p.dateSolved ?? '') >= weekAgo).length;
    const solvedThisMonth = solved.filter((p) => (p.dateSolved ?? '') >= monthAgo).length;
    const revisionBacklog = dsaProblems.filter(
      (p) => p.revisitDate && p.revisitDate <= istNow.dateKey
    ).length;

    const byDifficulty = {
      Easy: solved.filter((p) => p.difficulty === 'Easy').length,
      Medium: solved.filter((p) => p.difficulty === 'Medium').length,
      Hard: solved.filter((p) => p.difficulty === 'Hard').length,
    };

    const topicMap = new Map<string, number>();
    for (const p of solved) {
      topicMap.set(p.topic, (topicMap.get(p.topic) ?? 0) + 1);
    }

    return {
      totalSolved: solved.length,
      solvedThisWeek,
      solvedThisMonth,
      revisionBacklog,
      byDifficulty,
      topics: Array.from(topicMap.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [dsaProblems, istNow.dateKey]);

  const filteredDsa = useMemo(() => {
    const q = dsaSearch.trim().toLowerCase();
    return [...dsaProblems]
      .filter((p) => {
        if (dsaDiffFilter !== 'All' && p.difficulty !== dsaDiffFilter) return false;
        if (dsaPlatformFilter !== 'All' && p.platform !== dsaPlatformFilter) return false;
        if (dsaStatusFilter === 'solved' && p.status !== 'solved') return false;
        if (dsaStatusFilter === 'attempted' && p.status !== 'attempted') return false;
        if (
          dsaStatusFilter === 'revision' &&
          (!p.revisitDate || p.revisitDate > istNow.dateKey)
        ) {
          return false;
        }
        if (
          q &&
          !p.problemName.toLowerCase().includes(q) &&
          !p.topic.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.dateAttempted.localeCompare(a.dateAttempted));
  }, [dsaProblems, dsaSearch, dsaDiffFilter, dsaPlatformFilter, dsaStatusFilter, istNow.dateKey]);

  // Tech awareness today
  const todayYt = getYoutubeChannelForDay(istNow.dayOfWeek);
  const todayAwareness = awarenessLogs.find((l) => l.dateKey === istNow.dateKey);
  const awarenessChecksDone = [
    todayAwareness?.dailyDevDone,
    todayAwareness?.hackerNewsDone,
    todayAwareness?.youtubeDone,
    todayAwareness?.githubTrendingDone,
    todayAwareness?.notesDone,
  ].filter(Boolean).length;

  async function handleSaveResource(e: React.FormEvent) {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) return;
    await addSavedTechResource({
      title: resTitle.trim(),
      url: resUrl.trim(),
      source: resSource,
      tags: [],
    });
    setResTitle('');
    setResUrl('');
    toast('Saved for later', { tone: 'success' });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Learning Hub"
        subtitle="16-stage Software Engineering curriculum, Java DSA tracker, and 8–9 PM Tech Awareness"
        actions={
          tab === 'dsa' ? (
            <Button variant="primary" size="sm" onClick={openNewDsaModal}>
              <Plus className="h-4 w-4" />
              Log DSA Problem
            </Button>
          ) : undefined
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'curriculum', label: '16-Stage Curriculum', count: stages.filter((s) => s.status === 'completed').length },
          { value: 'dsa', label: 'DSA Tracker (Java)', count: dsaStats.totalSolved },
          { value: 'awareness', label: 'Tech Awareness (8–9 PM)', count: awarenessChecksDone },
          { value: 'roadmap', label: 'First 12 Weeks' },
        ]}
      />

      {/* 16-STAGE CURRICULUM */}
      {tab === 'curriculum' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage) => {
            const doneCount = stage.concepts.filter((c) => c.completed).length;
            const pct =
              stage.concepts.length > 0
                ? Math.round((doneCount / stage.concepts.length) * 100)
                : 0;

            return (
              <Card
                key={stage.id}
                className="cursor-pointer hover:border-[#635BDB]/50"
                onClick={() => setSelectedStageId(stage.id)}
              >
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono-tabular text-xs font-semibold text-[#8178F5]">
                      STAGE {String(stage.stageNumber).padStart(2, '0')}
                    </span>
                    <Badge
                      tone={
                        stage.status === 'completed'
                          ? 'success'
                          : stage.status === 'in_progress'
                            ? 'accent'
                            : 'neutral'
                      }
                    >
                      {stage.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[var(--df-text)]">
                      {stage.title}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--df-text-muted)] line-clamp-2">
                      {stage.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {stage.recommendedChannels.map((ch) => (
                      <Badge key={ch} tone="neutral">
                        {ch}
                      </Badge>
                    ))}
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-[11px] font-mono-tabular text-[var(--df-text-muted)]">
                      <span>{doneCount}/{stage.concepts.length} concepts</span>
                      <span>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* DSA TRACKER (JAVA) */}
      {tab === 'dsa' && (
        <div className="space-y-4">
          {/* Daily Java DSA Structure & Real Stats */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--df-text-muted)]">Total Solved (Java)</p>
                <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[var(--df-text)]">
                  {dsaStats.totalSolved}
                </p>
                <p className="mt-1 text-[11px] text-[var(--df-text-muted)] font-mono-tabular">
                  E {dsaStats.byDifficulty.Easy} · M {dsaStats.byDifficulty.Medium} · H {dsaStats.byDifficulty.Hard}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--df-text-muted)]">Solved This Week / Month</p>
                <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[var(--df-text)]">
                  {dsaStats.solvedThisWeek} / {dsaStats.solvedThisMonth}
                </p>
                <p className="mt-1 text-[11px] text-[var(--df-text-muted)]">7d / 30d window</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--df-text-muted)]">Revision Backlog</p>
                <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#E5A03C]">
                  {dsaStats.revisionBacklog}
                </p>
                <p className="mt-1 text-[11px] text-[var(--df-text-muted)]">Due for revisit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--df-text-muted)]">Daily 60m Formula</p>
                <div className="mt-1.5 space-y-0.5 text-[11px] text-[var(--df-text)]">
                  {DSA_DAILY_STRUCTURE.map((step) => (
                    <div key={step.phase} className="flex justify-between">
                      <span className="text-[var(--df-text-muted)]">{step.phase}</span>
                      <span className="font-mono-tabular text-[#8178F5]">{step.minutes}m</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* External Resources */}
          <div className="flex flex-wrap items-center gap-2">
            {DSA_RESOURCES.map((res) => (
              <a
                key={res.name}
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--df-border)] bg-[var(--df-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--df-text)] hover:border-[#635BDB]"
              >
                <span>{res.name}</span>
                <ExternalLink className="h-3 w-3 text-[var(--df-text-muted)]" />
              </a>
            ))}
          </div>

          {/* Topic Breakdown if any */}
          {dsaStats.topics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Topic Progress</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {dsaStats.topics.map(([topic, count]) => (
                  <Badge key={topic} tone="accent" className="font-mono-tabular">
                    {topic}: {count}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <Input
                value={dsaSearch}
                onChange={(e) => setDsaSearch(e.target.value)}
                placeholder="Search problem or topic..."
                aria-label="Search DSA problems"
              />
              <Select
                value={dsaDiffFilter}
                onChange={(e) => setDsaDiffFilter(e.target.value as DsaDifficulty | 'All')}
                aria-label="Filter DSA difficulty"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>
              <Select
                value={dsaPlatformFilter}
                onChange={(e) => setDsaPlatformFilter(e.target.value as DsaPlatform | 'All')}
                aria-label="Filter DSA platform"
              >
                <option value="All">All Platforms</option>
                <option value="LeetCode">LeetCode</option>
                <option value="NeetCode">NeetCode</option>
                <option value="Striver">Striver</option>
                <option value="GFG">GFG</option>
                <option value="Other">Other</option>
              </Select>
              <Select
                value={dsaStatusFilter}
                onChange={(e) => setDsaStatusFilter(e.target.value as typeof dsaStatusFilter)}
                aria-label="Filter DSA status"
              >
                <option value="all">All Statuses</option>
                <option value="solved">Solved</option>
                <option value="attempted">Unsolved / Attempted</option>
                <option value="revision">Revision Required</option>
              </Select>
            </CardContent>
          </Card>

          {filteredDsa.length === 0 ? (
            <EmptyState
              icon={Code2}
              title="No DSA problems logged yet"
              description="Log your Java practice sessions with time taken, complexity, mistakes, and revisit date."
              actionLabel="Log First Problem"
              onAction={openNewDsaModal}
            />
          ) : (
            <div className="space-y-2">
              {filteredDsa.map((prob) => (
                <Card key={prob.id}>
                  <CardContent className="pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--df-text)]">
                          {prob.problemName}
                        </span>
                        <Badge
                          tone={
                            prob.difficulty === 'Hard'
                              ? 'error'
                              : prob.difficulty === 'Medium'
                                ? 'warning'
                                : 'success'
                          }
                        >
                          {prob.difficulty}
                        </Badge>
                        <Badge tone="accent">{prob.topic}</Badge>
                        <Badge tone={prob.status === 'solved' ? 'success' : 'neutral'}>
                          {prob.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-[var(--df-text-muted)] font-mono-tabular">
                        {prob.platform} · {prob.timeTakenMinutes}m · Attempted {formatShortDateLabel(prob.dateAttempted)}
                        {prob.timeComplexity ? ` · T: ${prob.timeComplexity}` : ''}
                        {prob.spaceComplexity ? ` · S: ${prob.spaceComplexity}` : ''}
                        {prob.revisitDate ? ` · Revisit: ${formatShortDateLabel(prob.revisitDate)}` : ''}
                      </p>
                      {(prob.mistakes || prob.notes) && (
                        <p className="mt-1 text-xs text-[var(--df-text-muted)]">
                          {prob.mistakes ? `Mistakes: ${prob.mistakes}` : prob.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {safeExternalUrl(prob.solutionLink) && (
                        <a
                          href={safeExternalUrl(prob.solutionLink)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--df-border)] px-2.5 text-xs text-[var(--df-text)] hover:border-[#635BDB]"
                        >
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEditDsaModal(prob)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDsaTarget(prob)}
                        aria-label={`Delete ${prob.problemName}`}
                        className="text-[#E05252]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TECH AWARENESS (8–9 PM) */}
      {tab === 'awareness' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="space-y-4 lg:col-span-7">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Daily 8:00–9:00 PM Routine ({istNow.dayName})</CardTitle>
                  <p className="text-xs text-[var(--df-text-muted)]">
                    5 independently trackable items · Today&apos;s YouTube: {todayYt.channel}
                  </p>
                </div>
                <Badge tone="accent" className="font-mono-tabular">
                  {awarenessChecksDone}/5
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  {
                    key: 'dailyDevDone' as const,
                    time: '08:00–08:20 PM',
                    label: 'daily.dev',
                    url: 'https://daily.dev/',
                    done: Boolean(todayAwareness?.dailyDevDone),
                  },
                  {
                    key: 'hackerNewsDone' as const,
                    time: '08:20–08:30 PM',
                    label: 'Hacker News',
                    url: 'https://news.ycombinator.com/',
                    done: Boolean(todayAwareness?.hackerNewsDone),
                  },
                  {
                    key: 'youtubeDone' as const,
                    time: '08:30–08:45 PM',
                    label: `YouTube: ${todayYt.channel} (${todayYt.topic})`,
                    done: Boolean(todayAwareness?.youtubeDone),
                  },
                  {
                    key: 'githubTrendingDone' as const,
                    time: '08:45–08:55 PM',
                    label: 'GitHub Trending',
                    url: 'https://github.com/trending/',
                    done: Boolean(todayAwareness?.githubTrendingDone),
                  },
                  {
                    key: 'notesDone' as const,
                    time: '08:55–09:00 PM',
                    label: 'Technology notes',
                    done: Boolean(todayAwareness?.notesDone),
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)]/70 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          void upsertAwarenessLog(istNow.dateKey, {
                            [item.key]: !item.done,
                          })
                        }
                        aria-label={`Toggle ${item.label}`}
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border cursor-pointer',
                          item.done
                            ? 'border-[#16A34A] bg-[#16A34A] text-white'
                            : 'border-[var(--df-text-muted)]/50'
                        )}
                      >
                        {item.done && <Check className="h-3 w-3" />}
                      </button>
                      <div className="min-w-0">
                        <span className="font-mono-tabular text-[11px] text-[var(--df-text-muted)]">
                          {item.time}
                        </span>
                        <p
                          className={cn(
                            'text-sm font-medium text-[var(--df-text)]',
                            item.done && 'line-through text-[var(--df-text-muted)]'
                          )}
                        >
                          {item.label}
                        </p>
                      </div>
                    </div>

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--df-border)] px-2.5 text-xs text-[var(--df-text)] hover:border-[#635BDB] shrink-0"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}

                <div className="pt-2">
                  <FieldLabel htmlFor="aware-notes">Today&apos;s Technology Notes</FieldLabel>
                  <DebouncedTextarea
                    id="aware-notes"
                    value={todayAwareness?.notes ?? ''}
                    onCommit={(next) =>
                      void upsertAwarenessLog(istNow.dateKey, { notes: next })
                    }
                    placeholder="Capture key engineering insights, tools, or papers read today..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Session History */}
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
                <Newspaper className="h-4 w-4 text-[#8178F5]" />
              </CardHeader>
              <CardContent>
                {awarenessLogs.length === 0 ? (
                  <p className="text-xs text-[var(--df-text-muted)]">
                    Completed awareness sessions will appear here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {[...awarenessLogs]
                      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
                      .slice(0, 10)
                      .map((log) => {
                        const count = [
                          log.dailyDevDone,
                          log.hackerNewsDone,
                          log.youtubeDone,
                          log.githubTrendingDone,
                          log.notesDone,
                        ].filter(Boolean).length;
                        return (
                          <div
                            key={log.id}
                            className="flex items-center justify-between rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)]/60 px-3 py-2 text-xs"
                          >
                            <div>
                              <span className="font-mono-tabular font-medium text-[var(--df-text)]">
                                {formatShortDateLabel(log.dateKey)}
                              </span>
                              <span className="ml-2 text-[var(--df-text-muted)]">
                                {log.youtubeChannel}
                              </span>
                              {log.notes && (
                                <p className="mt-0.5 text-[11px] text-[var(--df-text-muted)] line-clamp-1">
                                  {log.notes}
                                </p>
                              )}
                            </div>
                            <Badge tone={count === 5 ? 'success' : 'neutral'} className="font-mono-tabular">
                              {count}/5
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-5">
            {/* YouTube Rotation */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly YouTube Rotation</CardTitle>
                <Tv className="h-4 w-4 text-[#8178F5]" />
              </CardHeader>
              <CardContent className="space-y-1.5">
                {YOUTUBE_ROTATION.map((row) => (
                  <div
                    key={row.dayName}
                    className={cn(
                      'flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-xs',
                      row.dayOfWeek === istNow.dayOfWeek
                        ? 'border-[#635BDB] bg-[#635BDB]/10'
                        : 'border-[var(--df-border)] bg-[var(--df-bg)]/60'
                    )}
                  >
                    <div>
                      <span className="font-medium text-[var(--df-text)]">{row.dayName}</span>
                      <p className="text-[11px] text-[var(--df-text-muted)]">{row.topic}</p>
                    </div>
                    <Badge tone={row.dayOfWeek === istNow.dayOfWeek ? 'accent' : 'neutral'}>
                      {row.channel}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Daily Reading Websites */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Reading Portals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DAILY_READING_WEBSITES.map((site) => (
                  <a
                    key={site.id}
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)]/60 px-3 py-2 text-xs hover:border-[#635BDB]"
                  >
                    <div>
                      <p className="font-medium text-[var(--df-text)]">{site.name}</p>
                      <p className="text-[11px] text-[var(--df-text-muted)]">{site.role}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-[var(--df-text-muted)] shrink-0" />
                  </a>
                ))}
              </CardContent>
            </Card>

            {/* Save for Later */}
            <Card>
              <CardHeader>
                <CardTitle>Save for Later</CardTitle>
                <Bookmark className="h-4 w-4 text-[#E5A03C]" />
              </CardHeader>
              <CardContent className="space-y-3">
                <form onSubmit={handleSaveResource} className="space-y-2">
                  <Input
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    placeholder="Article or repo title"
                    aria-label="Resource title"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={resUrl}
                      onChange={(e) => setResUrl(e.target.value)}
                      placeholder="https://..."
                      aria-label="Resource URL"
                    />
                    <Select
                      value={resSource}
                      onChange={(e) => setResSource(e.target.value)}
                      className="w-32"
                      aria-label="Resource source"
                    >
                      <option value="daily.dev">daily.dev</option>
                      <option value="Hacker News">Hacker News</option>
                      <option value="GitHub Trending">GitHub</option>
                      <option value="roadmap.sh">roadmap.sh</option>
                      <option value="Hugging Face">HF Learn</option>
                    </Select>
                  </div>
                  <Button type="submit" variant="secondary" size="sm" className="w-full">
                    Save Link
                  </Button>
                </form>

                {savedResources.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {savedResources.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)] px-2.5 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => void toggleSavedTechResourceRead(item)}
                            className={cn(
                              'h-4 w-4 shrink-0 rounded border flex items-center justify-center cursor-pointer',
                              item.read
                                ? 'border-[#16A34A] bg-[#16A34A] text-white'
                                : 'border-[var(--df-text-muted)]/50'
                            )}
                            aria-label={`Mark ${item.title} read`}
                          >
                            {item.read && <Check className="h-3 w-3" />}
                          </button>
                          <a
                            href={safeExternalUrl(item.url) ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              'truncate hover:text-[#8178F5]',
                              item.read && 'line-through text-[var(--df-text-muted)]'
                            )}
                          >
                            {item.title}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void deleteSavedTechResource(item.id)}
                          aria-label={`Delete ${item.title}`}
                          className="h-7 w-7 text-[#E05252]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* FIRST 12 WEEKS ROADMAP */}
      {tab === 'roadmap' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIRST_12_WEEK_CURRICULUM.map((item) => {
            const linkedStage = stages.find((s) => s.stageNumber === item.stageRef);
            return (
              <Card key={item.week}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tabular text-xs font-semibold text-[#8178F5]">
                      WEEK {String(item.week).padStart(2, '0')}
                    </span>
                    {linkedStage && (
                      <Badge
                        tone={
                          linkedStage.status === 'completed'
                            ? 'success'
                            : linkedStage.status === 'in_progress'
                              ? 'accent'
                              : 'neutral'
                        }
                      >
                        Stage {linkedStage.stageNumber}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--df-text)]">{item.title}</p>
                  {linkedStage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-0 text-[#8178F5]"
                      onClick={() => {
                        setTab('curriculum');
                        setSelectedStageId(linkedStage.id);
                      }}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Open Stage {linkedStage.stageNumber}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stage Detail Drawer / Modal */}
      <Modal
        open={Boolean(selectedStage)}
        onClose={() => setSelectedStageId(null)}
        title={
          selectedStage
            ? `Stage ${selectedStage.stageNumber}: ${selectedStage.title}`
            : 'Stage Detail'
        }
        description={selectedStage?.description}
        maxWidthClass="max-w-2xl"
      >
        {selectedStage && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="accent">{selectedStage.weekMapping}</Badge>
                {selectedStage.recommendedChannels.map((ch) => (
                  <Badge key={ch} tone="neutral">
                    {ch}
                  </Badge>
                ))}
              </div>
              <Select
                value={selectedStage.status}
                onChange={(e) =>
                  void updateLearningStage(selectedStage.id, {
                    status: e.target.value as StageStatus,
                  })
                }
                aria-label="Stage completion status"
                className="w-40"
              >
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </Select>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--df-text-muted)] mb-1.5">
                Learning Objectives
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[var(--df-text)]">
                {selectedStage.objectives.map((obj) => (
                  <li key={obj}>{obj}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--df-text-muted)] mb-1.5">
                Concepts Checklist
              </h4>
              <div className="space-y-1.5">
                {selectedStage.concepts.map((concept) => (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => void toggleStageConcept(selectedStage, concept.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)] px-3 py-2 text-left text-xs cursor-pointer hover:border-[#635BDB]"
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        concept.completed
                          ? 'border-[#16A34A] bg-[#16A34A] text-white'
                          : 'border-[var(--df-text-muted)]/50'
                      )}
                    >
                      {concept.completed && <Check className="h-3 w-3" />}
                    </span>
                    <span
                      className={cn(
                        'text-[var(--df-text)]',
                        concept.completed && 'line-through text-[var(--df-text-muted)]'
                      )}
                    >
                      {concept.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)] p-3 text-xs">
              <p className="font-semibold text-[var(--df-text)]">Practical Assignment</p>
              <p className="mt-1 text-[var(--df-text-muted)]">{selectedStage.assignment}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedStage.externalResources.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--df-border)] px-3 py-1.5 text-xs text-[#8178F5] hover:border-[#635BDB]"
                >
                  {r.label} <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>

            <div>
              <FieldLabel htmlFor="stage-notes">Personal Stage Notes</FieldLabel>
              <DebouncedTextarea
                id="stage-notes"
                value={selectedStage.notes}
                onCommit={(next) =>
                  void updateLearningStage(selectedStage.id, { notes: next })
                }
                placeholder="Write summaries, key commands, or revision takeaways..."
              />
            </div>

            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedStageId(null)}>
                <X className="h-3.5 w-3.5" />
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Log / Edit DSA Problem Modal */}
      <Modal
        open={dsaModalOpen}
        onClose={() => setDsaModalOpen(false)}
        title={editingDsa ? 'Edit DSA Problem' : 'Log Java DSA Problem'}
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSubmit(onSubmitDsa)} className="space-y-3">
          <div>
            <FieldLabel htmlFor="dsa-name" error={errors.problemName?.message}>
              Problem Name
            </FieldLabel>
            <Input
              id="dsa-name"
              {...register('problemName')}
              placeholder="e.g., Course Schedule II"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <FieldLabel htmlFor="dsa-platform">Platform</FieldLabel>
              <Select id="dsa-platform" {...register('platform')}>
                <option value="LeetCode">LeetCode</option>
                <option value="NeetCode">NeetCode</option>
                <option value="Striver">Striver</option>
                <option value="GFG">GFG</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="dsa-diff">Difficulty</FieldLabel>
              <Select id="dsa-diff" {...register('difficulty')}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="dsa-status">Status</FieldLabel>
              <Select id="dsa-status" {...register('status')}>
                <option value="solved">Solved</option>
                <option value="attempted">Attempted</option>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="dsa-time">Minutes</FieldLabel>
              <Input id="dsa-time" type="number" min={0} {...register('timeTakenMinutes')} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="dsa-topic" error={errors.topic?.message}>
                Topic
              </FieldLabel>
              <Input id="dsa-topic" {...register('topic')} placeholder="Graphs / DP / Trees" />
            </div>
            <div>
              <FieldLabel htmlFor="dsa-attempt">Date Attempted</FieldLabel>
              <Input id="dsa-attempt" type="date" {...register('dateAttempted')} />
            </div>
            <div>
              <FieldLabel htmlFor="dsa-solved">Date Solved</FieldLabel>
              <Input id="dsa-solved" type="date" {...register('dateSolved')} />
            </div>
            <div>
              <FieldLabel htmlFor="dsa-revisit">Revisit Date</FieldLabel>
              <Input id="dsa-revisit" type="date" {...register('revisitDate')} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="dsa-tc">Time Complexity</FieldLabel>
              <Input id="dsa-tc" {...register('timeComplexity')} placeholder="O(V + E)" />
            </div>
            <div>
              <FieldLabel htmlFor="dsa-sc">Space Complexity</FieldLabel>
              <Input id="dsa-sc" {...register('spaceComplexity')} placeholder="O(V)" />
            </div>
            <div>
              <FieldLabel htmlFor="dsa-link">Solution Link</FieldLabel>
              <Input id="dsa-link" {...register('solutionLink')} placeholder="https://..." />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="dsa-mistakes">Mistakes / Edge Cases</FieldLabel>
            <Textarea id="dsa-mistakes" {...register('mistakes')} />
          </div>
          <div>
            <FieldLabel htmlFor="dsa-notes">Notes</FieldLabel>
            <Textarea id="dsa-notes" {...register('notes')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDsaModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingDsa ? 'Save Changes' : 'Log Problem'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteDsaTarget)}
        onClose={() => setDeleteDsaTarget(null)}
        onConfirm={() => {
          if (deleteDsaTarget) {
            void deleteDsaProblem(deleteDsaTarget.id);
            toast('DSA problem removed', { tone: 'info' });
          }
        }}
        title="Delete DSA Record"
        description={`Remove "${deleteDsaTarget?.problemName}" from your DSA log?`}
        confirmLabel="Delete"
      />
    </div>
  );
}
