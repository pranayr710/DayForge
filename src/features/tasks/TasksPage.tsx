import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  CheckSquare,
  Flame,
  Pencil,
  Plus,
  Repeat,
  Search,
  Timer,
  Trash2,
} from 'lucide-react';
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
import { SegmentedTabs } from '@/components/ui/Primitives';
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

export default function TasksPage() {
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

  const renderTaskRow = (task: TaskItem) => (
    <div
      key={task.id}
      className="flex flex-col gap-2 rounded-xl border border-[var(--df-border)] bg-[var(--df-bg)]/70 p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={() => void toggleTaskCompleted(task)}
          aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'completed'}`}
          className={cn(
            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer',
            task.completed
              ? 'border-[#16A34A] bg-[#16A34A] text-white'
              : 'border-[var(--df-text-muted)]/50 hover:border-[#8178F5]'
          )}
        >
          {task.completed && <Check className="h-3 w-3" />}
        </button>

        <div className="min-w-0">
          <p
            className={cn(
              'text-sm font-medium text-[var(--df-text)]',
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
            <Badge tone="accent">{task.category}</Badge>
            {task.recurrence !== 'none' && (
              <Badge tone="neutral">
                <Repeat className="h-2.5 w-2.5" />
                {task.recurrence}
              </Badge>
            )}
            {task.dueDate && (
              <span className="font-mono-tabular text-[var(--df-text-muted)]">
                {formatShortDateLabel(task.dueDate)}
                {task.dueTime ? ` · ${task.dueTime}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 pl-7 sm:pl-0">
        {!task.completed && (
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
          >
            <Timer className="h-3.5 w-3.5" />
            Focus
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
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
          className="text-[#E05252]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tasks & Habits"
        subtitle="Actionable tasks separate from recurring timetable templates, plus calm habit tracking"
        actions={
          <Button variant="primary" size="sm" onClick={openNewTaskModal}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        }
      />

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

      {activeTab === 'tasks' ? (
        <div className="space-y-4">
          {/* Search & Filters */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--df-text-muted)]" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tasks or notes..."
                    className="pl-9"
                    aria-label="Search tasks"
                  />
                </div>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                  aria-label="Filter by priority"
                  className="sm:w-36"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(['All', ...TASK_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatFilter(cat)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                      catFilter === cat
                        ? 'border-[#635BDB] bg-[#635BDB]/15 text-[#8178F5]'
                        : 'border-[var(--df-border)] text-[var(--df-text-muted)] hover:text-[var(--df-text)]'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No matching tasks"
              description="Create your first task for College, DSA, Projects, Internships, or Master's prep."
              actionLabel="Create Task"
              onAction={openNewTaskModal}
            />
          ) : (
            <div className="space-y-4">
              {grouped.overdue.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#E5A03C]">
                      Needs Rescheduling ({grouped.overdue.length})
                    </CardTitle>
                    <span className="text-[11px] text-[var(--df-text-muted)]">
                      Open tasks from earlier dates — edit due date or complete when ready
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {grouped.overdue.map(renderTaskRow)}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Today ({grouped.today.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {grouped.today.length === 0 ? (
                    <p className="text-xs text-[var(--df-text-muted)]">
                      No tasks scheduled for today.
                    </p>
                  ) : (
                    grouped.today.map(renderTaskRow)
                  )}
                </CardContent>
              </Card>

              {grouped.upcoming.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming ({grouped.upcoming.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {grouped.upcoming.map(renderTaskRow)}
                  </CardContent>
                </Card>
              )}

              {grouped.completed.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[var(--df-text-muted)]">
                      Completed ({grouped.completed.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {grouped.completed.map(renderTaskRow)}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      ) : (
        /* HABITS TAB */
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Daily Habit</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateHabit} className="flex flex-col gap-2 sm:flex-row">
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
                <Button type="submit" variant="primary">
                  Add Habit
                </Button>
              </form>
            </CardContent>
          </Card>

          {habits.length === 0 ? (
            <EmptyState
              icon={Flame}
              title="No habits tracked yet"
              description="Add recurring daily habits above. Missed days stay neutral—consistency builds naturally over time."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {habits.map((habit) => {
                const streak = computeHabitStreak(habit.id);
                return (
                  <Card key={habit.id}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--df-text)]">
                            {habit.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--df-text-muted)]">
                            <Badge tone="accent">{habit.category}</Badge>
                            <span className="font-mono-tabular">
                              {streak}d current streak
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void deleteHabit(habit.id)}
                          aria-label={`Delete habit ${habit.title}`}
                          className="text-[var(--df-text-muted)] hover:text-[#E05252]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-1.5">
                        {last7Days.map((dk) => {
                          const done = habitLogs.some(
                            (l) => l.habitId === habit.id && l.dateKey === dk && l.completed
                          );
                          return (
                            <button
                              key={dk}
                              type="button"
                              onClick={() => void toggleHabitForDate(habit.id, dk)}
                              className={cn(
                                'flex flex-col items-center justify-center rounded-lg border py-1.5 text-[10px] transition-colors cursor-pointer',
                                done
                                  ? 'border-[#16A34A] bg-[#16A34A]/20 text-[#22C55E]'
                                  : 'border-[var(--df-border)] bg-[var(--df-bg)] text-[var(--df-text-muted)] hover:border-[#8178F5]'
                              )}
                            >
                              <span>{getShortDayLabel(dk)}</span>
                              <span className="mt-0.5 font-mono-tabular">
                                {done ? '✓' : '·'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
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
