import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
} from 'lucide-react';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID } from '@/config/personalPlan';
import { COLLEGE_CLASS_SLOTS } from '@/config/timetable';
import { useIstClock } from '@/hooks/useIstClock';
import { useFocusTimer } from '@/app/providers/FocusProvider';
import { useToast } from '@/app/providers/ToastProvider';
import {
  addCustomScheduleEvent,
  addScheduleTemplate,
  deleteOrSkipScheduleBlock,
  deleteScheduleTemplate,
  rescheduleScheduleBlock,
  resetScheduleBlockInstance,
  toggleScheduleBlockCompleted,
} from '@/services/storage/repositories';
import {
  addDaysToDateKey,
  dateKeyToUtcDate,
  formatShortDateLabel,
  formatTime24To12,
  getMonthCalendarDateKeys,
  getShortDayLabel,
  getWeekDateKeys,
} from '@/lib/dateUtils';
import { findCurrentAndNextBlocks, resolveDaySchedule } from '@/lib/scheduleEngine';
import { customEventFormSchema, type CustomEventFormValues } from '@/lib/validations';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { SegmentedTabs } from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';
import type { ResolvedScheduleBlock, ScheduleCategory } from '@/types';

type ScheduleViewMode = 'day' | 'week' | 'month';
type SourceFilter = 'all' | 'college' | 'routine' | 'custom';

const BADGE_STYLE: Record<ScheduleCategory, string> = {
  class: 'bg-[#635BDB]/15 text-[#8178F5] border-[#635BDB]/30',
  lab: 'bg-[#8178F5]/15 text-[#A59FF8] border-[#8178F5]/30',
  mentoring: 'bg-[#16A34A]/15 text-[#22C55E] border-[#16A34A]/30',
  project: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  cir: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  break: 'bg-[#E5A03C]/15 text-[#E5A03C] border-[#E5A03C]/30',
  dsa: 'bg-[#635BDB]/15 text-[#8178F5] border-[#635BDB]/30',
  awareness: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  placement: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  career: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  routine: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  personal: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
};

