import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CalendarClock,
  CalendarDays,
  Check,
  CheckSquare,
  CircleCheckBig,
  Flame,
  Pencil,
  Plus,
  Repeat,
  Search,
  Sparkles,
  Timer,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID } from '@/config/personalPlan';
import { useIstClock } from '@/hooks/useIstClock';
import { useFocusTimer } from '@/app/providers/FocusProvider';
import { useToast } from '@/app/providers/ToastProvider';
import {
  createHabit,
  createTask,
  deleteHabit,
  deleteTask,
  toggleHabitForDate,
  toggleTaskCompleted,
  updateTask,
} from '@/services/storage/repositories';
import {
  addDaysToDateKey,
  formatShortDateLabel,
  getShortDayLabel,
} from '@/lib/dateUtils';
import { taskFormSchema, type TaskFormValues } from '@/lib/validations';
import { ConfirmDialog, EmptyState, PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { AnimatedNumber, Reveal, SegmentedTabs } from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';
import type { TaskCategory, TaskItem, TaskPriority } from '@/types';

const TASK_CATEGORIES: TaskCategory[] = [
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

/** Presentation-only colour dot per category. */
const CATEGORY_DOT: Record<TaskCategory, string> = {
  College: 'bg-[#8F87FA] shadow-[0_0_8px_rgba(143,135,250,0.8)]',
  DSA: 'bg-[#6D64F0] shadow-[0_0_8px_rgba(109,100,240,0.8)]',
  'Software Engineering': 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]',
  'Technology Awareness': 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.7)]',
  'Placement Preparation': 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
  Projects: 'bg-cyan-300 shadow-[0_0_8px_rgba(94,231,247,0.7)]',
  Internship: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]',
  "Master's": 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.7)]',
  Personal: 'bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.6)]',
};

const ACTIVE_PILL =
  'border-transparent bg-[linear-gradient(135deg,#7B72F6,#5145C8)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(109,100,240,0.85)]';

type GroupTone = 'overdue' | 'today' | 'upcoming' | 'completed';

const GROUP_STYLE: Record<
  GroupTone,
  { icon: LucideIcon; chip: string; count: string; eyebrow: string }
> = {
  overdue: {
    icon: TriangleAlert,
    chip: 'border-[#F0B455]/40 bg-[#F0B455]/12 text-[var(--df-warning)] shadow-[0_0_18px_-6px_rgba(240,180,85,0.8)]',
    count: 'border-[#F0B455]/40 bg-[#F0B455]/12 text-[var(--df-warning)] shadow-[0_0_14px_-4px_rgba(240,180,85,0.7)]',
    eyebrow: 'Attention',
  },
  today: {
    icon: CalendarClock,
    chip: 'border-[#8F87FA]/30 bg-[#6D64F0]/12 text-[var(--df-accent-secondary)]',
    count: 'border-[#8F87FA]/35 bg-[#6D64F0]/12 text-[var(--df-accent-secondary)]',
    eyebrow: 'Focus',
  },
  upcoming: {
    icon: CalendarDays,
    chip: 'border-[#5EE7F7]/30 bg-[#5EE7F7]/10 text-[var(--df-cyan)]',
    count: 'border-[#5EE7F7]/30 bg-[#5EE7F7]/10 text-[var(--df-cyan)]',
    eyebrow: 'Ahead',
  },
  completed: {
    icon: CircleCheckBig,
    chip: 'border-[var(--df-border-strong)] bg-[var(--df-inset)] text-[var(--df-text-muted)]',
    count: 'border-[var(--df-border-strong)] bg-[var(--df-inset)] text-[var(--df-text-muted)]',
    eyebrow: 'Done',
  },
};

function GroupHeading({
  tone,
  title,
  count,
  subtitle,
}: {
  tone: GroupTone;
  title: React.ReactNode;
  count: number;
  subtitle?: React.ReactNode;
}) {
  const style = GROUP_STYLE[tone];
  const Icon = style.icon;
  return (
    <CardHeader className="items-start">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border',
            style.chip
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="df-eyebrow">{style.eyebrow}</p>
          <CardTitle
            className={cn(
              'mt-0.5',
              tone === 'overdue' && 'text-[var(--df-warning)]',
              tone === 'completed' && 'text-[var(--df-text-muted)]'
            )}
          >
            {title}
          </CardTitle>
          {subtitle}
        </div>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full border px-2.5 py-1 font-mono-tabular text-[11px] font-semibold leading-none',
          style.count
        )}
      >
        {count}
      </span>
    </CardHeader>
  );
}

