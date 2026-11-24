import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  ExternalLink,
  Globe,
  GraduationCap,
  History,
  MapPin,
  Plus,
  Route,
  School,
  Timer,
  Trash2,
} from 'lucide-react';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID } from '@/config/personalPlan';
import {
  INTERNSHIP_OPPORTUNITY_SOURCES,
  MASTERS_TARGET_DIRECTION,
} from '@/config/career';
import { useIstClock } from '@/hooks/useIstClock';
import { useToast } from '@/app/providers/ToastProvider';
import {
  deleteInternship,
  deleteUniversityTarget,
  logPlacementSession,
  toggleCareerChecklistItem,
  updateMastersMilestone,
  updatePlacementTopic,
  upsertInternship,
  upsertUniversityTarget,
} from '@/services/storage/repositories';
import { formatShortDateLabel } from '@/lib/dateUtils';
import { ConfirmDialog, EmptyState, PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { Reveal, SegmentedTabs } from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';
import type {
  ChecklistState,
  InternshipApplication,
  InternshipStatus,
  PlacementSessionLog,
  StageStatus,
  UniversityTarget,
} from '@/types';

type CareerTab = 'placement' | 'internships' | 'masters';

const INTERNSHIP_STATUSES: InternshipStatus[] = [
  'Interested',
  'Researching',
  'Preparing',
  'Applied',
  'Interview',
  'Accepted',
  'Rejected',
  'Withdrawn',
];

const CHECKLIST_STATES: ChecklistState[] = [
  'not_started',
  'in_progress',
  'ready',
  'submitted',
];

/* ---------- Presentation-only style maps (keyed off existing status strings) ---------- */

const ICON_CHIP =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#8F87FA]/30 bg-[#6D64F0]/12 text-[var(--df-accent-secondary)]';

const INTERN_STATUS_STYLE: Record<InternshipStatus, { pill: string; dot: string }> = {
  Interested: { pill: 'border-[var(--df-border-strong)] bg-[var(--df-inset)] text-[var(--df-text-muted)]', dot: 'bg-[var(--df-text-faint)]' },
  Researching: { pill: 'border-sky-400/35 bg-sky-400/10 text-sky-300', dot: 'bg-sky-400' },
  Preparing: { pill: 'border-[#F0B455]/35 bg-[#F0B455]/10 text-[#F0B455]', dot: 'bg-[#F0B455]' },
  Applied: { pill: 'border-[#A78BFA]/40 bg-[#A78BFA]/12 text-[#C4B5FD] shadow-[0_0_14px_-6px_rgba(167,139,250,0.9)]', dot: 'bg-[#A78BFA]' },
  Interview: { pill: 'border-[#5EE7F7]/40 bg-[#5EE7F7]/10 text-[var(--df-cyan)] shadow-[0_0_14px_-6px_rgba(94,231,247,0.9)]', dot: 'bg-[#5EE7F7]' },
  Accepted: { pill: 'border-[#22C55E]/40 bg-[#22C55E]/12 text-[var(--df-success)] shadow-[0_0_14px_-6px_rgba(34,197,94,0.9)]', dot: 'bg-[#22C55E]' },
  Rejected: { pill: 'border-[#F87185]/40 bg-[#F87185]/10 text-[#FB7185]', dot: 'bg-[#FB7185]' },
  Withdrawn: { pill: 'border-[var(--df-border)] bg-[var(--df-inset)] text-[var(--df-text-faint)]', dot: 'bg-[var(--df-text-faint)]' },
};

const UNI_STATUS_STYLE: Record<UniversityTarget['applicationStatus'], { pill: string; dot: string }> = {
  Shortlisted: { pill: 'border-[var(--df-border-strong)] bg-[var(--df-inset)] text-[var(--df-text-muted)]', dot: 'bg-[var(--df-text-faint)]' },
  Preparing: { pill: 'border-[#F0B455]/35 bg-[#F0B455]/10 text-[#F0B455]', dot: 'bg-[#F0B455]' },
  Applied: { pill: 'border-[#A78BFA]/40 bg-[#A78BFA]/12 text-[#C4B5FD]', dot: 'bg-[#A78BFA]' },
  Interview: { pill: 'border-[#5EE7F7]/40 bg-[#5EE7F7]/10 text-[var(--df-cyan)]', dot: 'bg-[#5EE7F7]' },
  Admitted: { pill: 'border-[#22C55E]/40 bg-[#22C55E]/12 text-[var(--df-success)] shadow-[0_0_14px_-6px_rgba(34,197,94,0.9)]', dot: 'bg-[#22C55E]' },
  Rejected: { pill: 'border-[#F87185]/40 bg-[#F87185]/10 text-[#FB7185]', dot: 'bg-[#FB7185]' },
};

const STAGE_DOT: Record<StageStatus, string> = {
  not_started: 'bg-[var(--df-text-faint)]',
  in_progress: 'bg-[#F0B455] shadow-[0_0_8px_rgba(240,180,85,0.8)]',
  completed: 'bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.8)]',
};

const STAGE_NODE: Record<StageStatus, string> = {
  not_started: 'border-[var(--df-border-strong)] bg-[var(--df-inset)] text-[var(--df-text-faint)]',
  in_progress:
    'border-[#8F87FA]/60 bg-[#6D64F0]/20 text-[var(--df-accent-secondary)] shadow-[0_0_14px_-2px_rgba(109,100,240,0.8)]',
  completed:
    'border-[#22C55E]/60 bg-[#22C55E]/20 text-[var(--df-success)] shadow-[0_0_12px_rgba(34,197,94,0.7)]',
};

const CHECKLIST_STYLE: Record<ChecklistState, string> = {
  not_started: 'border-[var(--df-border)] bg-[var(--df-inset)]',
  in_progress: 'border-[#F0B455]/30 bg-[#F0B455]/[0.06]',
  ready: 'border-[#5EE7F7]/30 bg-[#5EE7F7]/[0.06]',
  submitted: 'border-[#22C55E]/35 bg-[#22C55E]/[0.07]',
};

const CHECKLIST_DOT: Record<ChecklistState, string> = {
  not_started: 'bg-[var(--df-text-faint)]',
  in_progress: 'bg-[#F0B455]',
  ready: 'bg-[#5EE7F7]',
  submitted: 'bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.8)]',
};

export default function CareerPage() {
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const placementTopics = useLiveQuery(() => db.placementTopics.toArray(), []) ?? [];
  const placementSessions = useLiveQuery(() => db.placementSessions.toArray(), []) ?? [];
  const internships = useLiveQuery(() => db.internshipApplications.toArray(), []) ?? [];
  const milestones = useLiveQuery(() => db.mastersMilestones.orderBy('order').toArray(), []) ?? [];
  const universities = useLiveQuery(() => db.universities.toArray(), []) ?? [];
  const careerChecklist = useLiveQuery(() => db.careerChecklist.toArray(), []) ?? [];

  const istNow = useIstClock(profile?.timezone ?? 'Asia/Kolkata');
  const { toast } = useToast();
  const [tab, setTab] = useState<CareerTab>('placement');
  const reduced = useReducedMotion();

  // Placement session quick log
  const [sessFocus, setSessFocus] = useState('OOP + aptitude');
  const [sessKind, setSessKind] = useState<PlacementSessionLog['kind']>('core_cs');
  const [sessMins, setSessMins] = useState(45);
  const [sessLabel, setSessLabel] = useState('');
  const [sessNotes, setSessNotes] = useState('');

  // Internship modal
  const [internModalOpen, setInternModalOpen] = useState(false);
  const [editingIntern, setEditingIntern] = useState<InternshipApplication | null>(null);
  const [deleteInternTarget, setDeleteInternTarget] = useState<InternshipApplication | null>(null);
  const [iOrg, setIOrg] = useState('');
  const [iTitle, setITitle] = useState('');
  const [iCountry, setICountry] = useState('');
  const [iUrl, setIUrl] = useState('');
  const [iOpening, setIOpening] = useState('');
  const [iDeadline, setIDeadline] = useState('');
  const [iEligibility, setIEligibility] = useState('');
  const [iStipend, setIStipend] = useState('');
  const [iTravel, setITravel] = useState('');
  const [iAccom, setIAccom] = useState('');
  const [iDocs, setIDocs] = useState('');
  const [iStatus, setIStatus] = useState<InternshipStatus>('Interested');
  const [iFollowUp, setIFollowUp] = useState('');
  const [iNotes, setINotes] = useState('');

  // University modal
  const [uniModalOpen, setUniModalOpen] = useState(false);
  const [editingUni, setEditingUni] = useState<UniversityTarget | null>(null);
  const [deleteUniTarget, setDeleteUniTarget] = useState<UniversityTarget | null>(null);
  const [uName, setUName] = useState('');
  const [uProg, setUProg] = useState('MS in Computer Science');
  const [uCountry, setUCountry] = useState('United States');
  const [uTuition, setUTuition] = useState('');
  const [uFunding, setUFunding] = useState('');
  const [uDeadline, setUDeadline] = useState('');
  const [uAppStatus, setUAppStatus] = useState<UniversityTarget['applicationStatus']>('Shortlisted');
  const [uNotes, setUNotes] = useState('');

  function openNewInternship(prefillOrg?: string, prefillUrl?: string, prefillRegion?: string) {
    setEditingIntern(null);
    setIOrg(prefillOrg ?? '');
    setITitle('');
    setICountry(prefillRegion ?? '');
    setIUrl(prefillUrl ?? '');
    setIOpening('');
    setIDeadline('');
    setIEligibility('');
    setIStipend('');
    setITravel('');
    setIAccom('');
    setIDocs('Resume/CV, Transcript, LORs');
    setIStatus('Interested');
    setIFollowUp('');
    setINotes('');
    setInternModalOpen(true);
  }

  function openEditInternship(item: InternshipApplication) {
    setEditingIntern(item);
    setIOrg(item.organization);
    setITitle(item.opportunityTitle);
    setICountry(item.country);
    setIUrl(item.officialUrl ?? '');
    setIOpening(item.openingDate ?? '');
    setIDeadline(item.deadline ?? '');
    setIEligibility(item.eligibility ?? '');
    setIStipend(item.stipend ?? '');
    setITravel(item.travelFunding ?? '');
    setIAccom(item.accommodationSupport ?? '');
    setIDocs(item.requiredDocuments.join(', '));
    setIStatus(item.status);
    setIFollowUp(item.followUpDate ?? '');
    setINotes(item.notes);
    setInternModalOpen(true);
  }

  async function saveInternship(e: React.FormEvent) {
    e.preventDefault();
    if (!iOrg.trim() || !iTitle.trim()) return;
    await upsertInternship(
      {
        organization: iOrg.trim(),
        opportunityTitle: iTitle.trim(),
        country: iCountry.trim() || 'TBD',
        officialUrl: iUrl.trim() || undefined,
        openingDate: iOpening || undefined,
        deadline: iDeadline || undefined,
        eligibility: iEligibility.trim() || undefined,
        stipend: iStipend.trim() || undefined,
        travelFunding: iTravel.trim() || undefined,
        accommodationSupport: iAccom.trim() || undefined,
        requiredDocuments: iDocs
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        status: iStatus,
        followUpDate: iFollowUp || undefined,
        notes: iNotes.trim(),
      },
      editingIntern?.id
    );
    toast(editingIntern ? 'Internship updated' : 'Internship added', { tone: 'success' });
    setInternModalOpen(false);
  }

  function openNewUniversity() {
    setEditingUni(null);
    setUName('');
    setUProg('MS in Computer Science (AI/ML & Systems)');
    setUCountry('United States');
    setUTuition('');
    setUFunding('');
    setUDeadline('');
    setUAppStatus('Shortlisted');
    setUNotes('');
    setUniModalOpen(true);
  }

  function openEditUniversity(u: UniversityTarget) {
    setEditingUni(u);
    setUName(u.university);
    setUProg(u.programme);
    setUCountry(u.country);
    setUTuition(u.tuition ?? '');
    setUFunding(u.funding ?? '');
    setUDeadline(u.deadline ?? '');
    setUAppStatus(u.applicationStatus);
    setUNotes(u.notes);
    setUniModalOpen(true);
  }

  async function saveUniversity(e: React.FormEvent) {
    e.preventDefault();
    if (!uName.trim()) return;
    await upsertUniversityTarget(
      {
        university: uName.trim(),
        programme: uProg.trim(),
        country: uCountry.trim() || 'United States',
        tuition: uTuition.trim() || undefined,
        funding: uFunding.trim() || undefined,
        deadline: uDeadline || undefined,
        ieltsStatus: editingUni?.ieltsStatus ?? 'not_started',
        toeflStatus: editingUni?.toeflStatus ?? 'not_started',
        greStatus: editingUni?.greStatus ?? 'not_started',
        duolingoStatus: editingUni?.duolingoStatus ?? 'not_started',
        sopStatus: editingUni?.sopStatus ?? 'not_started',
        lorStatus: editingUni?.lorStatus ?? 'not_started',
        transcriptsStatus: editingUni?.transcriptsStatus ?? 'not_started',
        resumeStatus: editingUni?.resumeStatus ?? 'not_started',
        applicationStatus: uAppStatus,
        notes: uNotes.trim(),
      },
      editingUni?.id
    );
    toast(editingUni ? 'University updated' : 'University added', { tone: 'success' });
    setUniModalOpen(false);
  }

  async function handleLogPlacement(e: React.FormEvent) {
    e.preventDefault();
    await logPlacementSession({
      dateKey: istNow.dateKey,
      focusArea: sessFocus,
      kind: sessKind,
      companyOrLabel: sessLabel.trim() || undefined,
      durationMinutes: sessMins,
      notes: sessNotes.trim(),
    });
    setSessLabel('');
    setSessNotes('');
    toast('Placement study session logged', { tone: 'success' });
  }

  const orderedDays = [1, 2, 3, 4, 5, 6, 0];
  const dayNames: Record<number, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Career Hub"
        subtitle="Indian campus placements, Summer 2027 international internships, and Fall 2028 US Master's"
        actions={
          tab === 'internships' ? (
            <Button variant="primary" size="sm" className="rounded-full" onClick={() => openNewInternship()}>
              <Plus className="h-4 w-4" />
              Add Opportunity
            </Button>
          ) : tab === 'masters' ? (
            <Button variant="primary" size="sm" className="rounded-full" onClick={openNewUniversity}>
              <Plus className="h-4 w-4" />
              Add University
            </Button>
          ) : undefined
        }
      />

      <Reveal delay={0.05}>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'placement', label: 'Placement Prep', count: placementSessions.length },
            { value: 'internships', label: 'Summer 2027 Internships', count: internships.length },
            { value: 'masters', label: "US Master's (Fall 2028)", count: universities.length },
          ]}
        />
      </Reveal>

      {/* PLACEMENT PREP */}
      {tab === 'placement' && (
        <div className="space-y-5">
          {/* Weekly rotation overview strip (presentational) */}
          {placementTopics.length > 0 && (
            <Reveal delay={0.08}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {orderedDays.map((dow, idx) => {
                  const rec = placementTopics.find((p) => p.dayOfWeek === dow);
                  if (!rec) return null;
                  const isToday = dow === istNow.dayOfWeek;
                  return (
                    <motion.div
                      key={rec.id}
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: reduced ? 0 : Math.min(idx * 0.04, 0.4) }}
                      className={cn(
                        'relative flex min-w-0 flex-col gap-1.5 rounded-2xl border px-3 py-2.5 transition-all',
                        isToday
                          ? 'border-[#8F87FA]/60 bg-[#6D64F0]/10 shadow-[0_0_20px_-8px_rgba(109,100,240,0.9)]'
                          : 'df-well hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            'df-eyebrow',
                            isToday && 'text-[var(--df-accent-secondary)]'
                          )}
                        >
                          {(dayNames[dow] ?? '').slice(0, 3)}
                        </span>
                        {isToday ? (
                          <span className="df-dot-live h-1.5 w-1.5 rounded-full bg-[var(--df-accent-secondary)] text-[var(--df-accent-secondary)]" />
                        ) : (
                          <span
                            className={cn('h-1.5 w-1.5 rounded-full', STAGE_DOT[rec.revisionStatus])}
                          />
                        )}
                      </div>
                      <p className="line-clamp-2 text-[12px] font-medium leading-snug text-[var(--df-text)]">
                        {rec.focusArea}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </Reveal>
          )}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-8">
              {orderedDays.map((dow, idx) => {
                const rec = placementTopics.find((p) => p.dayOfWeek === dow);
                if (!rec) return null;
                const isToday = dow === istNow.dayOfWeek;

                return (
                  <Reveal key={rec.id} delay={Math.min(0.1 + idx * 0.03, 0.4)}>
                    <Card elevated={isToday} className={cn(isToday && 'df-live-border')}>
                      <CardContent className="space-y-3.5 pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl border text-center',
                                isToday
                                  ? 'border-transparent bg-[linear-gradient(135deg,#7B72F6,#5145C8)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(109,100,240,0.85)]'
                                  : 'border-[var(--df-border)] bg-[var(--df-inset)] text-[var(--df-text-muted)]'
                              )}
                            >
                              <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                {(dayNames[dow] ?? '').slice(0, 3)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="df-eyebrow">{dayNames[dow]}</span>
                                {isToday && <Badge tone="accent">Today</Badge>}
                              </div>
                              <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.01em] text-[var(--df-text)]">
                                {rec.focusArea}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={cn('h-2 w-2 rounded-full', STAGE_DOT[rec.revisionStatus])}
                            />
                            <Select
                              value={rec.revisionStatus}
                              onChange={(e) =>
                                void updatePlacementTopic(rec.id, {
                                  revisionStatus: e.target.value as StageStatus,
                                  lastStudiedDate: istNow.dateKey,
                                })
                              }
                              aria-label={`${rec.focusArea} revision status`}
                              className="h-8 w-36 rounded-full text-xs"
                            >
                              <option value="not_started">Not started</option>
                              <option value="in_progress">In progress</option>
                              <option value="completed">Completed</option>
                            </Select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {rec.topics.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center rounded-full border border-[var(--df-border)] bg-[var(--df-inset)] px-2.5 py-0.5 text-[11px] text-[var(--df-text-muted)]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="df-hairline" />

                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          <div className="rounded-2xl df-well px-3 py-2">
                            <FieldLabel>Practice Questions</FieldLabel>
                            <Input
                              type="number"
                              min={0}
                              value={rec.practiceQuestionsCount}
                              onChange={(e) =>
                                void updatePlacementTopic(rec.id, {
                                  practiceQuestionsCount: Number(e.target.value) || 0,
                                })
                              }
                              className="h-8 font-mono-tabular text-xs"
                            />
                          </div>
                          <div className="rounded-2xl df-well px-3 py-2">
                            <FieldLabel>Interview Questions</FieldLabel>
                            <Input
                              type="number"
                              min={0}
                              value={rec.interviewQuestionsCount}
                              onChange={(e) =>
                                void updatePlacementTopic(rec.id, {
                                  interviewQuestionsCount: Number(e.target.value) || 0,
                                })
                              }
                              className="h-8 font-mono-tabular text-xs"
                            />
                          </div>
                          <div className="col-span-2 rounded-2xl df-well px-3 py-2">
                            <FieldLabel>Notes</FieldLabel>
                            <Input
                              value={rec.notes}
                              onChange={(e) =>
                                void updatePlacementTopic(rec.id, { notes: e.target.value })
                              }
                              placeholder="Key concepts, weak areas, or mock links..."
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Reveal>
                );
              })}
            </div>

            <div className="space-y-4 lg:col-span-4 lg:sticky lg:top-4">
              <Reveal delay={0.12}>
                <Card elevated>
                  <CardHeader>
                    <div className="min-w-0">
                      <p className="df-eyebrow">Quick log</p>
                      <CardTitle>Log Study / Mock Session</CardTitle>
                    </div>
                    <div className={ICON_CHIP}>
                      <Briefcase className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogPlacement} className="space-y-3">
                      <div>
                        <FieldLabel>Focus Area</FieldLabel>
                        <Select value={sessFocus} onChange={(e) => setSessFocus(e.target.value)}>
                          {placementTopics.map((p) => (
                            <option key={p.id} value={p.focusArea}>
                              {p.focusArea}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <FieldLabel>Session Type</FieldLabel>
                          <Select
                            value={sessKind}
                            onChange={(e) => setSessKind(e.target.value as PlacementSessionLog['kind'])}
                          >
                            <option value="core_cs">Core CS</option>
                            <option value="aptitude">Aptitude</option>
                            <option value="coding_assessment">Timed OA</option>
                            <option value="mock_interview">Mock Interview</option>
                            <option value="company_prep">Company Prep</option>
                          </Select>
                        </div>
                        <div>
                          <FieldLabel>Minutes</FieldLabel>
                          <Input
                            type="number"
                            min={5}
                            value={sessMins}
                            onChange={(e) => setSessMins(Number(e.target.value) || 30)}
                            className="font-mono-tabular"
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Company / Test Label (optional)</FieldLabel>
                        <Input
                          value={sessLabel}
                          onChange={(e) => setSessLabel(e.target.value)}
                          placeholder="e.g., OS Deadlocks / Timed OA #1"
                        />
                      </div>
                      <div>
                        <FieldLabel>Notes</FieldLabel>
                        <Textarea
                          value={sessNotes}
                          onChange={(e) => setSessNotes(e.target.value)}
                          placeholder="Score, bottlenecks, follow-ups..."
                        />
                      </div>
                      <Button type="submit" variant="primary" size="sm" className="w-full rounded-full">
                        <Timer className="h-4 w-4" />
                        Log Session
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </Reveal>

              <Reveal delay={0.18}>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sessions</CardTitle>
                    <span className="rounded-full border border-[#8F87FA]/30 bg-[#6D64F0]/12 px-2 py-0.5 font-mono-tabular text-[11px] text-[var(--df-accent-secondary)]">
                      {placementSessions.length}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {placementSessions.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--df-border-strong)] bg-[var(--df-inset)] px-4 py-6 text-center">
                        <div className={cn(ICON_CHIP, 'df-float')}>
                          <History className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-[var(--df-text-muted)]">
                          No placement prep sessions logged yet.
                        </p>
                      </div>
                    ) : (
                      [...placementSessions]
                        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                        .slice(0, 6)
                        .map((s, idx) => (
                          <motion.div
                            key={s.id}
                            initial={reduced ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: reduced ? 0 : Math.min(idx * 0.03, 0.4) }}
                            className="rounded-2xl df-well px-3.5 py-2.5 text-xs transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]"
                          >
                            <div className="flex justify-between gap-2 font-medium text-[var(--df-text)]">
                              <span className="min-w-0 truncate">{s.companyOrLabel || s.focusArea}</span>
                              <span className="shrink-0 rounded-full bg-[#6D64F0]/12 px-2 font-mono-tabular text-[var(--df-accent-secondary)]">
                                {s.durationMinutes}m
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] capitalize text-[var(--df-text-muted)]">
                              {formatShortDateLabel(s.dateKey)} · {s.kind.replace('_', ' ')}
                            </p>
                          </motion.div>
                        ))
                    )}
                  </CardContent>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      )}

      {/* SUMMER 2027 INTERNATIONAL INTERNSHIPS */}
      {tab === 'internships' && (
        <div className="space-y-4">
          <Reveal delay={0.08}>
            <Card elevated>
              <CardHeader>
                <div className="min-w-0">
                  <p className="df-eyebrow">Official portals</p>
                  <CardTitle>Initial Opportunity Sources</CardTitle>
                  <p className="mt-1 text-xs text-[var(--df-text-muted)]">
                    Open official portals or click &quot;Track&quot; to add an application you are targeting (no fake deadlines are invented).
                  </p>
                </div>
                <div className={ICON_CHIP}>
                  <Globe className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {INTERNSHIP_OPPORTUNITY_SOURCES.map((src) => (
                  <div
                    key={src.name}
                    className="group flex items-center justify-between gap-2 rounded-2xl df-well px-3.5 py-2.5 text-xs transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--df-text)]">{src.name}</p>
                      <p className="text-[11px] text-[var(--df-text-muted)]">{src.region}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${src.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--df-border)] text-[var(--df-text-muted)] transition-colors hover:border-[#8F87FA]/50 hover:text-[var(--df-accent-secondary)]"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openNewInternship(src.name, src.url, src.region)}
                        className="h-7 rounded-full px-2.5 text-[11px]"
                      >
                        Track
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Reveal>

          {careerChecklist.length > 0 && (
            <Reveal delay={0.11}>
              <Card>
                <CardHeader>
                  <div>
                    <p className="df-eyebrow">Readiness</p>
                    <CardTitle>Internship Application Checklist</CardTitle>
                  </div>
                  <Badge tone="accent" className="font-mono-tabular">
                    {careerChecklist.filter((c) => c.completed).length}/{careerChecklist.length}
                  </Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {careerChecklist.map((chk) => (
                    <button
                      key={chk.id}
                      type="button"
                      onClick={() => void toggleCareerChecklistItem(chk.id, chk.completed)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-left text-xs transition-all cursor-pointer',
                        chk.completed
                          ? 'border-[#22C55E]/30 bg-[#22C55E]/[0.05] text-[var(--df-text-muted)] line-through'
                          : 'df-well text-[var(--df-text)] hover:border-[#8F87FA]/45'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                          chk.completed
                            ? 'border-[#16A34A] bg-[#16A34A] text-white'
                            : 'border-[var(--df-border-strong)]'
                        )}
                      >
                        {chk.completed && <Check className="h-3 w-3" />}
                      </span>
                      <span>{chk.label}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </Reveal>
          )}

          {internships.length === 0 ? (
            <Reveal delay={0.14}>
              <EmptyState
                icon={Globe}
                title="No internship applications tracked yet"
                description="Add real opportunities from IAESTE, Aalto AScI, DAAD, EURAXESS, Mitacs, or industry portals."
                actionLabel="Add Opportunity"
                onAction={() => openNewInternship()}
              />
            </Reveal>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {internships.map((item, idx) => {
                const pill = INTERN_STATUS_STYLE[item.status] ?? INTERN_STATUS_STYLE.Interested;
                return (
                  <motion.div
                    key={item.id}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: reduced ? 0 : Math.min(idx * 0.03, 0.4), ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Card interactive className="h-full">
                      <CardContent className="space-y-3 pt-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className={cn(ICON_CHIP, 'mt-0.5')}>
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--df-text)]">
                                {item.organization} — {item.opportunityTitle}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--df-text-muted)]">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{item.country}</span>
                              </p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                              pill.pill
                            )}
                          >
                            <span className={cn('h-1.5 w-1.5 rounded-full', pill.dot)} />
                            {item.status}
                          </span>
                        </div>

                        {(item.deadline || item.stipend || item.travelFunding || item.accommodationSupport) && (
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            {item.deadline && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#F0B455]/35 bg-[#F0B455]/10 px-2.5 py-0.5 text-[#F0B455]">
                                <CalendarClock className="h-3 w-3" />
                                Deadline: {formatShortDateLabel(item.deadline)}
                              </span>
                            )}
                            {item.stipend && (
                              <span className="rounded-full df-well px-2.5 py-0.5 text-[var(--df-text-muted)]">
                                Stipend: {item.stipend}
                              </span>
                            )}
                            {item.travelFunding && (
                              <span className="rounded-full df-well px-2.5 py-0.5 text-[var(--df-text-muted)]">
                                Travel: {item.travelFunding}
                              </span>
                            )}
                            {item.accommodationSupport && (
                              <span className="rounded-full df-well px-2.5 py-0.5 text-[var(--df-text-muted)]">
                                Housing: {item.accommodationSupport}
                              </span>
                            )}
                          </div>
                        )}

                        {item.notes && (
                          <p className="line-clamp-2 text-xs leading-relaxed text-[var(--df-text-muted)]">{item.notes}</p>
                        )}

                        <div className="df-hairline" />

                        <div className="flex items-center justify-end gap-1.5">
                          {item.officialUrl && (
                            <a
                              href={item.officialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-[var(--df-border)] px-3 text-xs text-[var(--df-text)] transition-colors hover:border-[#8F87FA]/60 hover:text-[var(--df-accent-secondary)]"
                            >
                              Portal <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEditInternship(item)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteInternTarget(item)}
                            aria-label={`Delete ${item.opportunityTitle}`}
                            className="text-[var(--df-error)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* US MASTER'S — FALL 2028 */}
      {tab === 'masters' && (
        <div className="space-y-5">
          <Reveal delay={0.08}>
            <Card elevated className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgba(94,231,247,0.22),transparent)] blur-2xl"
              />
              <CardContent className="relative flex flex-wrap items-center justify-between gap-4 pt-5">
                <div className="min-w-0">
                  <p className="df-eyebrow">Target direction</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.02em] df-text-gradient">
                    {MASTERS_TARGET_DIRECTION.degree} ({MASTERS_TARGET_DIRECTION.intake})
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--df-text-muted)]">
                    <span>Specializations:</span>
                    {MASTERS_TARGET_DIRECTION.specializations.map((sp) => (
                      <span
                        key={sp}
                        className="rounded-full border border-[#8F87FA]/30 bg-[#6D64F0]/10 px-2.5 py-0.5 text-[11px] text-[var(--df-accent-secondary)]"
                      >
                        {sp}
                      </span>
                    ))}
                  </p>
                </div>
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(109,100,240,0.45),transparent)] blur-md df-breathe" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#8F87FA]/35 bg-[linear-gradient(145deg,rgba(109,100,240,0.3),rgba(94,231,247,0.08))] text-[var(--df-accent-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          {/* Editable Timeline */}
          <Reveal delay={0.12}>
            <Card>
              <CardHeader>
                <div className="min-w-0">
                  <p className="df-eyebrow">Journey</p>
                  <CardTitle>Preparation Timeline (Nov 2026 – Jun 2028)</CardTitle>
                </div>
                <div className={ICON_CHIP}>
                  <Route className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <ol className="relative space-y-3">
                  {milestones.map((m, idx) => {
                    const isLast = idx === milestones.length - 1;
                    return (
                      <motion.li
                        key={m.id}
                        initial={reduced ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: reduced ? 0 : Math.min(idx * 0.03, 0.4) }}
                        className="relative pl-8"
                      >
                        {!isLast && (
                          <span
                            aria-hidden="true"
                            className="absolute bottom-[-14px] left-[11px] top-7 w-px bg-[linear-gradient(180deg,rgba(143,135,250,0.55),rgba(94,231,247,0.15))]"
                          />
                        )}
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute left-0 top-3 flex h-6 w-6 items-center justify-center rounded-full border',
                            STAGE_NODE[m.status]
                          )}
                        >
                          {m.status === 'completed' ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          )}
                        </span>
                        <div className="grid grid-cols-1 gap-2 rounded-2xl df-well p-3 transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)] sm:grid-cols-12 sm:items-center">
                          <div className="sm:col-span-3">
                            <Input
                              value={m.period}
                              onChange={(e) =>
                                void updateMastersMilestone(m.id, { period: e.target.value })
                              }
                              aria-label="Milestone period"
                              className="h-8 font-mono-tabular text-xs text-[var(--df-accent-secondary)]"
                            />
                          </div>
                          <div className="sm:col-span-5">
                            <Input
                              value={m.goal}
                              onChange={(e) =>
                                void updateMastersMilestone(m.id, { goal: e.target.value })
                              }
                              aria-label="Milestone goal"
                              className="h-8 text-xs font-medium"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Select
                              value={m.status}
                              onChange={(e) =>
                                void updateMastersMilestone(m.id, {
                                  status: e.target.value as StageStatus,
                                })
                              }
                              aria-label="Milestone status"
                              className="h-8 rounded-full text-xs"
                            >
                              <option value="not_started">Not started</option>
                              <option value="in_progress">In progress</option>
                              <option value="completed">Completed</option>
                            </Select>
                          </div>
                          <div className="sm:col-span-2">
                            <Input
                              value={m.notes}
                              onChange={(e) =>
                                void updateMastersMilestone(m.id, { notes: e.target.value })
                              }
                              placeholder="Notes..."
                              aria-label="Milestone notes"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          </Reveal>

          {/* Universities & Application Checklist */}
          {universities.length === 0 ? (
            <Reveal delay={0.16}>
              <EmptyState
                icon={GraduationCap}
                title="No universities shortlisted yet"
                description="Add target US Master's programmes to track tuition, funding, IELTS/TOEFL/GRE/DET, SOP, LORs, and deadlines."
                actionLabel="Add University"
                onAction={openNewUniversity}
              />
            </Reveal>
          ) : (
            <div className="space-y-3">
              {universities.map((u, idx) => (
                <motion.div
                  key={u.id}
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: reduced ? 0 : Math.min(idx * 0.03, 0.4), ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card>
                    <CardContent className="space-y-3.5 pt-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className={cn(ICON_CHIP, 'mt-0.5')}>
                            <School className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--df-text)]">
                              {u.university} — {u.programme}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                              <span className="inline-flex items-center gap-1 rounded-full df-well px-2.5 py-0.5 text-[var(--df-text-muted)]">
                                <MapPin className="h-3 w-3" />
                                {u.country}
                              </span>
                              {u.tuition && (
                                <span className="rounded-full df-well px-2.5 py-0.5 text-[var(--df-text-muted)]">
                                  Tuition: {u.tuition}
                                </span>
                              )}
                              {u.funding && (
                                <span className="rounded-full df-well px-2.5 py-0.5 text-[var(--df-text-muted)]">
                                  Funding: {u.funding}
                                </span>
                              )}
                              {u.deadline && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#F0B455]/35 bg-[#F0B455]/10 px-2.5 py-0.5 text-[#F0B455]">
                                  <CalendarClock className="h-3 w-3" />
                                  Deadline: {formatShortDateLabel(u.deadline)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                              (UNI_STATUS_STYLE[u.applicationStatus] ?? UNI_STATUS_STYLE.Shortlisted).pill
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                (UNI_STATUS_STYLE[u.applicationStatus] ?? UNI_STATUS_STYLE.Shortlisted).dot
                              )}
                            />
                            {u.applicationStatus}
                          </span>
                          <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEditUniversity(u)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteUniTarget(u)}
                            aria-label={`Delete ${u.university}`}
                            className="text-[var(--df-error)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="df-hairline" />

                      <div>
                        <p className="df-eyebrow mb-2">Application checklist</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                          {(
                            [
                              ['ieltsStatus', 'IELTS'],
                              ['toeflStatus', 'TOEFL'],
                              ['greStatus', 'GRE'],
                              ['duolingoStatus', 'DET'],
                              ['sopStatus', 'SOP'],
                              ['lorStatus', 'LORs'],
                              ['transcriptsStatus', 'Transcripts'],
                              ['resumeStatus', 'Resume'],
                            ] as const
                          ).map(([field, label]) => (
                            <div
                              key={field}
                              className={cn(
                                'rounded-2xl border px-2.5 py-2 transition-colors',
                                CHECKLIST_STYLE[u[field]] ?? CHECKLIST_STYLE.not_started
                              )}
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'h-1.5 w-1.5 shrink-0 rounded-full',
                                    CHECKLIST_DOT[u[field]] ?? CHECKLIST_DOT.not_started
                                  )}
                                />
                                <FieldLabel>{label}</FieldLabel>
                              </div>
                              <Select
                                value={u[field]}
                                onChange={(e) =>
                                  void upsertUniversityTarget(
                                    {
                                      ...u,
                                      [field]: e.target.value as ChecklistState,
                                    },
                                    u.id
                                  )
                                }
                                className="h-8 rounded-full text-[11px] capitalize"
                              >
                                {CHECKLIST_STATES.map((st) => (
                                  <option key={st} value={st}>
                                    {st.replace('_', ' ')}
                                  </option>
                                ))}
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Internship Modal */}
      <Modal
        open={internModalOpen}
        onClose={() => setInternModalOpen(false)}
        title={editingIntern ? 'Edit Internship Opportunity' : 'Add Internship Opportunity'}
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={saveInternship} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Organization *</FieldLabel>
              <Input value={iOrg} onChange={(e) => setIOrg(e.target.value)} required />
            </div>
            <div>
              <FieldLabel>Opportunity Title *</FieldLabel>
              <Input value={iTitle} onChange={(e) => setITitle(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>Country</FieldLabel>
              <Input value={iCountry} onChange={(e) => setICountry(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Opening Date</FieldLabel>
              <Input type="date" value={iOpening} onChange={(e) => setIOpening(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Deadline</FieldLabel>
              <Input type="date" value={iDeadline} onChange={(e) => setIDeadline(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Official URL</FieldLabel>
              <Input value={iUrl} onChange={(e) => setIUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <Select value={iStatus} onChange={(e) => setIStatus(e.target.value as InternshipStatus)}>
                {INTERNSHIP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>Stipend</FieldLabel>
              <Input value={iStipend} onChange={(e) => setIStipend(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Travel Funding</FieldLabel>
              <Input value={iTravel} onChange={(e) => setITravel(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Accommodation</FieldLabel>
              <Input value={iAccom} onChange={(e) => setIAccom(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Eligibility</FieldLabel>
              <Input value={iEligibility} onChange={(e) => setIEligibility(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Follow-up Date</FieldLabel>
              <Input type="date" value={iFollowUp} onChange={(e) => setIFollowUp(e.target.value)} />
            </div>
          </div>
          <div>
            <FieldLabel>Required Documents (comma-separated)</FieldLabel>
            <Input value={iDocs} onChange={(e) => setIDocs(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Notes</FieldLabel>
            <Textarea value={iNotes} onChange={(e) => setINotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setInternModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* University Modal */}
      <Modal
        open={uniModalOpen}
        onClose={() => setUniModalOpen(false)}
        title={editingUni ? 'Edit Target University' : 'Add Target University'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={saveUniversity} className="space-y-3">
          <div>
            <FieldLabel>University *</FieldLabel>
            <Input value={uName} onChange={(e) => setUName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Programme</FieldLabel>
              <Input value={uProg} onChange={(e) => setUProg(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Country</FieldLabel>
              <Input value={uCountry} onChange={(e) => setUCountry(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Tuition</FieldLabel>
              <Input value={uTuition} onChange={(e) => setUTuition(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Funding Notes</FieldLabel>
              <Input value={uFunding} onChange={(e) => setUFunding(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Application Deadline</FieldLabel>
              <Input type="date" value={uDeadline} onChange={(e) => setUDeadline(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Application Status</FieldLabel>
              <Select
                value={uAppStatus}
                onChange={(e) =>
                  setUAppStatus(e.target.value as UniversityTarget['applicationStatus'])
                }
              >
                <option value="Shortlisted">Shortlisted</option>
                <option value="Preparing">Preparing</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Admitted">Admitted</option>
                <option value="Rejected">Rejected</option>
              </Select>
            </div>
          </div>
          <div>
            <FieldLabel>Notes</FieldLabel>
            <Textarea value={uNotes} onChange={(e) => setUNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setUniModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteInternTarget)}
        onClose={() => setDeleteInternTarget(null)}
        onConfirm={() => {
          if (deleteInternTarget) {
            void deleteInternship(deleteInternTarget.id);
            toast('Internship removed', { tone: 'info' });
          }
        }}
        title="Delete Opportunity"
        description={`Remove "${deleteInternTarget?.organization}"?`}
      />

      <ConfirmDialog
        open={Boolean(deleteUniTarget)}
        onClose={() => setDeleteUniTarget(null)}
        onConfirm={() => {
          if (deleteUniTarget) {
            void deleteUniversityTarget(deleteUniTarget.id);
            toast('University removed', { tone: 'info' });
          }
        }}
        title="Delete University"
        description={`Remove "${deleteUniTarget?.university}"?`}
      />
    </div>
  );
}
