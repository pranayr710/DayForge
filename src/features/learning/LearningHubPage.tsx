import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BookOpen,
  Bookmark,
  CalendarRange,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  Flame,
  GitBranch,
  GraduationCap,
  Layers,
  Map as MapIcon,
  Newspaper,
  NotebookPen,
  Play,
  Plus,
  Rss,
  Sparkles,
  Target,
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
  getChannelUrl,
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
import {
  AnimatedNumber,
  ProgressBar,
  ProgressRing,
  Reveal,
  SegmentedTabs,
} from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';
import type { DsaDifficulty, DsaPlatform, DsaProblem, LearningStage, StageStatus } from '@/types';

type HubTab = 'curriculum' | 'dsa' | 'awareness' | 'roadmap';

/* ---------- Presentation-only styling maps ---------- */

const STAGE_STATUS_STYLE: Record<
  StageStatus,
  { card: string; glow: string; number: string; ring: [string, string, string]; dot: string }
> = {
  completed: {
    card: 'border-[#22C55E]/30 hover:border-[#22C55E]/55',
    glow: 'bg-[radial-gradient(closest-side,rgba(34,197,94,0.28),transparent)]',
    number: 'text-[#22C55E]/[0.07]',
    ring: ['#22C55E', '#34D399', '#5EE7F7'],
    dot: 'bg-[var(--df-success)] shadow-[0_0_10px_rgba(34,197,94,0.8)]',
  },
  in_progress: {
    card: 'border-[#8F87FA]/40 hover:border-[#8F87FA]/70 shadow-[0_0_32px_-14px_rgba(109,100,240,0.9)]',
    glow: 'bg-[radial-gradient(closest-side,rgba(109,100,240,0.35),transparent)]',
    number: 'text-[#8F87FA]/[0.09]',
    ring: ['#8F87FA', '#A78BFA', '#5EE7F7'],
    dot: 'bg-[var(--df-accent-secondary)]',
  },
  not_started: {
    card: 'hover:border-[var(--df-border-strong)]',
    glow: 'bg-[radial-gradient(closest-side,rgba(143,135,250,0.10),transparent)]',
    number: 'text-[var(--df-text)]/[0.04]',
    ring: ['#64748B', '#8F87FA', '#A78BFA'],
    dot: 'bg-[var(--df-text-faint)]',
  },
};