export default function TasksPage() {
  const reduced = useReducedMotion();
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const rawTasks = useLiveQuery(() => db.tasks.toArray(), []);
  const rawHabits = useLiveQuery(() => db.habits.toArray(), []);
  const rawHabitLogs = useLiveQuery(() => db.habitLogs.toArray(), []);
  const tasks = useMemo(() => rawTasks ?? [], [rawTasks]);
  const habits = useMemo(() => rawHabits ?? [], [rawHabits]);
  const habitLogs = useMemo(() => rawHabitLogs ?? [], [rawHabitLogs]);

  const istNow = useIstClock(profile?.timezone ?? 'Asia/Kolkata');
  const { openFocus } = useFocusTimer();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'tasks' | 'habits'>('tasks');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<TaskCategory | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);

  const [habitTitle, setHabitTitle] = useState('');
  const [habitCategory, setHabitCategory] = useState<TaskCategory>('DSA');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      category: 'DSA',
      priority: 'medium',
      recurrence: 'none',
    },
  });

  function openNewTaskModal() {
    setEditingTask(null);
    reset({
      title: '',
      category: 'DSA',
      priority: 'medium',
      dueDate: istNow.dateKey,
      dueTime: '',
      recurrence: 'none',
      notes: '',
    });
    setTaskModalOpen(true);
  }

  function openEditTaskModal(task: TaskItem) {
    setEditingTask(task);
    reset({
      title: task.title,
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate ?? '',
      dueTime: task.dueTime ?? '',
      recurrence: task.recurrence,
      notes: task.notes ?? '',
    });
    setTaskModalOpen(true);
  }

  async function onSubmitTask(values: TaskFormValues) {
    if (editingTask) {
      await updateTask(editingTask.id, {
        title: values.title,
        category: values.category,
        priority: values.priority,
        dueDate: values.dueDate || undefined,
        dueTime: values.dueTime || undefined,
        recurrence: values.recurrence,
        notes: values.notes || undefined,
      });
      toast('Task updated', { tone: 'success' });
    } else {
      await createTask({
        title: values.title,
        category: values.category,
        priority: values.priority,
        dueDate: values.dueDate || undefined,
        dueTime: values.dueTime || undefined,
        recurrence: values.recurrence,
        notes: values.notes || undefined,
      });
      toast('Task created', { tone: 'success' });
    }
    setTaskModalOpen(false);
  }

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (catFilter !== 'All' && t.category !== catFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (q && !t.title.toLowerCase().includes(q) && !(t.notes ?? '').toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [tasks, catFilter, priorityFilter, search]);

  const grouped = useMemo(() => {
    const overdue: TaskItem[] = [];
    const today: TaskItem[] = [];
    const upcoming: TaskItem[] = [];
    const completed: TaskItem[] = [];

    for (const t of filteredTasks) {
      if (t.completed) {
        completed.push(t);
      } else if (t.dueDate && t.dueDate < istNow.dateKey) {
        overdue.push(t);
      } else if (!t.dueDate || t.dueDate === istNow.dateKey) {
        today.push(t);
      } else {
        upcoming.push(t);
      }
    }

    return { overdue, today, upcoming, completed };
  }, [filteredTasks, istNow.dateKey]);

  const last7Days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysToDateKey(istNow.dateKey, i - 6)),
    [istNow.dateKey]
  );

  function computeHabitStreak(habitId: string): number {
    const logged = new Set(
      habitLogs.filter((l) => l.habitId === habitId && l.completed).map((l) => l.dateKey)
    );
    let streak = 0;
    let cursor = logged.has(istNow.dateKey)
      ? istNow.dateKey
      : addDaysToDateKey(istNow.dateKey, -1);
    while (logged.has(cursor)) {
      streak += 1;
      cursor = addDaysToDateKey(cursor, -1);
    }
    return streak;
  }

  async function handleCreateHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    await createHabit({
      title: habitTitle.trim(),
      category: habitCategory,
      targetDaysPerWeek: 7,
    });
    setHabitTitle('');
    toast('Habit added', { tone: 'success' });
  }

  const renderTaskRow = (task: TaskItem, idx: number) => (
    <motion.div
      key={task.id}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: reduced ? 0 : Math.min(idx * 0.03, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'group flex flex-col gap-2 rounded-2xl df-well px-3.5 py-3 transition-all duration-300 hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)] sm:flex-row sm:items-center sm:justify-between',
        task.completed && 'opacity-75 hover:opacity-100'
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 h-9 w-1 shrink-0 self-stretch rounded-full',
            task.completed
              ? 'bg-[linear-gradient(180deg,#22C55E,#5EE7F7)] opacity-60'
              : task.priority === 'high'
                ? 'bg-[linear-gradient(180deg,#F06A6A,#F59AC8)] shadow-[0_0_10px_rgba(240,106,106,0.6)]'
                : task.priority === 'medium'
                  ? 'bg-[linear-gradient(180deg,#F0B455,#F59AC8)] shadow-[0_0_8px_rgba(240,180,85,0.4)]'
                  : 'bg-[var(--df-border-strong)]'
          )}
        />
        <button
          type="button"
          onClick={() => void toggleTaskCompleted(task)}
          aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'completed'}`}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-300 cursor-pointer',
            task.completed
              ? 'border-[#22C55E] bg-[linear-gradient(135deg,#22C55E,#16A34A)] text-white shadow-[0_0_12px_rgba(34,197,94,0.7)]'
              : 'border-[var(--df-border-strong)] hover:border-[#8F87FA] hover:shadow-[0_0_10px_rgba(143,135,250,0.6)]'
          )}
        >
          {task.completed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>

        <div className="min-w-0">
          <p
            className={cn(
              'text-sm font-medium leading-snug text-[var(--df-text)] break-words',
              task.completed && 'line-through text-[var(--df-text-muted)]'
            )}
          >
            {task.title}
          </p>
          {task.notes && (
            <p className="mt-0.5 text-xs text-[var(--df-text-muted)] line-clamp-1">
              {task.notes}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
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
            <Badge tone="accent">
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 rounded-full', CATEGORY_DOT[task.category])}
              />
              {task.category}
            </Badge>
            {task.recurrence !== 'none' && (
              <Badge tone="neutral">
                <Repeat className="h-2.5 w-2.5" />
                {task.recurrence}
              </Badge>
            )}
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 font-mono-tabular text-[var(--df-text-muted)]">
                <CalendarDays className="h-3 w-3 opacity-70" aria-hidden="true" />
                {formatShortDateLabel(task.dueDate)}
                {task.dueTime ? ` · ${task.dueTime}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 pl-[52px] sm:pl-0 sm:opacity-70 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        {!task.completed && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() =>
              openFocus({
                taskId: task.id,
                taskTitle: task.title,
                objective: task.category,
              })
            }
          >
            <Timer className="h-3.5 w-3.5" />
            Focus
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => openEditTaskModal(task)}
          aria-label={`Edit ${task.title}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteTarget(task)}
          aria-label={`Delete ${task.title}`}
          className="rounded-full text-[var(--df-error)] hover:bg-[#F06A6A]/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tasks & Habits"
        subtitle="Actionable tasks separate from recurring timetable templates, plus calm habit tracking"
        actions={
          <Button variant="primary" size="sm" className="rounded-full" onClick={openNewTaskModal}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        }
      />

      <Reveal delay={0.02}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedTabs
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'tasks', label: 'Tasks', count: tasks.filter((t) => !t.completed).length },
              { value: 'habits', label: 'Daily Habits', count: habits.length },
            ]}
          />
        </div>
      </Reveal>

      {activeTab === 'tasks' ? (
        <div className="space-y-4">
          {/* Search & Filters */}
          <Reveal delay={0.05}>
            <Card elevated>
              <CardContent className="pt-4 space-y-3 sm:pt-5">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--df-accent-secondary)]" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tasks or notes..."
                      className="pl-10 rounded-full"
                      aria-label="Search tasks"
                    />
                  </div>
                  <Select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                    aria-label="Filter by priority"
                    className="sm:w-40 rounded-full"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select>
                </div>

                <div className="df-hairline" />

                <div className="flex flex-wrap gap-1.5">
                  {(['All', ...TASK_CATEGORIES] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatFilter(cat)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 cursor-pointer',
                        catFilter === cat
                          ? ACTIVE_PILL
                          : 'border-[var(--df-border)] bg-[var(--df-inset)] text-[var(--df-text-muted)] hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)] hover:text-[var(--df-text)]'
                      )}
                    >
                      {cat !== 'All' && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            catFilter === cat ? 'bg-white shadow-[0_0_6px_white]' : CATEGORY_DOT[cat]
                          )}
                        />
                      )}
                      {cat}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>

          {filteredTasks.length === 0 ? (
            <Reveal delay={0.1}>
              <EmptyState
                icon={CheckSquare}
                title="No matching tasks"
                description="Create your first task for College, DSA, Projects, Internships, or Master's prep."
                actionLabel="Create Task"
                onAction={openNewTaskModal}
              />
            </Reveal>
          ) : (
            <div className="space-y-4">
              {grouped.overdue.length > 0 && (
                <Reveal delay={0.08}>
                  <Card className="relative shadow-[0_0_40px_-20px_rgba(240,180,85,0.55)]">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(240,180,85,0.7),transparent)]"
                    />
                    <GroupHeading
                      tone="overdue"
                      title="Needs Rescheduling"
                      count={grouped.overdue.length}
                      subtitle={
                        <span className="mt-0.5 block text-[11px] text-[var(--df-text-muted)]">
                          Open tasks from earlier dates — edit due date or complete when ready
                        </span>
                      }
                    />
                    <CardContent className="space-y-2">
                      {grouped.overdue.map(renderTaskRow)}
                    </CardContent>
                  </Card>
                </Reveal>
              )}

              <Reveal delay={0.1}>
                <Card>
                  <GroupHeading tone="today" title="Today" count={grouped.today.length} />
                  <CardContent className="space-y-2">
                    {grouped.today.length === 0 ? (
                      <div className="flex items-center gap-2.5 rounded-2xl border border-dashed border-[var(--df-border-strong)] bg-[var(--df-inset)] px-3.5 py-3">
                        <Sparkles className="h-4 w-4 shrink-0 text-[var(--df-accent-secondary)]" aria-hidden="true" />
                        <p className="text-xs text-[var(--df-text-muted)]">
                          No tasks scheduled for today.
                        </p>
                      </div>
                    ) : (
                      grouped.today.map(renderTaskRow)
                    )}
                  </CardContent>
                </Card>
              </Reveal>

              {grouped.upcoming.length > 0 && (
                <Reveal delay={0.12}>
                  <Card>
                    <GroupHeading tone="upcoming" title="Upcoming" count={grouped.upcoming.length} />
                    <CardContent className="space-y-2">
                      {grouped.upcoming.map(renderTaskRow)}
                    </CardContent>
                  </Card>
                </Reveal>
              )}

              {grouped.completed.length > 0 && (
                <Reveal delay={0.14}>
                  <Card>
                    <GroupHeading
                      tone="completed"
                      title="Completed"
                      count={grouped.completed.length}
                    />
                    <CardContent className="space-y-2">
                      {grouped.completed.map(renderTaskRow)}
                    </CardContent>
                  </Card>
                </Reveal>
              )}
            </div>
          )}
        </div>
      ) : (
        /* HABITS TAB */
        <div className="space-y-4">
          <Reveal delay={0.05}>
            <Card elevated>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#8F87FA]/30 bg-[#6D64F0]/12 text-[var(--df-accent-secondary)]"
                  >
                    <Flame className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="df-eyebrow">Build consistency</p>
                    <CardTitle className="mt-0.5">Add Daily Habit</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleCreateHabit}
                  className="flex flex-col gap-2 rounded-2xl border border-dashed border-[var(--df-border-strong)] bg-[var(--df-inset)] p-2 sm:flex-row"
                >
                  <Input
                    value={habitTitle}
                    onChange={(e) => setHabitTitle(e.target.value)}
                    placeholder="e.g., Daily Java DSA (1h), Tech Awareness 8–9 PM, Git Commit"
                    className="flex-1"
                    aria-label="Habit title"
                  />
                  <Select
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value as TaskCategory)}
                    className="sm:w-48"
                    aria-label="Habit category"
                  >
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" variant="primary" className="rounded-full">
                    <Plus className="h-4 w-4" />
                    Add Habit
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Reveal>

          {habits.length === 0 ? (
            <Reveal delay={0.1}>
              <EmptyState
                icon={Flame}
                title="No habits tracked yet"
                description="Add recurring daily habits above. Missed days stay neutral—consistency builds naturally over time."
              />
            </Reveal>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {habits.map((habit, habitIdx) => {
                const streak = computeHabitStreak(habit.id);
                return (
                  <Reveal key={habit.id} delay={Math.min(0.08 + habitIdx * 0.04, 0.3)}>
                    <Card interactive className="h-full">
                      <CardContent className="pt-4 space-y-4 sm:pt-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold tracking-[-0.01em] text-[var(--df-text)] break-words">
                              {habit.title}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--df-text-muted)]">
                              <Badge tone="accent">
                                <span
                                  aria-hidden="true"
                                  className={cn('h-1.5 w-1.5 rounded-full', CATEGORY_DOT[habit.category])}
                                />
                                {habit.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-start gap-1">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1">
                                <Flame
                                  aria-hidden="true"
                                  className={cn(
                                    'h-5 w-5',
                                    streak > 0
                                      ? 'text-[#F0B455] drop-shadow-[0_0_8px_rgba(240,180,85,0.8)]'
                                      : 'text-[var(--df-text-faint)]'
                                  )}
                                />
                                <AnimatedNumber
                                  value={streak}
                                  format={(n) => `${Math.round(n)}d`}
                                  className={cn(
                                    'text-[28px] font-semibold leading-none tracking-[-0.04em]',
                                    streak > 0 ? 'df-text-gradient' : 'text-[var(--df-text-muted)]'
                                  )}
                                />
                              </div>
                              <span className="df-eyebrow mt-1">current streak</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void deleteHabit(habit.id)}
                              aria-label={`Delete habit ${habit.title}`}
                              className="rounded-full text-[var(--df-text-muted)] hover:text-[var(--df-error)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="df-hairline" />

                        <div className="grid grid-cols-7 gap-1.5">
                          {last7Days.map((dk) => {
                            const done = habitLogs.some(
                              (l) => l.habitId === habit.id && l.dateKey === dk && l.completed
                            );
                            const isToday = dk === istNow.dateKey;
                            return (
                              <button
                                key={dk}
                                type="button"
                                onClick={() => void toggleHabitForDate(habit.id, dk)}
                                className={cn(
                                  'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border py-2 text-[10px] font-medium transition-all duration-300 cursor-pointer',
                                  done
                                    ? 'border-[#22C55E]/60 bg-[linear-gradient(180deg,rgba(34,197,94,0.28),rgba(34,197,94,0.10))] text-[var(--df-success)] shadow-[0_0_14px_-3px_rgba(34,197,94,0.65)]'
                                    : 'border-[var(--df-border)] bg-[var(--df-inset)] text-[var(--df-text-muted)] hover:border-[#8F87FA]/60 hover:bg-[var(--df-secondary)]',
                                  isToday &&
                                    'ring-2 ring-[#8F87FA]/70 ring-offset-1 ring-offset-transparent'
                                )}
                              >
                                <span className={cn(isToday && 'text-[var(--df-text)]')}>
                                  {getShortDayLabel(dk)}
                                </span>
                                <span
                                  className={cn(
                                    'flex h-4 w-4 items-center justify-center rounded-full font-mono-tabular',
                                    done && 'bg-[#22C55E] text-white shadow-[0_0_10px_rgba(34,197,94,0.8)]'
                                  )}
                                >
                                  {done ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : '·'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Task Modal */}
      <Modal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <form onSubmit={handleSubmit(onSubmitTask)} className="space-y-3">
          <div>
            <FieldLabel htmlFor="task-title" error={errors.title?.message}>
              Task Title
            </FieldLabel>
            <Input
              id="task-title"
              {...register('title')}
              placeholder="e.g., Solve 2 Graph BFS/DFS problems in Java"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="task-category">Category</FieldLabel>
              <Select id="task-category" {...register('category')}>
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
              <Select id="task-priority" {...register('priority')}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <FieldLabel htmlFor="task-due-date">Due Date</FieldLabel>
              <Input id="task-due-date" type="date" {...register('dueDate')} />
            </div>
            <div>
              <FieldLabel htmlFor="task-due-time">Due Time</FieldLabel>
              <Input id="task-due-time" type="time" {...register('dueTime')} />
            </div>
            <div>
              <FieldLabel htmlFor="task-recurrence">Recurrence</FieldLabel>
              <Select id="task-recurrence" {...register('recurrence')}>
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </Select>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="task-notes">Notes</FieldLabel>
            <Textarea id="task-notes" {...register('notes')} placeholder="Links, criteria, or reminders..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTask ? 'Save Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteTask(deleteTarget.id);
            toast('Task deleted', { tone: 'info' });
          }
        }}
        title="Delete Task"
        description={`Remove "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