export default function SchedulePage() {
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const rawTemplates = useLiveQuery(() => db.scheduleTemplates.toArray(), []);
  const rawInstances = useLiveQuery(() => db.scheduleInstances.toArray(), []);
  const templates = useMemo(() => rawTemplates ?? [], [rawTemplates]);
  const instances = useMemo(() => rawInstances ?? [], [rawInstances]);
  const istNow = useIstClock(profile?.timezone ?? 'Asia/Kolkata');
  const { openFocus } = useFocusTimer();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ScheduleViewMode>('day');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => istNow.dateKey);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedBlock, setSelectedBlock] = useState<ResolvedScheduleBlock | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  const [tplDay, setTplDay] = useState<number>(1);
  const [tplTitle, setTplTitle] = useState('');
  const [tplCode, setTplCode] = useState('');
  const [tplSource, setTplSource] = useState<'college' | 'routine'>('college');
  const [tplCategory, setTplCategory] = useState<ScheduleCategory>('class');
  const [tplStart, setTplStart] = useState('08:00');
  const [tplEnd, setTplEnd] = useState('08:50');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomEventFormValues>({
    resolver: zodResolver(customEventFormSchema),
    defaultValues: {
      title: '',
      category: 'personal',
      dateKey: selectedDateKey,
      startTime: '17:00',
      endTime: '18:00',
    },
  });

  const dayBlocks = useMemo(() => {
    const resolved = resolveDaySchedule({
      dateKey: selectedDateKey,
      templates,
      instances,
      electiveThreeName: profile?.electiveThreeName,
    });
    if (sourceFilter === 'all') return resolved;
    return resolved.filter((b) => b.source === sourceFilter);
  }, [selectedDateKey, templates, instances, profile?.electiveThreeName, sourceFilter]);

  const { currentBlock, nextBlock } = useMemo(
    () =>
      selectedDateKey === istNow.dateKey
        ? findCurrentAndNextBlocks(dayBlocks, istNow.minutesFromMidnight)
        : { currentBlock: null, nextBlock: null },
    [dayBlocks, selectedDateKey, istNow.dateKey, istNow.minutesFromMidnight]
  );

  const weekDateKeys = useMemo(
    () => getWeekDateKeys(selectedDateKey, profile?.weekStartsOn ?? 'monday'),
    [selectedDateKey, profile?.weekStartsOn]
  );

  const monthAnchor = dateKeyToUtcDate(selectedDateKey);
  const monthDateKeys = useMemo(
    () =>
      getMonthCalendarDateKeys(
        monthAnchor.getUTCFullYear(),
        monthAnchor.getUTCMonth(),
        profile?.weekStartsOn ?? 'monday'
      ),
    [monthAnchor, profile?.weekStartsOn]
  );

  function openInspector(block: ResolvedScheduleBlock) {
    setSelectedBlock(block);
    setRescheduleStart(block.startTime);
    setRescheduleEnd(block.endTime);
    setInspectorNotes(block.notes ?? '');
  }

  async function handleSaveReschedule() {
    if (!selectedBlock) return;
    await rescheduleScheduleBlock(selectedBlock, rescheduleStart, rescheduleEnd, inspectorNotes);
    toast('Activity updated for this date', {
      description: 'Original recurring template remains intact.',
      tone: 'success',
    });
    setSelectedBlock(null);
  }

  async function onCreateCustomEvent(values: CustomEventFormValues) {
    await addCustomScheduleEvent({
      title: values.title,
      category: values.category,
      subjectCode: values.subjectCode || undefined,
      location: values.location || undefined,
      dateKey: values.dateKey,
      startTime: values.startTime,
      endTime: values.endTime,
      notes: values.notes || undefined,
    });
    toast('Custom event added', { tone: 'success' });
    setAddModalOpen(false);
    reset({
      title: '',
      category: 'personal',
      dateKey: selectedDateKey,
      startTime: '17:00',
      endTime: '18:00',
    });
  }

  async function handleAddRecurringTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!tplTitle.trim()) return;
    await addScheduleTemplate({
      source: tplSource,
      category: tplCategory,
      dayOfWeek: tplDay,
      subjectCode: tplCode.trim() || undefined,
      title: tplTitle.trim(),
      startTime: tplStart,
      endTime: tplEnd,
      isActive: true,
    });
    setTplTitle('');
    setTplCode('');
    toast('Recurring slot added', { tone: 'success' });
  }

  const stepDelta = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Schedule & Timetable"
        subtitle="Amrita Semester VI timetable + configurable daily master routine (IST)"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setTemplatesModalOpen(true)}>
              Edit Recurring Slots
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                reset({
                  title: '',
                  category: 'personal',
                  dateKey: selectedDateKey,
                  startTime: '17:00',
                  endTime: '18:00',
                });
                setAddModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--df-border)] bg-[var(--df-secondary)] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedTabs
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
          />
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDateKey(addDaysToDateKey(selectedDateKey, -stepDelta))}
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDateKey(istNow.dateKey)}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDateKey(addDaysToDateKey(selectedDateKey, stepDelta))}
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="font-mono-tabular text-xs font-medium text-[var(--df-text)] px-1">
            {getShortDayLabel(selectedDateKey)}, {formatShortDateLabel(selectedDateKey)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'college', 'routine', 'custom'] as SourceFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSourceFilter(f)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors cursor-pointer',
                sourceFilter === f
                  ? 'border-[#635BDB] bg-[#635BDB]/15 text-[#8178F5]'
                  : 'border-[var(--df-border)] text-[var(--df-text-muted)] hover:text-[var(--df-text)]'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <Card className="lg:col-span-8">
            <CardHeader>
              <div>
                <CardTitle>
                  Daily Timeline — {getShortDayLabel(selectedDateKey)} {formatShortDateLabel(selectedDateKey)}
                </CardTitle>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Click any block to reschedule for today, add notes, or launch Focus Mode.
                </p>
              </div>
              <Badge tone="neutral" className="font-mono-tabular">
                {dayBlocks.length} blocks
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayBlocks.map((block) => {
                const isCurrent =
                  currentBlock &&
                  currentBlock.startTime === block.startTime &&
                  currentBlock.title === block.title;
                const isNext =
                  nextBlock &&
                  nextBlock.startTime === block.startTime &&
                  nextBlock.title === block.title;

                return (
                  <div
                    key={`${block.templateId ?? block.instanceId}-${block.startTime}-${block.title}`}
                    className={cn(
                      'flex flex-col gap-2 rounded-xl border border-[var(--df-border)] p-3 sm:flex-row sm:items-center sm:justify-between transition-colors',
                      isCurrent
                        ? 'border-[#635BDB] bg-[#635BDB]/10'
                        : 'bg-[var(--df-bg)]/70 hover:bg-[var(--df-elevated)]/60'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => void toggleScheduleBlockCompleted(block)}
                        aria-label={`Toggle ${block.title}`}
                        className={cn(
                          'mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border cursor-pointer',
                          block.completed
                            ? 'border-[#16A34A] bg-[#16A34A] text-white'
                            : 'border-[var(--df-text-muted)]/50 hover:border-[#8178F5]'
                        )}
                      >
                        {block.completed && <Check className="h-3 w-3" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-tabular text-xs text-[var(--df-text-muted)]">
                            {formatTime24To12(block.startTime)} – {formatTime24To12(block.endTime)}
                            {block.crossesMidnight ? ' (+1d)' : ''}
                          </span>
                          <span
                            className={cn(
                              'rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase',
                              BADGE_STYLE[block.category]
                            )}
                          >
                            {block.category}
                          </span>
                          {isCurrent && <Badge tone="success">NOW</Badge>}
                          {isNext && <Badge tone="accent">NEXT</Badge>}
                          {block.isRescheduled && <Badge tone="warning">Rescheduled</Badge>}
                          {block.hasConflict && (
                            <Badge tone="error">
                              <AlertTriangle className="h-3 w-3" /> Conflict
                            </Badge>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => openInspector(block)}
                          className="mt-1 text-left cursor-pointer"
                        >
                          <p
                            className={cn(
                              'text-sm font-medium text-[var(--df-text)] hover:text-[#8178F5]',
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
                          {(block.subtitle || block.location || block.notes) && (
                            <p className="text-xs text-[var(--df-text-muted)]">
                              {[block.subtitle, block.location, block.notes].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-7 sm:pl-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openFocus({
                            taskTitle: block.subjectCode
                              ? `${block.subjectCode} ${block.title}`
                              : block.title,
                            objective: block.subtitle,
                          })
                        }
                      >
                        <Timer className="h-3.5 w-3.5" />
                        Focus
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openInspector(block)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Class Slot Timing Reference */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>College Slot Timings</CardTitle>
              <Clock className="h-4 w-4 text-[#8178F5]" />
            </CardHeader>
            <CardContent className="space-y-1.5">
              {COLLEGE_CLASS_SLOTS.map((slot) => (
                <div
                  key={slot.slot}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs',
                    slot.isBreak
                      ? 'bg-[#E5A03C]/10 text-[#E5A03C]'
                      : 'bg-[var(--df-bg)]/60 text-[var(--df-text-muted)]'
                  )}
                >
                  <span className="font-medium text-[var(--df-text)]">
                    {slot.isBreak ? slot.slot : `Slot ${slot.slot}`}
                  </span>
                  <span className="font-mono-tabular">{slot.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
          {weekDateKeys.map((dk) => {
            const blocks = resolveDaySchedule({
              dateKey: dk,
              templates,
              instances,
              electiveThreeName: profile?.electiveThreeName,
            }).filter((b) => sourceFilter === 'all' || b.source === sourceFilter);
            const isToday = dk === istNow.dateKey;

            return (
              <Card
                key={dk}
                className={cn(isToday && 'border-[#635BDB]')}
              >
                <CardHeader className="pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(dk);
                      setViewMode('day');
                    }}
                    className="flex w-full items-center justify-between text-left cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-[var(--df-text)]">
                      {getShortDayLabel(dk)} {formatShortDateLabel(dk)}
                    </span>
                    {isToday && <Badge tone="accent">Today</Badge>}
                  </button>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {blocks.map((b) => (
                    <button
                      key={`${b.templateId ?? b.instanceId}-${b.startTime}`}
                      type="button"
                      onClick={() => openInspector(b)}
                      className={cn(
                        'w-full rounded-lg border px-2 py-1.5 text-left text-[11px] transition-colors cursor-pointer',
                        BADGE_STYLE[b.category],
                        b.completed && 'opacity-60 line-through'
                      )}
                    >
                      <div className="font-mono-tabular text-[10px] opacity-80">
                        {formatTime24To12(b.startTime)}
                      </div>
                      <div className="truncate font-medium">
                        {b.subjectCode ? `${b.subjectCode} ` : ''}
                        {b.title}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {new Intl.DateTimeFormat('en-IN', {
                timeZone: 'UTC',
                month: 'long',
                year: 'numeric',
              }).format(monthAnchor)}
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-[#8178F5]" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-[var(--df-text-muted)] mb-2">
              {(profile?.weekStartsOn === 'sunday'
                ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              ).map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {monthDateKeys.map((dk) => {
                const d = dateKeyToUtcDate(dk);
                const inMonth = d.getUTCMonth() === monthAnchor.getUTCMonth();
                const blocks = resolveDaySchedule({
                  dateKey: dk,
                  templates,
                  instances,
                  electiveThreeName: profile?.electiveThreeName,
                }).filter((b) => b.category !== 'break' && b.title !== 'Sleep');
                const collegeCount = blocks.filter((b) => b.source === 'college').length;
                const isToday = dk === istNow.dateKey;

                return (
                  <button
                    key={dk}
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(dk);
                      setViewMode('day');
                    }}
                    className={cn(
                      'flex min-h-[68px] flex-col items-start justify-between rounded-lg border p-1.5 text-left transition-colors cursor-pointer',
                      isToday
                        ? 'border-[#635BDB] bg-[#635BDB]/10'
                        : 'border-[var(--df-border)] bg-[var(--df-bg)]/60 hover:bg-[var(--df-elevated)]',
                      !inMonth && 'opacity-40'
                    )}
                  >
                    <span className="font-mono-tabular text-xs font-medium text-[var(--df-text)]">
                      {d.getUTCDate()}
                    </span>
                    <div className="w-full space-y-0.5 text-[10px] text-[var(--df-text-muted)]">
                      {collegeCount > 0 && (
                        <div className="truncate rounded bg-[#635BDB]/15 px-1 text-[#8178F5]">
                          {collegeCount} class
                        </div>
                      )}
                      <div className="truncate font-mono-tabular">
                        {blocks.filter((b) => b.completed).length}/{blocks.length}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Inspector Modal */}
      <Modal
        open={Boolean(selectedBlock)}
        onClose={() => setSelectedBlock(null)}
        title={
          selectedBlock
            ? `${selectedBlock.subjectCode ? `${selectedBlock.subjectCode} ` : ''}${selectedBlock.title}`
            : 'Activity'
        }
        description={
          selectedBlock
            ? `Reschedule or annotate for ${formatShortDateLabel(selectedBlock.dateKey)} without altering the recurring template.`
            : undefined
        }
      >
        {selectedBlock && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="resched-start">Start Time (IST)</FieldLabel>
                <Input
                  id="resched-start"
                  type="time"
                  value={rescheduleStart}
                  onChange={(e) => setRescheduleStart(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="resched-end">End Time (IST)</FieldLabel>
                <Input
                  id="resched-end"
                  type="time"
                  value={rescheduleEnd}
                  onChange={(e) => setRescheduleEnd(e.target.value)}
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="inspector-notes">Notes</FieldLabel>
              <Textarea
                id="inspector-notes"
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
                placeholder="Room change, topics covered, or prep notes..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    await deleteOrSkipScheduleBlock(selectedBlock);
                    toast(
                      selectedBlock.isCustom ? 'Event deleted' : 'Skipped for this date',
                      { tone: 'info' }
                    );
                    setSelectedBlock(null);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {selectedBlock.isCustom ? 'Delete' : 'Skip Today'}
                </Button>
                {selectedBlock.isRescheduled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await resetScheduleBlockInstance(selectedBlock);
                      toast('Restored original recurring time', { tone: 'info' });
                      setSelectedBlock(null);
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
              </div>
              <Button variant="primary" size="sm" onClick={() => void handleSaveReschedule()}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Custom Event Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Custom Schedule Event"
        description="Adds a one-off event on a specific date without modifying recurring templates."
      >
        <form onSubmit={handleSubmit(onCreateCustomEvent)} className="space-y-3">
          <div>
            <FieldLabel htmlFor="ce-title" error={errors.title?.message}>
              Title
            </FieldLabel>
            <Input id="ce-title" {...register('title')} placeholder="e.g., Extra Lab / Mock Interview" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="ce-cat">Category</FieldLabel>
              <Select id="ce-cat" {...register('category')}>
                <option value="class">Class</option>
                <option value="lab">Lab</option>
                <option value="mentoring">Mentoring</option>
                <option value="project">Project</option>
                <option value="cir">CIR</option>
                <option value="dsa">DSA</option>
                <option value="placement">Placement</option>
                <option value="career">Career</option>
                <option value="personal">Personal</option>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="ce-date" error={errors.dateKey?.message}>
                Date
              </FieldLabel>
              <Input id="ce-date" type="date" {...register('dateKey')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="ce-start" error={errors.startTime?.message}>
                Start Time
              </FieldLabel>
              <Input id="ce-start" type="time" {...register('startTime')} />
            </div>
            <div>
              <FieldLabel htmlFor="ce-end" error={errors.endTime?.message}>
                End Time
              </FieldLabel>
              <Input id="ce-end" type="time" {...register('endTime')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="ce-code">Subject Code (optional)</FieldLabel>
              <Input id="ce-code" {...register('subjectCode')} placeholder="23CSE312" />
            </div>
            <div>
              <FieldLabel htmlFor="ce-loc">Location (optional)</FieldLabel>
              <Input id="ce-loc" {...register('location')} placeholder="Lab / Cabin" />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="ce-notes">Notes</FieldLabel>
            <Textarea id="ce-notes" {...register('notes')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Recurring Timetable & Routine Templates */}
      <Modal
        open={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        title="Configure Recurring Timetable & Routine"
        description="Add or remove recurring weekly slots for future semesters or routine adjustments."
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-4">
          <form onSubmit={handleAddRecurringTemplate} className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)] p-3 sm:grid-cols-6">
            <Select
              value={tplDay}
              onChange={(e) => setTplDay(Number(e.target.value))}
              aria-label="Day of week"
              className="sm:col-span-2"
            >
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
              <option value={0}>Sunday</option>
            </Select>
            <Select
              value={tplSource}
              onChange={(e) => setTplSource(e.target.value as 'college' | 'routine')}
              aria-label="Source"
            >
              <option value="college">College</option>
              <option value="routine">Routine</option>
            </Select>
            <Select
              value={tplCategory}
              onChange={(e) => setTplCategory(e.target.value as ScheduleCategory)}
              aria-label="Category"
            >
              <option value="class">Class</option>
              <option value="lab">Lab</option>
              <option value="mentoring">Mentoring</option>
              <option value="project">Project</option>
              <option value="cir">CIR</option>
              <option value="dsa">DSA</option>
              <option value="routine">Routine</option>
            </Select>
            <Input
              value={tplCode}
              onChange={(e) => setTplCode(e.target.value)}
              placeholder="Code"
              aria-label="Subject code"
            />
            <Input
              value={tplTitle}
              onChange={(e) => setTplTitle(e.target.value)}
              placeholder="Title *"
              aria-label="Template title"
              className="sm:col-span-3"
            />
            <Input
              type="time"
              value={tplStart}
              onChange={(e) => setTplStart(e.target.value)}
              aria-label="Start time"
            />
            <Input
              type="time"
              value={tplEnd}
              onChange={(e) => setTplEnd(e.target.value)}
              aria-label="End time"
            />
            <Button type="submit" variant="primary" size="sm">
              Add Slot
            </Button>
          </form>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {templates
              .filter((t) => t.dayOfWeek === tplDay)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)] px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-mono-tabular text-[var(--df-text-muted)] mr-2">
                      {formatTime24To12(t.startTime)}–{formatTime24To12(t.endTime)}
                    </span>
                    <span className="font-medium text-[var(--df-text)]">
                      {t.subjectCode ? `${t.subjectCode} ` : ''}
                      {t.title}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void deleteScheduleTemplate(t.id)}
                    aria-label={`Remove ${t.title}`}
                    className="h-7 w-7 text-[#E05252]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
