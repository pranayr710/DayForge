import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Briefcase,
  ExternalLink,
  Globe,
  GraduationCap,
  Plus,
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
import { SegmentedTabs } from '@/components/ui/Primitives';
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

export default function CareerPage() {
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const placementTopics = useLiveQuery(() => db.placementTopics.toArray(), []) ?? [];
  const placementSessions = useLiveQuery(() => db.placementSessions.toArray(), []) ?? [];
  const internships = useLiveQuery(() => db.internshipApplications.toArray(), []) ?? [];
  const milestones = useLiveQuery(() => db.mastersMilestones.orderBy('order').toArray(), []) ?? [];
  const universities = useLiveQuery(() => db.universities.toArray(), []) ?? [];

  const istNow = useIstClock(profile?.timezone ?? 'Asia/Kolkata');
  const { toast } = useToast();
  const [tab, setTab] = useState<CareerTab>('placement');

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
            <Button variant="primary" size="sm" onClick={() => openNewInternship()}>
              <Plus className="h-4 w-4" />
              Add Opportunity
            </Button>
          ) : tab === 'masters' ? (
            <Button variant="primary" size="sm" onClick={openNewUniversity}>
              <Plus className="h-4 w-4" />
              Add University
            </Button>
          ) : undefined
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'placement', label: 'Placement Prep', count: placementSessions.length },
          { value: 'internships', label: 'Summer 2027 Internships', count: internships.length },
          { value: 'masters', label: "US Master's (Fall 2028)", count: universities.length },
        ]}
      />

      {/* PLACEMENT PREP */}
      {tab === 'placement' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="space-y-3 lg:col-span-8">
            {orderedDays.map((dow) => {
              const rec = placementTopics.find((p) => p.dayOfWeek === dow);
              if (!rec) return null;
              const isToday = dow === istNow.dayOfWeek;

              return (
                <Card key={rec.id} className={cn(isToday && 'border-[#635BDB]')}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--df-text)]">
                          {dayNames[dow]}: {rec.focusArea}
                        </span>
                        {isToday && <Badge tone="accent">Today</Badge>}
                      </div>
                      <Select
                        value={rec.revisionStatus}
                        onChange={(e) =>
                          void updatePlacementTopic(rec.id, {
                            revisionStatus: e.target.value as StageStatus,
                            lastStudiedDate: istNow.dateKey,
                          })
                        }
                        aria-label={`${rec.focusArea} revision status`}
                        className="w-36 h-8 text-xs"
                      >
                        <option value="not_started">Not started</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                      </Select>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {rec.topics.map((t) => (
                        <Badge key={t} tone="neutral">
                          {t}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
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
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
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
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
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
              );
            })}
          </div>

          <div className="space-y-4 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Log Study / Mock Session</CardTitle>
                <Briefcase className="h-4 w-4 text-[#8178F5]" />
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
                  <Button type="submit" variant="primary" size="sm" className="w-full">
                    Log Session
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {placementSessions.length === 0 ? (
                  <p className="text-xs text-[var(--df-text-muted)]">
                    No placement prep sessions logged yet.
                  </p>
                ) : (
                  [...placementSessions]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .slice(0, 6)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)] px-3 py-2 text-xs"
                      >
                        <div className="flex justify-between font-medium text-[var(--df-text)]">
                          <span>{s.companyOrLabel || s.focusArea}</span>
                          <span className="font-mono-tabular text-[#8178F5]">
                            {s.durationMinutes}m
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--df-text-muted)]">
                          {formatShortDateLabel(s.dateKey)} · {s.kind.replace('_', ' ')}
                        </p>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* SUMMER 2027 INTERNATIONAL INTERNSHIPS */}
      {tab === 'internships' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Initial Opportunity Sources</CardTitle>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Open official portals or click &quot;Track&quot; to add an application you are targeting (no fake deadlines are invented).
                </p>
              </div>
              <Globe className="h-4 w-4 text-[#8178F5]" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {INTERNSHIP_OPPORTUNITY_SOURCES.map((src) => (
                <div
                  key={src.name}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)] p-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--df-text)] truncate">{src.name}</p>
                    <p className="text-[11px] text-[var(--df-text-muted)]">{src.region}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${src.name}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-[var(--df-border)] text-[var(--df-text-muted)] hover:text-[#8178F5]"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openNewInternship(src.name, src.url, src.region)}
                      className="h-7 px-2 text-[11px]"
                    >
                      Track
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {internships.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No internship applications tracked yet"
              description="Add real opportunities from IAESTE, Aalto AScI, DAAD, EURAXESS, Mitacs, or industry portals."
              actionLabel="Add Opportunity"
              onAction={() => openNewInternship()}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {internships.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--df-text)] truncate">
                          {item.organization} — {item.opportunityTitle}
                        </p>
                        <p className="text-xs text-[var(--df-text-muted)]">
                          {item.country}
                          {item.deadline ? ` · Deadline: ${formatShortDateLabel(item.deadline)}` : ''}
                        </p>
                      </div>
                      <Badge
                        tone={
                          item.status === 'Accepted'
                            ? 'success'
                            : item.status === 'Interview' || item.status === 'Applied'
                              ? 'accent'
                              : item.status === 'Rejected'
                                ? 'error'
                                : 'neutral'
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px] text-[var(--df-text-muted)]">
                      {item.stipend && <Badge tone="neutral">Stipend: {item.stipend}</Badge>}
                      {item.travelFunding && <Badge tone="neutral">Travel: {item.travelFunding}</Badge>}
                      {item.accommodationSupport && (
                        <Badge tone="neutral">Housing: {item.accommodationSupport}</Badge>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-[var(--df-text-muted)] line-clamp-2">{item.notes}</p>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      {item.officialUrl && (
                        <a
                          href={item.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--df-border)] px-2.5 text-xs text-[var(--df-text)] hover:border-[#635BDB]"
                        >
                          Portal <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEditInternship(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteInternTarget(item)}
                        aria-label={`Delete ${item.opportunityTitle}`}
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

      {/* US MASTER'S — FALL 2028 */}
      {tab === 'masters' && (
        <div className="space-y-5">
          <Card elevated>
            <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--df-text)]">
                  {MASTERS_TARGET_DIRECTION.degree} ({MASTERS_TARGET_DIRECTION.intake})
                </p>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Specializations: {MASTERS_TARGET_DIRECTION.specializations.join(' · ')}
                </p>
              </div>
              <GraduationCap className="h-5 w-5 text-[#8178F5]" />
            </CardContent>
          </Card>

          {/* Editable Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Preparation Timeline (Nov 2026 – Jun 2028)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)]/70 p-3 sm:grid-cols-12 sm:items-center"
                >
                  <div className="sm:col-span-3">
                    <Input
                      value={m.period}
                      onChange={(e) =>
                        void updateMastersMilestone(m.id, { period: e.target.value })
                      }
                      aria-label="Milestone period"
                      className="h-8 font-mono-tabular text-xs"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <Input
                      value={m.goal}
                      onChange={(e) =>
                        void updateMastersMilestone(m.id, { goal: e.target.value })
                      }
                      aria-label="Milestone goal"
                      className="h-8 text-xs"
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
                      className="h-8 text-xs"
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
              ))}
            </CardContent>
          </Card>

          {/* Universities & Application Checklist */}
          {universities.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No universities shortlisted yet"
              description="Add target US Master's programmes to track tuition, funding, IELTS/TOEFL/GRE/DET, SOP, LORs, and deadlines."
              actionLabel="Add University"
              onAction={openNewUniversity}
            />
          ) : (
            <div className="space-y-3">
              {universities.map((u) => (
                <Card key={u.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--df-text)]">
                          {u.university} — {u.programme}
                        </p>
                        <p className="text-xs text-[var(--df-text-muted)]">
                          {u.country}
                          {u.tuition ? ` · Tuition: ${u.tuition}` : ''}
                          {u.funding ? ` · Funding: ${u.funding}` : ''}
                          {u.deadline ? ` · Deadline: ${formatShortDateLabel(u.deadline)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge tone="accent">{u.applicationStatus}</Badge>
                        <Button variant="outline" size="sm" onClick={() => openEditUniversity(u)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteUniTarget(u)}
                          aria-label={`Delete ${u.university}`}
                          className="text-[#E05252]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

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
                        <div key={field}>
                          <FieldLabel>{label}</FieldLabel>
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
                            className="h-8 text-[11px]"
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
                  </CardContent>
                </Card>
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
