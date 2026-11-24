import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Pencil,
  Plus,
  Repeat,
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
  shiftMonthDateKey,
} from '@/lib/dateUtils';
import { findCurrentAndNextBlocks, resolveDaySchedule } from '@/lib/scheduleEngine';
import { customEventFormSchema, type CustomEventFormValues } from '@/lib/validations';
import { EmptyState, PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { Reveal, SegmentedTabs } from '@/components/ui/Primitives';
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

/** Presentational accent (left stripe + dot) per category, consistent with the dashboard timeline. */
const CATEGORY_STRIPE: Record<ScheduleCategory, { border: string; dot: string }> = {
  class: { border: 'border-l-[#635BDB]', dot: 'bg-[#8178F5] shadow-[0_0_8px_rgba(129,120,245,0.8)]' },
  lab: { border: 'border-l-[#8178F5]', dot: 'bg-[#A59FF8] shadow-[0_0_8px_rgba(165,159,248,0.8)]' },
  mentoring: { border: 'border-l-[#16A34A]', dot: 'bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.7)]' },
  project: { border: 'border-l-sky-400', dot: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]' },
  cir: { border: 'border-l-cyan-400', dot: 'bg-cyan-300 shadow-[0_0_8px_rgba(94,231,247,0.7)]' },
  break: { border: 'border-l-[#E5A03C]', dot: 'bg-[#E5A03C] shadow-[0_0_8px_rgba(229,160,60,0.7)]' },
  dsa: { border: 'border-l-[#635BDB]', dot: 'bg-[#8178F5] shadow-[0_0_8px_rgba(129,120,245,0.8)]' },
  awareness: { border: 'border-l-violet-400', dot: 'bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,0.7)]' },
  placement: { border: 'border-l-emerald-400', dot: 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.7)]' },
  career: { border: 'border-l-amber-400', dot: 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.7)]' },
  routine: { border: 'border-l-slate-400', dot: 'bg-slate-300' },
  personal: { border: 'border-l-zinc-500', dot: 'bg-zinc-300' },
};

const ICON_CHIP =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#8F87FA]/30 bg-[#6D64F0]/12 text-[var(--df-accent-secondary)]';