const DIFFICULTY_STYLE: Record<DsaDifficulty, { bar: string; chip: string; text: string }> = {
  Easy: {
    bar: 'bg-[linear-gradient(180deg,#34D399,#22C55E)] shadow-[0_0_12px_rgba(34,197,94,0.6)]',
    chip: 'border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]',
    text: 'text-[#34D399]',
  },
  Medium: {
    bar: 'bg-[linear-gradient(180deg,#F0B455,#E5A03C)] shadow-[0_0_12px_rgba(229,160,60,0.6)]',
    chip: 'border-[#F0B455]/30 bg-[#F0B455]/10 text-[#F0B455]',
    text: 'text-[#F0B455]',
  },
  Hard: {
    bar: 'bg-[linear-gradient(180deg,#FB7185,#E05252)] shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    chip: 'border-[#FB7185]/30 bg-[#FB7185]/10 text-[#FB7185]',
    text: 'text-[#FB7185]',
  },
};

const ROUTINE_ICONS = {
  dailyDevDone: Rss,
  hackerNewsDone: Newspaper,
  youtubeDone: Play,
  githubTrendingDone: GitBranch,
  notesDone: NotebookPen,
} as const;

const PORTAL_ICONS: Record<string, typeof Rss> = {
  'daily-dev': Rss,
  'hacker-news': Newspaper,
  'github-trending': GitBranch,
  'roadmap-sh': MapIcon,
  'hf-learn': GraduationCap,
};

const ICON_CHIP =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#8F87FA]/30 bg-[#6D64F0]/12 text-[var(--df-accent-secondary)]';

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
    const weekAgo = addDaysToDateKey(istNow.dateKey, -7);
    const monthAgo = addDaysToDateKey(istNow.dateKey, -30);
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

  // Presentation-only derived values
  const reduced = useReducedMotion();
  const awarenessPct = Math.round((awarenessChecksDone / 5) * 100);
  const stagesCompleted = stages.filter((s) => s.status === 'completed').length;
  const stagesInProgress = stages.filter((s) => s.status === 'in_progress').length;
  const conceptsTotal = stages.reduce((sum, s) => sum + s.concepts.length, 0);
  const conceptsDone = stages.reduce(
    (sum, s) => sum + s.concepts.filter((c) => c.completed).length,
    0
  );
  const conceptsPct = conceptsTotal > 0 ? Math.round((conceptsDone / conceptsTotal) * 100) : 0;
  const totalSolvedByDiff =
    dsaStats.byDifficulty.Easy + dsaStats.byDifficulty.Medium + dsaStats.byDifficulty.Hard;

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
        <div className="space-y-4">
        {/* Curriculum overview (presentational summary) */}
        {stages.length > 0 && (
          <Reveal delay={0.05}>
            <Card elevated className="relative overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(109,100,240,0.3),transparent)] blur-2xl"
              />
              <CardContent className="relative grid grid-cols-1 gap-4 pt-5 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex items-center gap-4">
                  <ProgressRing value={conceptsPct} size={76} label="Overall curriculum concept progress">
                    <span className="font-mono-tabular text-sm font-semibold text-[var(--df-text)]">
                      {conceptsPct}%
                    </span>
                  </ProgressRing>
                  <div>
                    <p className="df-eyebrow">Curriculum progress</p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <AnimatedNumber
                        value={conceptsDone}
                        className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-text)]"
                      />
                      <span className="font-mono-tabular text-sm text-[var(--df-text-faint)]">
                        / {conceptsTotal} concepts
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:ml-auto sm:w-full sm:max-w-md">
                  {[
                    { label: 'Completed', value: stagesCompleted, tone: 'text-[var(--df-success)]', dot: 'bg-[var(--df-success)] shadow-[0_0_8px_rgba(34,197,94,0.8)]' },
                    { label: 'In progress', value: stagesInProgress, tone: 'text-[var(--df-accent-secondary)]', dot: 'bg-[var(--df-accent-secondary)] shadow-[0_0_8px_rgba(143,135,250,0.9)]' },
                    { label: 'Stages', value: stages.length, tone: 'text-[var(--df-text)]', dot: 'bg-[var(--df-text-faint)]' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-2xl df-well px-3 py-2.5">
                      <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--df-text-faint)]">
                        <span className={cn('h-1.5 w-1.5 rounded-full', kpi.dot)} />
                        <span className="truncate">{kpi.label}</span>
                      </p>
                      <AnimatedNumber
                        value={kpi.value}
                        className={cn('mt-1 block text-xl font-semibold tracking-[-0.03em]', kpi.tone)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage, idx) => {
            const doneCount = stage.concepts.filter((c) => c.completed).length;
            const pct =
              stage.concepts.length > 0
                ? Math.round((doneCount / stage.concepts.length) * 100)
                : 0;
            const style = STAGE_STATUS_STYLE[stage.status] ?? STAGE_STATUS_STYLE.not_started;

            return (
              <motion.div
                key={stage.id}
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: reduced ? 0 : Math.min(idx * 0.03, 0.4),
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="h-full"
              >
              <Card
                interactive
                className={cn(
                  'group relative h-full cursor-pointer overflow-hidden',
                  style.card
                )}
                onClick={() => setSelectedStageId(stage.id)}
              >
                {/* Decorative status glow + stage watermark */}
                <div
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100',
                    style.glow,
                    stage.status === 'in_progress' ? 'opacity-100 df-breathe' : 'opacity-70'
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -bottom-6 right-2 select-none font-mono-tabular text-[112px] font-bold leading-none tracking-[-0.06em]',
                    style.number
                  )}
                >
                  {String(stage.stageNumber).padStart(2, '0')}
                </span>

                <CardContent className="relative pt-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-mono-tabular text-[11px] font-semibold tracking-[0.14em] text-[var(--df-accent-secondary)]">
                      <span className="relative inline-flex h-1.5 w-1.5">
                        {stage.status === 'in_progress' && (
                          <span className="df-dot-live absolute inset-0 rounded-full text-[#8F87FA]" />
                        )}
                        <span className={cn('relative h-1.5 w-1.5 rounded-full', style.dot)} />
                      </span>
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
                      className="capitalize"
                    >
                      {stage.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[var(--df-text)]">
                        {stage.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--df-text-muted)] line-clamp-2">
                        {stage.description}
                      </p>
                    </div>
                    <ProgressRing
                      value={pct}
                      size={52}
                      stroke={4}
                      colors={style.ring}
                      label={`Stage ${stage.stageNumber} concept progress`}
                      className="shrink-0"
                    >
                      {stage.status === 'completed' ? (
                        <Check className="h-4 w-4 text-[var(--df-success)]" />
                      ) : (
                        <span className="font-mono-tabular text-[10.5px] font-semibold text-[var(--df-text)]">
                          {pct}%
                        </span>
                      )}
                    </ProgressRing>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {stage.recommendedChannels.map((ch) => {
                      const url = getChannelUrl(ch);
                      return url ? (
                        <a
                          key={ch}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--df-border)] bg-[var(--df-inset)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--df-text-muted)] transition-colors hover:border-[#8F87FA]/60 hover:text-[var(--df-accent-secondary)]"
                        >
                          <Tv className="h-2.5 w-2.5 opacity-70" />
                          <span>{ch}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                        </a>
                      ) : (
                        <Badge key={ch} tone="neutral" className="gap-1">
                          <Tv className="h-2.5 w-2.5 opacity-70" />
                          {ch}
                        </Badge>
                      );
                    })}
                  </div>

                  <div className="df-hairline" />

                  <div>
                    <div className="mb-1.5 flex justify-between text-[11px] font-mono-tabular text-[var(--df-text-muted)]">
                      <span>
                        <span className="text-[var(--df-text)]">{doneCount}</span>/{stage.concepts.length} concepts
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            );
          })}
        </div>
        </div>
      )}

      {/* DSA TRACKER (JAVA) */}
      {tab === 'dsa' && (
        <div className="space-y-4">
          {/* Daily Java DSA Structure & Real Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Reveal delay={0.05} className="h-full">
              <Card interactive className="h-full">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="df-eyebrow">Total Solved (Java)</p>
                    <span className={ICON_CHIP}>
                      <Code2 className="h-4 w-4" />
                    </span>
                  </div>
                  <AnimatedNumber
                    value={dsaStats.totalSolved}
                    className="mt-1 block text-[32px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-text)]"
                  />
                  {/* Difficulty split bar (presentational) */}
                  <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--df-inset)]">
                    {totalSolvedByDiff > 0 &&
                      (['Easy', 'Medium', 'Hard'] as const).map((d) => (
                        <div
                          key={d}
                          className={cn('h-full', DIFFICULTY_STYLE[d].bar)}
                          style={{ width: `${(dsaStats.byDifficulty[d] / totalSolvedByDiff) * 100}%` }}
                        />
                      ))}
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--df-text-muted)] font-mono-tabular">
                    <span className={DIFFICULTY_STYLE.Easy.text}>E {dsaStats.byDifficulty.Easy}</span>
                    {' · '}
                    <span className={DIFFICULTY_STYLE.Medium.text}>M {dsaStats.byDifficulty.Medium}</span>
                    {' · '}
                    <span className={DIFFICULTY_STYLE.Hard.text}>H {dsaStats.byDifficulty.Hard}</span>
                  </p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.1} className="h-full">
              <Card interactive className="h-full">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="df-eyebrow">Solved This Week / Month</p>
                    <span className={ICON_CHIP}>
                      <Flame className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <AnimatedNumber
                      value={dsaStats.solvedThisWeek}
                      className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-text)]"
                    />
                    <span className="font-mono-tabular text-sm text-[var(--df-text-faint)]">/</span>
                    <AnimatedNumber
                      value={dsaStats.solvedThisMonth}
                      className="text-xl font-semibold leading-none tracking-[-0.03em] text-[var(--df-text-muted)]"
                    />
                  </div>
                  <p className="mt-3 text-[11px] text-[var(--df-text-muted)]">7d / 30d window</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.15} className="h-full">
              <Card interactive className="h-full">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="df-eyebrow">Revision Backlog</p>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#F0B455]/30 bg-[#F0B455]/10 text-[var(--df-warning)]">
                      <Clock className="h-4 w-4" />
                    </span>
                  </div>
                  <AnimatedNumber
                    value={dsaStats.revisionBacklog}
                    className="mt-1 block text-[32px] font-semibold leading-none tracking-[-0.04em] text-[var(--df-warning)]"
                  />
                  <p className="mt-3 text-[11px] text-[var(--df-text-muted)]">Due for revisit</p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.2} className="h-full">
              <Card interactive className="h-full">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="df-eyebrow">Daily 60m Formula</p>
                    <span className={ICON_CHIP}>
                      <Target className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5 text-[11px] text-[var(--df-text)]">
                    {DSA_DAILY_STRUCTURE.map((step) => (
                      <div key={step.phase} className="space-y-1">
                        <div className="flex justify-between gap-2">
                          <span className="text-[var(--df-text-muted)]">{step.phase}</span>
                          <span className="font-mono-tabular text-[var(--df-accent-secondary)]">{step.minutes}m</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--df-inset)]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#635BDB,#A78BFA,#5EE7F7)]"
                            style={{ width: `${(step.minutes / 60) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>

          {/* External Resources */}
          <Reveal delay={0.1}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="df-eyebrow mr-1">Resources</span>
              {DSA_RESOURCES.map((res) => (
                <a
                  key={res.name}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--df-border)] bg-[var(--df-secondary)] px-3.5 py-1.5 text-xs font-medium text-[var(--df-text)] transition-all hover:border-[#8F87FA]/60 hover:shadow-[0_0_20px_-8px_rgba(109,100,240,0.9)]"
                >
                  <span>{res.name}</span>
                  <ExternalLink className="h-3 w-3 text-[var(--df-text-muted)] transition-colors group-hover:text-[var(--df-accent-secondary)]" />
                </a>
              ))}
            </div>
          </Reveal>

          {/* Topic Breakdown if any */}
          {dsaStats.topics.length > 0 && (
            <Reveal delay={0.12}>
              <Card>
                <CardHeader>
                  <CardTitle>Topic Progress</CardTitle>
                  <Layers className="h-4 w-4 text-[var(--df-accent-secondary)]" />
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {dsaStats.topics.map(([topic, count]) => (
                    <Badge key={topic} tone="accent" className="font-mono-tabular">
                      {topic}: {count}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </Reveal>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
            <Card>
            <CardContent className="space-y-2 pt-4">
              {filteredDsa.map((prob, idx) => (
                <motion.div
                  key={prob.id}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: reduced ? 0 : Math.min(idx * 0.03, 0.4),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative overflow-hidden rounded-2xl df-well py-3 pl-4 pr-3.5 transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-y-2 left-0 w-[3px] rounded-r-full',
                      (DIFFICULTY_STYLE[prob.difficulty] ?? DIFFICULTY_STYLE.Medium).bar
                    )}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {prob.status === 'solved' && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--df-success)] drop-shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
                        )}
                        <span className="text-sm font-semibold text-[var(--df-text)]">
                          {prob.problemName}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                            (DIFFICULTY_STYLE[prob.difficulty] ?? DIFFICULTY_STYLE.Medium).chip
                          )}
                        >
                          {prob.difficulty}
                        </span>
                        <Badge tone="accent">{prob.topic}</Badge>
                        <Badge tone={prob.status === 'solved' ? 'success' : 'neutral'}>
                          {prob.status}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-[11px] text-[var(--df-text-muted)] font-mono-tabular">
                        {prob.platform} · {prob.timeTakenMinutes}m · Attempted {formatShortDateLabel(prob.dateAttempted)}
                        {prob.timeComplexity ? ` · T: ${prob.timeComplexity}` : ''}
                        {prob.spaceComplexity ? ` · S: ${prob.spaceComplexity}` : ''}
                        {prob.revisitDate ? ` · Revisit: ${formatShortDateLabel(prob.revisitDate)}` : ''}
                      </p>
                      {(prob.mistakes || prob.notes) && (
                        <p className="mt-1 text-xs leading-relaxed text-[var(--df-text-muted)]">
                          {prob.mistakes ? `Mistakes: ${prob.mistakes}` : prob.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {prob.solutionLink && (
                        <a
                          href={prob.solutionLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-full border border-[var(--df-border)] px-3 text-xs text-[var(--df-text)] transition-colors hover:border-[#8F87FA]/60 hover:text-[var(--df-accent-secondary)]"
                        >
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => openEditDsaModal(prob)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDsaTarget(prob)}
                        aria-label={`Delete ${prob.problemName}`}
                        className="rounded-full text-[var(--df-error)] hover:bg-[#E05252]/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TECH AWARENESS (8–9 PM) */}
      {tab === 'awareness' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="space-y-4 lg:col-span-7">
            <Reveal delay={0.05}>
            <Card elevated>
              <CardHeader className="items-start">
                <div className="flex min-w-0 items-center gap-3.5">
                  <ProgressRing
                    value={awarenessPct}
                    size={60}
                    stroke={5}
                    colors={awarenessChecksDone === 5 ? ['#22C55E', '#34D399', '#5EE7F7'] : undefined}
                    label="Tech awareness routine progress"
                    className="shrink-0"
                  >
                    <Sparkles className="h-4 w-4 text-[var(--df-accent-secondary)]" />
                  </ProgressRing>
                  <div className="min-w-0">
                    <p className="df-eyebrow">Tonight&apos;s routine</p>
                    <CardTitle className="mt-0.5 text-[15px]">
                      Daily 8:00–9:00 PM Routine ({istNow.dayName})
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-[var(--df-text-muted)]">
                      5 independently trackable items · Today&apos;s YouTube: {todayYt.channel}
                    </p>
                  </div>
                </div>
                <Badge tone={awarenessChecksDone === 5 ? 'success' : 'accent'} className="shrink-0 font-mono-tabular">
                  {awarenessChecksDone}/5
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="relative space-y-2.5">
                {/* Connector line between step nodes */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-7 left-[31px] top-7 w-px bg-[linear-gradient(180deg,rgba(143,135,250,0.6),rgba(94,231,247,0.35),rgba(143,135,250,0.15))]"
                />
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
                    url: todayYt.channelUrl,
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
                ].map((item) => {
                  const StepIcon = ROUTINE_ICONS[item.key];
                  return (
                  <div
                    key={item.key}
                    className={cn(
                      'relative flex items-center justify-between gap-3 rounded-2xl df-well py-3 pl-3 pr-3.5 transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]',
                      item.done && 'border-[#22C55E]/25 bg-[#22C55E]/[0.04]'
                    )}
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
                          'relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border cursor-pointer transition-all duration-300',
                          item.done
                            ? 'border-[#22C55E] bg-[linear-gradient(145deg,#22C55E,#16A34A)] text-white shadow-[0_0_14px_rgba(34,197,94,0.7)]'
                            : 'border-[var(--df-border-strong)] bg-[var(--df-elevated)] text-[var(--df-text-muted)] hover:border-[#8F87FA]/60 hover:text-[var(--df-accent-secondary)]'
                        )}
                      >
                        {item.done ? <Check className="h-4 w-4" /> : <StepIcon className="h-3.5 w-3.5" />}
                      </button>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 font-mono-tabular text-[11px] text-[var(--df-text-faint)]">
                          <Clock className="h-2.5 w-2.5" />
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
                        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[var(--df-border)] px-3 text-xs text-[var(--df-text)] transition-colors hover:border-[#8F87FA]/60 hover:text-[var(--df-accent-secondary)]"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  );
                })}
                </div>

                <div className="pt-2">
                  <FieldLabel htmlFor="aware-notes">Today&apos;s Technology Notes</FieldLabel>
                  <Textarea
                    id="aware-notes"
                    value={todayAwareness?.notes ?? ''}
                    onChange={(e) =>
                      void upsertAwarenessLog(istNow.dateKey, { notes: e.target.value })
                    }
                    placeholder="Capture key engineering insights, tools, or papers read today..."
                  />
                </div>
              </CardContent>
            </Card>
            </Reveal>

            {/* Session History */}
            <Reveal delay={0.15}>
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
                <span className={ICON_CHIP}>
                  <Newspaper className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                {awarenessLogs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--df-border)] px-4 py-7 text-center">
                    <CalendarRange className="h-5 w-5 text-[var(--df-text-faint)]" />
                    <p className="text-xs text-[var(--df-text-muted)]">
                      Completed awareness sessions will appear here.
                    </p>
                  </div>
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
                            className="flex items-center justify-between gap-3 rounded-2xl df-well px-3.5 py-2.5 text-xs transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]"
                          >
                            <div className="min-w-0">
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
                            <div className="flex shrink-0 items-center gap-2">
                              {/* Mini 5-dot completion meter (presentational) */}
                              <div className="hidden items-center gap-1 sm:flex" aria-hidden>
                                {[0, 1, 2, 3, 4].map((i) => (
                                  <span
                                    key={i}
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full',
                                      i < count
                                        ? count === 5
                                          ? 'bg-[var(--df-success)] shadow-[0_0_6px_rgba(34,197,94,0.8)]'
                                          : 'bg-[var(--df-accent-secondary)]'
                                        : 'bg-[var(--df-border-strong)]'
                                    )}
                                  />
                                ))}
                              </div>
                              <Badge tone={count === 5 ? 'success' : 'neutral'} className="font-mono-tabular">
                                {count}/5
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
            </Reveal>
          </div>

          <div className="space-y-4 lg:col-span-5">
            {/* Featured: today's YouTube channel (decorative highlight of existing value) */}
            <Reveal delay={0.08}>
              <a
                href={todayYt.channelUrl}
                target="_blank"
                rel="noreferrer"
                className="group block relative overflow-hidden rounded-[22px] border border-[#8F87FA]/35 bg-[linear-gradient(140deg,rgba(109,100,240,0.22),rgba(167,139,250,0.08)_45%,rgba(94,231,247,0.10))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_-30px_rgba(109,100,240,0.9)] transition-all hover:border-[#8F87FA]/65"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-[radial-gradient(closest-side,rgba(94,231,247,0.28),transparent)] blur-2xl df-breathe"
                />
                <div className="relative flex items-center gap-4">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-[linear-gradient(135deg,#7B72F6,#5145C8)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_24px_-8px_rgba(109,100,240,0.9)]">
                    <Play className="h-6 w-6 translate-x-[1px] fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="df-eyebrow">Today&apos;s YouTube · {istNow.dayName}</p>
                    <p className="mt-1 truncate text-lg font-semibold tracking-[-0.02em] text-[var(--df-text)] group-hover:text-white">
                      {todayYt.channel}
                    </p>
                    <p className="text-xs text-[var(--df-text-muted)]">{todayYt.topic}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-[var(--df-text-muted)] group-hover:text-white" />
                </div>
                <div className="relative mt-4 flex items-center justify-between text-[11px] font-mono-tabular text-[var(--df-text-muted)]">
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    08:30–08:45 PM slot
                  </span>
                  <span className="text-[var(--df-accent-secondary)] font-sans font-medium">
                    Watch on YouTube →
                  </span>
                </div>
              </a>
            </Reveal>

            {/* YouTube Rotation */}
            <Reveal delay={0.12}>
            <Card>
              <CardHeader>
                <CardTitle>Weekly YouTube Rotation</CardTitle>
                <span className={ICON_CHIP}>
                  <Tv className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {YOUTUBE_ROTATION.map((row) => (
                  <a
                    key={row.dayName}
                    href={row.channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'group flex items-start justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-xs transition-all',
                      row.dayOfWeek === istNow.dayOfWeek
                        ? 'border-[#8F87FA]/60 bg-[#6D64F0]/10 shadow-[0_0_20px_-8px_rgba(109,100,240,0.9)]'
                        : 'df-well hover:border-[#8F87FA]/45 hover:bg-[var(--df-secondary)]'
                    )}
                  >
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[var(--df-text)]">
                        {row.dayOfWeek === istNow.dayOfWeek && (
                          <span className="relative inline-flex h-1.5 w-1.5">
                            <span className="df-dot-live absolute inset-0 rounded-full text-[#8F87FA]" />
                            <span className="relative h-1.5 w-1.5 rounded-full bg-[var(--df-accent-secondary)]" />
                          </span>
                        )}
                        {row.dayName}
                      </span>
                      <p className="text-[11px] text-[var(--df-text-muted)]">{row.topic}</p>
                    </div>
                    <Badge tone={row.dayOfWeek === istNow.dayOfWeek ? 'accent' : 'neutral'} className="shrink-0 gap-1">
                      {row.channel}
                      <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                    </Badge>
                  </a>
                ))}
              </CardContent>
            </Card>
            </Reveal>

            {/* Daily Reading Websites */}
            <Reveal delay={0.16}>
            <Card>
              <CardHeader>
                <CardTitle>Daily Reading Portals</CardTitle>
                <span className={ICON_CHIP}>
                  <BookOpen className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {DAILY_READING_WEBSITES.map((site) => {
                  const PortalIcon = PORTAL_ICONS[site.id] ?? ExternalLink;
                  return (
                  <a
                    key={site.id}
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-3 rounded-2xl df-well px-3 py-3 text-xs transition-all hover:-translate-y-0.5 hover:border-[#8F87FA]/50 hover:bg-[var(--df-secondary)] hover:shadow-[0_12px_28px_-16px_rgba(109,100,240,0.8)]"
                  >
                    <span className={cn(ICON_CHIP, 'transition-shadow group-hover:shadow-[0_0_16px_-4px_rgba(109,100,240,0.9)]')}>
                      <PortalIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 font-medium text-[var(--df-text)]">
                        <span className="truncate">{site.name}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 text-[var(--df-text-faint)] transition-colors group-hover:text-[var(--df-accent-secondary)]" />
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-[var(--df-text-muted)]">{site.role}</p>
                    </div>
                  </a>
                  );
                })}
              </CardContent>
            </Card>
            </Reveal>

            {/* Save for Later */}
            <Reveal delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>Save for Later</CardTitle>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#F0B455]/30 bg-[#F0B455]/10 text-[var(--df-warning)]">
                  <Bookmark className="h-4 w-4" />
                </span>
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
                  <Button type="submit" variant="secondary" size="sm" className="w-full rounded-full">
                    <Plus className="h-3.5 w-3.5" />
                    Save Link
                  </Button>
                </form>

                {savedResources.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="df-hairline mb-2" />
                    {savedResources.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between gap-2 rounded-2xl df-well px-3 py-2 text-xs transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => void toggleSavedTechResourceRead(item)}
                            className={cn(
                              'h-[18px] w-[18px] shrink-0 rounded-md border flex items-center justify-center cursor-pointer transition-all',
                              item.read
                                ? 'border-[#22C55E] bg-[#22C55E] text-white shadow-[0_0_12px_rgba(34,197,94,0.7)]'
                                : 'border-[var(--df-border-strong)] hover:border-[#8F87FA]/70'
                            )}
                            aria-label={`Mark ${item.title} read`}
                          >
                            {item.read && <Check className="h-3 w-3" />}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              'truncate text-[var(--df-text)] transition-colors hover:text-[var(--df-accent-secondary)]',
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
                          className="h-7 w-7 rounded-full text-[var(--df-error)] hover:bg-[#E05252]/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </Reveal>
          </div>
        </div>
      )}

      {/* FIRST 12 WEEKS ROADMAP */}
      {tab === 'roadmap' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className={ICON_CHIP}>
                <MapIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="df-eyebrow">Journey</p>
                <CardTitle className="text-[15px]">First 12 Weeks</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="relative grid grid-cols-1 gap-x-6 lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-6">
              {FIRST_12_WEEK_CURRICULUM.map((item, idx) => {
                const linkedStage = stages.find((s) => s.stageNumber === item.stageRef);
                const status = linkedStage?.status ?? 'not_started';
                return (
                  <motion.li
                    key={item.week}
                    initial={reduced ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: reduced ? 0 : Math.min(idx * 0.04, 0.4),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative flex gap-4 pb-4"
                  >
                    {/* Timeline rail + node */}
                    <div className="relative flex w-10 shrink-0 flex-col items-center" aria-hidden>
                      <span
                        className={cn(
                          'relative z-[1] flex h-10 w-10 items-center justify-center rounded-full border font-mono-tabular text-[11px] font-semibold',
                          status === 'completed'
                            ? 'border-[#22C55E]/70 bg-[linear-gradient(145deg,rgba(34,197,94,0.35),rgba(34,197,94,0.12))] text-[var(--df-success)] shadow-[0_0_16px_-2px_rgba(34,197,94,0.7)]'
                            : status === 'in_progress'
                              ? 'border-[#8F87FA]/70 bg-[linear-gradient(135deg,#7B72F6,#5145C8)] text-white shadow-[0_0_18px_-2px_rgba(109,100,240,0.9)]'
                              : 'border-[var(--df-border-strong)] bg-[var(--df-elevated)] text-[var(--df-text-muted)]'
                        )}
                      >
                        {status === 'completed' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          String(item.week).padStart(2, '0')
                        )}
                      </span>
                      <span className="absolute bottom-0 top-10 w-px bg-[linear-gradient(180deg,rgba(143,135,250,0.5),rgba(143,135,250,0.08))]" />
                    </div>

                    <div className="min-w-0 flex-1 rounded-2xl df-well px-3.5 py-3 transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono-tabular text-[11px] font-semibold tracking-[0.14em] text-[var(--df-accent-secondary)]">
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
                      <p className="mt-1 text-sm font-medium leading-snug text-[var(--df-text)]">{item.title}</p>
                      {linkedStage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-7 rounded-full px-2.5 -ml-2.5 text-[var(--df-accent-secondary)]"
                          onClick={() => {
                            setTab('curriculum');
                            setSelectedStageId(linkedStage.id);
                          }}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Open Stage {linkedStage.stageNumber}
                        </Button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
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
                {selectedStage.recommendedChannels.map((ch) => {
                  const url = getChannelUrl(ch);
                  return url ? (
                    <a
                      key={ch}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-[#8F87FA]/40 bg-[#635BDB]/12 px-2.5 py-0.5 text-[11px] font-medium text-[var(--df-accent-secondary)] transition-colors hover:bg-[#635BDB]/25 hover:text-white"
                    >
                      <Tv className="h-2.5 w-2.5" />
                      <span>{ch}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : (
                    <Badge key={ch} tone="neutral" className="gap-1">
                      <Tv className="h-2.5 w-2.5 opacity-70" />
                      {ch}
                    </Badge>
                  );
                })}
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

            {/* Concept progress summary (presentational) */}
            {(() => {
              const done = selectedStage.concepts.filter((c) => c.completed).length;
              const total = selectedStage.concepts.length;
              const pctDone = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div className="flex items-center gap-4 rounded-2xl df-well px-4 py-3">
                  <ProgressRing
                    value={pctDone}
                    size={56}
                    stroke={5}
                    colors={(STAGE_STATUS_STYLE[selectedStage.status] ?? STAGE_STATUS_STYLE.not_started).ring}
                    label="Stage concept completion"
                  >
                    <span className="font-mono-tabular text-[11px] font-semibold text-[var(--df-text)]">
                      {pctDone}%
                    </span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <p className="df-eyebrow">Concepts mastered</p>
                    <p className="mt-0.5 font-mono-tabular text-xl font-semibold tracking-[-0.03em] text-[var(--df-text)]">
                      {done}
                      <span className="text-sm text-[var(--df-text-faint)]"> / {total}</span>
                    </p>
                    <ProgressBar value={pctDone} className="mt-1.5" />
                  </div>
                </div>
              );
            })()}

            <div>
              <h4 className="df-eyebrow mb-2 flex items-center gap-1.5">
                <Target className="h-3 w-3" />
                Learning Objectives
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--df-text)]">
                {selectedStage.objectives.map((obj) => (
                  <li key={obj} className="flex items-start gap-2 leading-relaxed">
                    <span
                      aria-hidden
                      className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[linear-gradient(135deg,#A78BFA,#5EE7F7)] shadow-[0_0_6px_rgba(143,135,250,0.8)]"
                    />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="df-eyebrow mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Concepts Checklist
              </h4>
              <div className="space-y-1.5">
                {selectedStage.concepts.map((concept) => (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => void toggleStageConcept(selectedStage, concept.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl df-well px-3.5 py-2.5 text-left text-xs cursor-pointer transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]',
                      concept.completed && 'border-[#22C55E]/25 bg-[#22C55E]/[0.04]'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all duration-300',
                        concept.completed
                          ? 'border-[#22C55E] bg-[#22C55E] text-white shadow-[0_0_12px_rgba(34,197,94,0.7)]'
                          : 'border-[var(--df-border-strong)]'
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

            <div className="relative overflow-hidden rounded-2xl border border-[#8F87FA]/30 bg-[linear-gradient(135deg,rgba(109,100,240,0.14),rgba(94,231,247,0.05))] p-4 text-xs">
              <div className="flex items-center gap-2.5">
                <span className={ICON_CHIP}>
                  <Code2 className="h-4 w-4" />
                </span>
                <p className="font-semibold text-[var(--df-text)]">Practical Assignment</p>
              </div>
              <p className="mt-2 leading-relaxed text-[var(--df-text-muted)]">{selectedStage.assignment}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedStage.externalResources.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1.5 rounded-full border border-[#8F87FA]/30 bg-[#6D64F0]/10 px-3.5 py-1.5 text-xs font-medium text-[var(--df-accent-secondary)] transition-all hover:border-[#8F87FA]/60 hover:shadow-[0_0_20px_-8px_rgba(109,100,240,0.9)]"
                >
                  {r.label} <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>

            <div>
              <FieldLabel htmlFor="stage-notes">Personal Stage Notes</FieldLabel>
              <Textarea
                id="stage-notes"
                value={selectedStage.notes}
                onChange={(e) =>
                  void updateLearningStage(selectedStage.id, { notes: e.target.value })
                }
                placeholder="Write summaries, key commands, or revision takeaways..."
              />
            </div>

            <div className="flex justify-end">
              <Button variant="primary" size="sm" className="rounded-full" onClick={() => setSelectedStageId(null)}>
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