export default function SchedulePage() {
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const rawTemplates = useLiveQuery(() => db.scheduleTemplates.toArray(), []);
  const rawInstances = useLiveQuery(() => db.scheduleInstances.toArray(), []);
  const templates = useMemo(() => rawTemplates ?? [], [rawTemplates]);
  const instances = useMemo(() => rawInstances ?? [], [rawInstances]);
  const istNow = useIstClock(profile?.timezone ?? 'Asia/Kolkata');
  const { openFocus } = useFocusTimer();
  const { toast } = useToast();
  const reduced = useReducedMotion();

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

  const stepDelta = viewMode === 'day' ? 1 : 7;
  // Month view steps by whole calendar months so no month is ever skipped
  // (a fixed 30-day jump skips Feb and lands mid-month).
  const shiftPeriod = (dir: -1 | 1) =>
    setSelectedDateKey((cur) =>
      viewMode === 'month'
        ? shiftMonthDateKey(cur, dir)
        : addDaysToDateKey(cur, dir * stepDelta)
    );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Schedule & Timetable"
        subtitle="Amrita Semester VI timetable + configurable daily master routine (IST)"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setTemplatesModalOpen(true)}
            >
              <Repeat className="h-3.5 w-3.5" />
              Edit Recurring Slots
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-full"
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

      {/* Toolbar — glass control bar */}
      <Reveal delay={0.05}>
        <div className="relative flex flex-col gap-3 rounded-[22px] df-glass p-2.5 sm:p-3 lg:flex-row lg:items-center lg:justify-between">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(143,135,250,0.6),rgba(94,231,247,0.45),transparent)]"
          />
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
            <div className="flex items-center gap-1 rounded-full df-well p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => shiftPeriod(-1)}
                aria-label="Previous period"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 rounded-full px-3',
                  selectedDateKey === istNow.dateKey &&
                    'text-[var(--df-accent-secondary)] shadow-[inset_0_0_0_1px_rgba(143,135,250,0.35)]'
                )}
                onClick={() => setSelectedDateKey(istNow.dateKey)}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => shiftPeriod(1)}
                aria-label="Next period"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium text-[var(--df-text)]">
              <CalendarDays className="h-3.5 w-3.5 text-[var(--df-accent-secondary)]" aria-hidden="true" />
              <span className="font-mono-tabular">
                {getShortDayLabel(selectedDateKey)}, {formatShortDateLabel(selectedDateKey)}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="mr-0.5 h-3.5 w-3.5 text-[var(--df-text-faint)]" aria-hidden="true" />
            {(['all', 'college', 'routine', 'custom'] as SourceFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSourceFilter(f)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all duration-300 cursor-pointer',
                  sourceFilter === f
                    ? 'border-transparent bg-[linear-gradient(135deg,#7B72F6,#5145C8)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(109,100,240,0.85)]'
                    : 'border-[var(--df-border)] bg-[var(--df-inset)] text-[var(--df-text-muted)] hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)] hover:text-[var(--df-text)]'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <Reveal delay={0.1} className="lg:col-span-8">
          <Card elevated className={cn(currentBlock && 'df-live-border')}>
            <CardHeader>
              <div className="flex min-w-0 items-start gap-3">
                <span className={ICON_CHIP} aria-hidden="true">
                  <CalendarClock className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="df-eyebrow">Day view</p>
                  <CardTitle className="mt-0.5">
                    Daily Timeline — {getShortDayLabel(selectedDateKey)} {formatShortDateLabel(selectedDateKey)}
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-[var(--df-text-muted)]">
                    Click any block to reschedule for today, add notes, or launch Focus Mode.
                  </p>
                </div>
              </div>
              <Badge tone="neutral" className="font-mono-tabular shrink-0">
                {dayBlocks.length} blocks
              </Badge>
            </CardHeader>
            <CardContent>
              {dayBlocks.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="No blocks for this day"
                  description="Try another source filter, or add a custom event for this date."
                />
              ) : (
              <ol className="relative">
                {/* Timeline spine */}
                <span
                  aria-hidden="true"
                  className="absolute left-[7px] top-3 bottom-3 w-px bg-[linear-gradient(180deg,rgba(143,135,250,0.7),var(--df-border)_25%,var(--df-border)_75%,rgba(94,231,247,0.55))] shadow-[0_0_8px_rgba(143,135,250,0.35)]"
                />
              {dayBlocks.map((block, idx) => {
                const isCurrent =
                  currentBlock &&
                  currentBlock.startTime === block.startTime &&
                  currentBlock.title === block.title;
                const isNext =
                  nextBlock &&
                  nextBlock.startTime === block.startTime &&
                  nextBlock.title === block.title;

                return (
                  <motion.li
                    key={`${block.templateId ?? block.instanceId}-${block.startTime}-${block.title}`}
                    initial={reduced ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: reduced ? 0 : Math.min(idx * 0.03, 0.4),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative flex items-start gap-3 py-1"
                  >
                      {/* Node / completion toggle */}
                      <button
                        type="button"
                        onClick={() => void toggleScheduleBlockCompleted(block)}
                        aria-label={`Toggle ${block.title}`}
                        className={cn(
                          'relative z-10 mt-4 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border transition-all duration-300 cursor-pointer',
                          block.completed
                            ? 'border-[var(--df-success)] bg-[var(--df-success)] text-white shadow-[0_0_12px_rgba(34,197,94,0.7)]'
                            : isCurrent
                              ? 'df-dot-live border-[#8F87FA] bg-[var(--df-bg)] text-[#8F87FA] shadow-[0_0_12px_rgba(143,135,250,0.8)]'
                              : isNext
                                ? 'border-[var(--df-cyan)] bg-[var(--df-bg)] shadow-[0_0_10px_rgba(94,231,247,0.55)]'
                                : 'border-[var(--df-border-strong)] bg-[var(--df-bg)] hover:border-[#8F87FA] hover:shadow-[0_0_10px_rgba(143,135,250,0.6)]'
                        )}
                      >
                        {block.completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </button>

                  <div
                    className={cn(
                      'flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-l-2 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between transition-all duration-300',
                      CATEGORY_STRIPE[block.category].border,
                      isCurrent
                        ? 'border-[#8F87FA]/45 bg-[linear-gradient(110deg,rgba(109,100,240,0.18),rgba(94,231,247,0.04))] shadow-[0_10px_30px_-14px_rgba(109,100,240,0.8)]'
                        : isNext
                          ? 'border-[var(--df-cyan)]/30 bg-[linear-gradient(110deg,rgba(94,231,247,0.07),transparent_60%)] hover:bg-[var(--df-secondary)]'
                          : 'border-[var(--df-border)] bg-[var(--df-inset)] hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]'
                    )}
                  >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-tabular text-[11px] text-[var(--df-text-muted)]">
                            {formatTime24To12(block.startTime)} – {formatTime24To12(block.endTime)}
                            {block.crossesMidnight ? ' (+1d)' : ''}
                          </span>
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em]',
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
                          className="group mt-1 text-left cursor-pointer"
                        >
                          <p
                            className={cn(
                              'text-sm font-medium text-[var(--df-text)] transition-colors group-hover:text-[var(--df-accent-secondary)]',
                              block.completed && 'line-through decoration-[var(--df-text-faint)] text-[var(--df-text-muted)]'
                            )}
                          >
                            {block.subjectCode && (
                              <span className="mr-1.5 font-mono-tabular text-xs text-[var(--df-accent-secondary)]">
                                {block.subjectCode}
                              </span>
                            )}
                            {block.title}
                          </p>
                          {(block.subtitle || block.location || block.notes) && (
                            <p className="mt-0.5 text-xs text-[var(--df-text-muted)]">
                              {[block.subtitle, block.location, block.notes].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </button>
                      </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => openInspector(block)}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </div>
                  </motion.li>
                );
              })}
              </ol>
              )}
            </CardContent>
          </Card>
          </Reveal>

          {/* Class Slot Timing Reference */}
          <Reveal delay={0.16} className="lg:col-span-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className={ICON_CHIP} aria-hidden="true">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="df-eyebrow">Reference</p>
                  <CardTitle className="mt-0.5">College Slot Timings</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {COLLEGE_CLASS_SLOTS.map((slot) => (
                <div
                  key={slot.slot}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs transition-all',
                    slot.isBreak
                      ? 'border-[#E5A03C]/25 bg-[#E5A03C]/10 text-[#E5A03C]'
                      : 'df-well text-[var(--df-text-muted)] hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]'
                  )}
                >
                  <span className="flex items-center gap-2 font-medium text-[var(--df-text)]">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        slot.isBreak
                          ? 'bg-[#E5A03C] shadow-[0_0_8px_rgba(229,160,60,0.8)]'
                          : 'bg-[#8F87FA] shadow-[0_0_8px_rgba(143,135,250,0.8)]'
                      )}
                    />
                    {slot.isBreak ? slot.slot : `Slot ${slot.slot}`}
                  </span>
                  <span className="font-mono-tabular">{slot.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          </Reveal>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
          {weekDateKeys.map((dk, idx) => {
            const blocks = resolveDaySchedule({
              dateKey: dk,
              templates,
              instances,
              electiveThreeName: profile?.electiveThreeName,
            }).filter((b) => sourceFilter === 'all' || b.source === sourceFilter);
            const isToday = dk === istNow.dateKey;

            return (
              <Reveal key={dk} delay={Math.min(0.05 + idx * 0.04, 0.3)} className="h-full">
              <Card
                className={cn(
                  'relative h-full',
                  isToday &&
                    'border-[#8F87FA]/60 shadow-[0_0_0_1px_rgba(143,135,250,0.35),0_18px_40px_-18px_rgba(109,100,240,0.9)]'
                )}
              >
                {isToday && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,#8F87FA,#5EE7F7,transparent)]"
                  />
                )}
                <CardHeader className="pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(dk);
                      setViewMode('day');
                    }}
                    className="group flex w-full items-center justify-between gap-2 text-left cursor-pointer"
                  >
                    <span className="flex flex-col">
                      <span
                        className={cn(
                          'df-eyebrow',
                          isToday && 'text-[var(--df-accent-secondary)]'
                        )}
                      >
                        {getShortDayLabel(dk)}
                      </span>
                      <span className="mt-0.5 text-sm font-semibold tracking-[-0.02em] text-[var(--df-text)] transition-colors group-hover:text-[var(--df-accent-secondary)]">
                        {formatShortDateLabel(dk)}
                      </span>
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
                        'w-full rounded-xl border border-l-2 px-2.5 py-1.5 text-left text-[11px] transition-all duration-300 cursor-pointer hover:-translate-y-px hover:shadow-[0_8px_18px_-10px_rgba(109,100,240,0.7)]',
                        BADGE_STYLE[b.category],
                        CATEGORY_STRIPE[b.category].border,
                        b.completed && 'opacity-60 line-through'
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-mono-tabular text-[10px] opacity-80">
                        <span
                          aria-hidden="true"
                          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', CATEGORY_STRIPE[b.category].dot)}
                        />
                        {formatTime24To12(b.startTime)}
                      </div>
                      <div className="truncate font-medium">
                        {b.subjectCode ? `${b.subjectCode} ` : ''}
                        {b.title}
                      </div>
                    </button>
                  ))}
                  {blocks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--df-border)] px-2 py-3 text-center text-[11px] text-[var(--df-text-faint)]">
                      Free day
                    </div>
                  )}
                </CardContent>
              </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <Reveal delay={0.1}>
        <Card elevated>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className={ICON_CHIP} aria-hidden="true">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div>
                <p className="df-eyebrow">Month view</p>
                <CardTitle className="mt-0.5 text-[17px] tracking-[-0.03em] df-text-gradient">
                  {new Intl.DateTimeFormat('en-IN', {
                    timeZone: 'UTC',
                    month: 'long',
                    year: 'numeric',
                  }).format(monthAnchor)}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="df-eyebrow mb-2 grid grid-cols-7 gap-1 text-center sm:gap-1.5">
              {(profile?.weekStartsOn === 'sunday'
                ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              ).map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
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
                // Presentation-only: completion ratio for the tiny per-day bar.
                const donePct =
                  blocks.length > 0
                    ? (blocks.filter((b) => b.completed).length / blocks.length) * 100
                    : 0;

                return (
                  <button
                    key={dk}
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(dk);
                      setViewMode('day');
                    }}
                    className={cn(
                      'group flex min-h-[64px] sm:min-h-[84px] min-w-0 flex-col items-start justify-between rounded-xl sm:rounded-2xl border p-1 sm:p-2 text-left transition-all duration-300 cursor-pointer',
                      isToday
                        ? 'border-[#8F87FA]/60 bg-[#6D64F0]/10 shadow-[0_0_20px_-8px_rgba(109,100,240,0.9)]'
                        : 'border-[var(--df-border)] bg-[var(--df-inset)] hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]',
                      !inMonth && 'opacity-40'
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono-tabular text-xs font-medium',
                        isToday
                          ? 'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7B72F6,#5145C8)] text-white shadow-[0_6px_14px_-4px_rgba(109,100,240,0.9)]'
                          : 'text-[var(--df-text)]'
                      )}
                    >
                      {d.getUTCDate()}
                    </span>
                    <div className="w-full min-w-0 space-y-0.5 text-[10px] text-[var(--df-text-muted)]">
                      {collegeCount > 0 && (
                        <div className="truncate rounded-full bg-[#635BDB]/15 px-1 sm:px-1.5 text-[var(--df-accent-secondary)]">
                          {collegeCount} class
                        </div>
                      )}
                      <div className="truncate font-mono-tabular">
                        {blocks.filter((b) => b.completed).length}/{blocks.length}
                      </div>
                      {blocks.length > 0 && (
                        <div
                          aria-hidden="true"
                          className="h-1 w-full overflow-hidden rounded-full bg-[var(--df-border)]"
                        >
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#635BDB,#A78BFA,#5EE7F7)] transition-[width] duration-500"
                            style={{ width: `${donePct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </Reveal>
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
            <div className="flex flex-wrap items-center gap-2 rounded-2xl df-well px-3.5 py-2.5">
              <span
                aria-hidden="true"
                className={cn('h-2 w-2 shrink-0 rounded-full', CATEGORY_STRIPE[selectedBlock.category].dot)}
              />
              <span className="font-mono-tabular text-xs text-[var(--df-text)]">
                {formatTime24To12(selectedBlock.startTime)} – {formatTime24To12(selectedBlock.endTime)}
              </span>
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em]',
                  BADGE_STYLE[selectedBlock.category]
                )}
              >
                {selectedBlock.category}
              </span>
            </div>
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

            <div className="df-hairline" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  className="rounded-full"
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
                    className="rounded-full"
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
              <Button
                variant="primary"
                size="sm"
                className="rounded-full"
                onClick={() => void handleSaveReschedule()}
              >
                <Check className="h-3.5 w-3.5" />
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
          <div className="df-hairline" />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" className="rounded-full" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-full">
              <Plus className="h-4 w-4" />
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
          <p className="df-eyebrow flex items-center gap-1.5">
            <Repeat className="h-3 w-3" aria-hidden="true" />
            New recurring slot
          </p>
          <form onSubmit={handleAddRecurringTemplate} className="grid grid-cols-1 gap-2 rounded-2xl df-well p-3 sm:grid-cols-6">
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
            <Button type="submit" variant="primary" size="sm" className="rounded-full">
              <Plus className="h-3.5 w-3.5" />
              Add Slot
            </Button>
          </form>

          <div className="df-hairline" />
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {templates
              .filter((t) => t.dayOfWeek === tplDay)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-2xl df-well px-3.5 py-2.5 text-xs transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn('h-1.5 w-1.5 shrink-0 rounded-full', CATEGORY_STRIPE[t.category].dot)}
                    />
                    <span className="font-mono-tabular text-[var(--df-text-muted)]">
                      {formatTime24To12(t.startTime)}–{formatTime24To12(t.endTime)}
                    </span>
                    <span className="truncate font-medium text-[var(--df-text)]">
                      {t.subjectCode ? `${t.subjectCode} ` : ''}
                      {t.title}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void deleteScheduleTemplate(t.id)}
                    aria-label={`Remove ${t.title}`}
                    className="h-7 w-7 rounded-full text-[var(--df-error)] hover:bg-[var(--df-error)]/10"
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
