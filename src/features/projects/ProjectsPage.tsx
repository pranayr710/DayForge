import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Check,
  ExternalLink,
  Flag,
  FolderGit2,
  Globe,
  ListChecks,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { db } from '@/services/storage/db';
import { useToast } from '@/app/providers/ToastProvider';
import {
  addProjectMilestone,
  addProjectTask,
  deleteProject,
  toggleProjectMilestone,
  toggleProjectTask,
  updateProjectTasksAndMilestones,
  upsertProject,
} from '@/services/storage/repositories';
import { cn, safeExternalUrl } from '@/lib/utils';
import { formatShortDateLabel } from '@/lib/dateUtils';
import { ConfirmDialog, EmptyState, PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar, ProgressRing, Reveal } from '@/components/ui/Primitives';
import type { ProjectCategory, ProjectItem, StageStatus } from '@/types';

const PROJECT_CATEGORIES: ProjectCategory[] = [
  'AI Engineering',
  'Backend / Distributed Systems',
  'AI/ML Research',
];

/** Presentation-only colour accents per project category. */
const CATEGORY_STYLE: Record<
  ProjectCategory,
  { chip: string; dot: string; line: string; text: string }
> = {
  'AI Engineering': {
    chip: 'border-[#8F87FA]/35 bg-[linear-gradient(145deg,rgba(109,100,240,0.25),rgba(167,139,250,0.08))] text-[var(--df-accent-secondary)] shadow-[0_10px_26px_-12px_rgba(109,100,240,0.9)]',
    dot: 'bg-[#8F87FA] shadow-[0_0_8px_rgba(143,135,250,0.8)]',
    line: 'bg-[linear-gradient(90deg,transparent,rgba(143,135,250,0.8),transparent)]',
    text: 'text-[var(--df-accent-secondary)]',
  },
  'Backend / Distributed Systems': {
    chip: 'border-[#5EE7F7]/35 bg-[linear-gradient(145deg,rgba(94,231,247,0.20),rgba(56,189,248,0.06))] text-[var(--df-cyan)] shadow-[0_10px_26px_-12px_rgba(94,231,247,0.7)]',
    dot: 'bg-[#5EE7F7] shadow-[0_0_8px_rgba(94,231,247,0.8)]',
    line: 'bg-[linear-gradient(90deg,transparent,rgba(94,231,247,0.75),transparent)]',
    text: 'text-[var(--df-cyan)]',
  },
  'AI/ML Research': {
    chip: 'border-[#F59AC8]/35 bg-[linear-gradient(145deg,rgba(245,154,200,0.20),rgba(167,139,250,0.08))] text-[var(--df-pink)] shadow-[0_10px_26px_-12px_rgba(245,154,200,0.7)]',
    dot: 'bg-[#F59AC8] shadow-[0_0_8px_rgba(245,154,200,0.8)]',
    line: 'bg-[linear-gradient(90deg,transparent,rgba(245,154,200,0.75),transparent)]',
    text: 'text-[var(--df-pink)]',
  },
};

const ACTIVE_PILL =
  'border-transparent bg-[linear-gradient(135deg,#7B72F6,#5145C8)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(109,100,240,0.85)]';

export default function ProjectsPage() {
  const projects = useLiveQuery(() => db.projects.toArray(), []) ?? [];
  const { toast } = useToast();

  const [catFilter, setCatFilter] = useState<ProjectCategory | 'All'>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('AI Engineering');
  const [isPrimary, setIsPrimary] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [techStack, setTechStack] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [docStatus, setDocStatus] = useState<StageStatus>('not_started');
  const [testStatus, setTestStatus] = useState<StageStatus>('not_started');

  const [newTaskInput, setNewTaskInput] = useState<Record<string, string>>({});
  const [newMilestoneInput, setNewMilestoneInput] = useState<Record<string, string>>({});

  function openNewModal() {
    setEditing(null);
    setName('');
    setDescription('');
    setCategory('AI Engineering');
    setIsPrimary(projects.length === 0);
    setGithubUrl('');
    setDeploymentUrl('');
    setTechStack('TypeScript, React, PostgreSQL');
    setStartDate('');
    setTargetDate('');
    setDocStatus('not_started');
    setTestStatus('not_started');
    setModalOpen(true);
  }

  function openEditModal(proj: ProjectItem) {
    setEditing(proj);
    setName(proj.name);
    setDescription(proj.description);
    setCategory(proj.category);
    setIsPrimary(proj.isPrimary);
    setGithubUrl(proj.githubUrl ?? '');
    setDeploymentUrl(proj.deploymentUrl ?? '');
    setTechStack(proj.techStack.join(', '));
    setStartDate(proj.startDate ?? '');
    setTargetDate(proj.targetCompletionDate ?? '');
    setDocStatus(proj.documentationStatus);
    setTestStatus(proj.testingStatus);
    setModalOpen(true);
  }

  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await upsertProject(
      {
        name: name.trim(),
        description: description.trim(),
        category,
        isPrimary,
        githubUrl: githubUrl.trim() || undefined,
        deploymentUrl: deploymentUrl.trim() || undefined,
        techStack: techStack
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        startDate: startDate || undefined,
        targetCompletionDate: targetDate || undefined,
        tasks: editing?.tasks ?? [],
        milestones: editing?.milestones ?? [],
        documentationStatus: docStatus,
        testingStatus: testStatus,
      },
      editing?.id
    );
    toast(editing ? 'Project updated' : 'Project created', { tone: 'success' });
    setModalOpen(false);
  }

  const filtered = [...projects]
    .filter((p) => catFilter === 'All' || p.category === catFilter)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        subtitle="Track engineering builds, milestones, documentation, and testing status"
        actions={
          <Button variant="primary" size="sm" className="rounded-full" onClick={openNewModal}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        }
      />

      <Reveal delay={0.03}>
        <div className="flex flex-wrap gap-1.5">
          {(['All', ...PROJECT_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCatFilter(cat)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 cursor-pointer',
                catFilter === cat
                  ? ACTIVE_PILL
                  : 'border-[var(--df-border)] bg-[var(--df-inset)] text-[var(--df-text-muted)] backdrop-blur-md hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)] hover:text-[var(--df-text)]'
              )}
            >
              {cat !== 'All' && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    catFilter === cat ? 'bg-white shadow-[0_0_6px_white]' : CATEGORY_STYLE[cat].dot
                  )}
                />
              )}
              {cat}
            </button>
          ))}
        </div>
      </Reveal>

      {filtered.length === 0 ? (
        <Reveal delay={0.08}>
          <EmptyState
            icon={FolderGit2}
            title="No projects tracked yet"
            description="Add your AI Engineering, Backend / Distributed Systems, or AI/ML Research projects to track tasks and milestones."
            actionLabel="Create First Project"
            onAction={openNewModal}
          />
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((proj, projIdx) => {
            const totalItems = proj.tasks.length + proj.milestones.length;
            const doneItems =
              proj.tasks.filter((t) => t.completed).length +
              proj.milestones.filter((m) => m.completed).length;
            const progress =
              totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
            const accent = CATEGORY_STYLE[proj.category] ?? CATEGORY_STYLE['AI Engineering'];
            const milestonesDone = proj.milestones.filter((m) => m.completed).length;
            const tasksDone = proj.tasks.filter((t) => t.completed).length;

            return (
              <Reveal key={proj.id} delay={Math.min(0.06 + projIdx * 0.05, 0.3)}>
                <Card
                  elevated={proj.isPrimary}
                  className={cn(
                    'relative h-full',
                    proj.isPrimary &&
                      'df-live-border shadow-[0_0_60px_-24px_rgba(109,100,240,0.9)]'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none absolute inset-x-8 top-0 h-px',
                      accent.line
                    )}
                  />
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
                            accent.chip
                          )}
                        >
                          <FolderGit2 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className={cn('df-eyebrow', accent.text)}>
                            {proj.isPrimary ? 'Now building' : 'Project'}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--df-text)] break-words">
                              {proj.name}
                            </h3>
                            {proj.isPrimary && (
                              <Badge tone="accent">
                                <Star className="h-3 w-3 fill-current" /> Primary Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!proj.isPrimary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full hover:text-[var(--df-warning)]"
                            onClick={() =>
                              void updateProjectTasksAndMilestones(proj.id, {
                                isPrimary: true,
                              })
                            }
                            title="Set as primary active project"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => openEditModal(proj)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(proj)}
                          aria-label={`Delete ${proj.name}`}
                          className="rounded-full text-[var(--df-error)] hover:bg-[#F06A6A]/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-[var(--df-text-muted)]">
                      {proj.description || 'No description provided.'}
                    </p>

                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <Badge tone="info">{proj.category}</Badge>
                      <Badge tone={proj.documentationStatus === 'completed' ? 'success' : 'neutral'}>
                        Docs: {proj.documentationStatus.replace('_', ' ')}
                      </Badge>
                      <Badge tone={proj.testingStatus === 'completed' ? 'success' : 'neutral'}>
                        Tests: {proj.testingStatus.replace('_', ' ')}
                      </Badge>
                      {proj.targetCompletionDate && (
                        <Badge tone="warning" className="font-mono-tabular">
                          Target: {formatShortDateLabel(proj.targetCompletionDate)}
                        </Badge>
                      )}
                    </div>

                    {proj.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {proj.techStack.map((tech, techIdx) => (
                          <span
                            key={`${tech}-${techIdx}`}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--df-border-strong)] bg-[var(--df-inset)] px-2.5 py-1 font-mono-tabular text-[10.5px] leading-none text-[var(--df-text-muted)] transition-colors hover:border-[#8F87FA]/50 hover:text-[var(--df-text)]"
                          >
                            <span aria-hidden="true" className={cn('h-1 w-1 rounded-full', accent.dot)} />
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 rounded-2xl df-well px-3.5 py-3">
                      <ProgressRing
                        value={progress}
                        size={64}
                        stroke={6}
                        label={`${proj.name} progress`}
                      >
                        <span className="font-mono-tabular text-[13px] font-semibold tracking-[-0.03em] text-[var(--df-text)]">
                          {progress}%
                        </span>
                      </ProgressRing>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-mono-tabular">
                          <span className="text-[var(--df-text-muted)]">
                            Progress ({doneItems}/{totalItems} items)
                          </span>
                          <span className="font-semibold text-[var(--df-text)]">{progress}%</span>
                        </div>
                        <ProgressBar value={progress} />
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="df-eyebrow inline-flex items-center gap-1.5">
                          <Flag className="h-3 w-3 text-[var(--df-accent-secondary)]" aria-hidden="true" />
                          Milestones
                        </p>
                        {proj.milestones.length > 0 && (
                          <span className="rounded-full border border-[var(--df-border-strong)] bg-[var(--df-inset)] px-2 py-0.5 font-mono-tabular text-[10px] text-[var(--df-text-muted)]">
                            {milestonesDone}/{proj.milestones.length}
                          </span>
                        )}
                      </div>
                      {proj.milestones.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => void toggleProjectMilestone(proj.id, m.id)}
                          className="group flex w-full items-center gap-2.5 rounded-xl df-well px-3 py-2 text-left text-xs text-[var(--df-text)] transition-all duration-300 hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)] cursor-pointer"
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all duration-300',
                              m.completed
                                ? 'border-[#22C55E] bg-[linear-gradient(135deg,#22C55E,#16A34A)] text-white shadow-[0_0_12px_rgba(34,197,94,0.7)]'
                                : 'border-[var(--df-border-strong)] group-hover:border-[#8F87FA] group-hover:shadow-[0_0_10px_rgba(143,135,250,0.6)]'
                            )}
                          >
                            {m.completed && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className={cn('min-w-0 break-words', m.completed && 'line-through text-[var(--df-text-muted)]')}>
                            {m.title}
                          </span>
                        </button>
                      ))}
                      <form
                        className="flex gap-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = (newMilestoneInput[proj.id] ?? '').trim();
                          if (!val) return;
                          void addProjectMilestone(proj.id, val);
                          setNewMilestoneInput((prev) => ({ ...prev, [proj.id]: '' }));
                        }}
                      >
                        <Input
                          value={newMilestoneInput[proj.id] ?? ''}
                          onChange={(e) =>
                            setNewMilestoneInput((prev) => ({ ...prev, [proj.id]: e.target.value }))
                          }
                          placeholder="Add milestone..."
                          className="h-8 text-xs"
                        />
                        <Button type="submit" size="sm" variant="secondary" className="rounded-full">
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      </form>
                    </div>

                    <div className="df-hairline" />

                    {/* Tasks */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="df-eyebrow inline-flex items-center gap-1.5">
                          <ListChecks className="h-3 w-3 text-[var(--df-cyan)]" aria-hidden="true" />
                          Project Tasks
                        </p>
                        {proj.tasks.length > 0 && (
                          <span className="rounded-full border border-[var(--df-border-strong)] bg-[var(--df-inset)] px-2 py-0.5 font-mono-tabular text-[10px] text-[var(--df-text-muted)]">
                            {tasksDone}/{proj.tasks.length}
                          </span>
                        )}
                      </div>
                      {proj.tasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => void toggleProjectTask(proj.id, t.id)}
                          className="group flex w-full items-center gap-2.5 rounded-xl df-well px-3 py-2 text-left text-xs text-[var(--df-text)] transition-all duration-300 hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)] cursor-pointer"
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all duration-300',
                              t.completed
                                ? 'border-[#22C55E] bg-[linear-gradient(135deg,#22C55E,#16A34A)] text-white shadow-[0_0_12px_rgba(34,197,94,0.7)]'
                                : 'border-[var(--df-border-strong)] group-hover:border-[#8F87FA] group-hover:shadow-[0_0_10px_rgba(143,135,250,0.6)]'
                            )}
                          >
                            {t.completed && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className={cn('min-w-0 break-words', t.completed && 'line-through text-[var(--df-text-muted)]')}>
                            {t.title}
                          </span>
                        </button>
                      ))}
                      <form
                        className="flex gap-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = (newTaskInput[proj.id] ?? '').trim();
                          if (!val) return;
                          void addProjectTask(proj.id, val);
                          setNewTaskInput((prev) => ({ ...prev, [proj.id]: '' }));
                        }}
                      >
                        <Input
                          value={newTaskInput[proj.id] ?? ''}
                          onChange={(e) =>
                            setNewTaskInput((prev) => ({ ...prev, [proj.id]: e.target.value }))
                          }
                          placeholder="Add project task..."
                          className="h-8 text-xs"
                        />
                        <Button type="submit" size="sm" variant="secondary" className="rounded-full">
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      </form>
                    </div>

                    {(safeExternalUrl(proj.githubUrl) || safeExternalUrl(proj.deploymentUrl)) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {safeExternalUrl(proj.githubUrl) && (
                          <a
                            href={safeExternalUrl(proj.githubUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-1.5 rounded-full df-well px-3.5 py-1.5 text-xs font-medium text-[var(--df-text)] transition-all duration-300 hover:border-[#8F87FA]/60 hover:bg-[var(--df-secondary)] hover:shadow-[0_0_18px_-6px_rgba(109,100,240,0.8)]"
                          >
                            <FolderGit2 className="h-3.5 w-3.5 text-[var(--df-accent-secondary)]" aria-hidden="true" />
                            GitHub <ExternalLink className="h-3 w-3 opacity-60 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
                          </a>
                        )}
                        {safeExternalUrl(proj.deploymentUrl) && (
                          <a
                            href={safeExternalUrl(proj.deploymentUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-1.5 rounded-full border border-[#5EE7F7]/35 bg-[#5EE7F7]/10 px-3.5 py-1.5 text-xs font-medium text-[var(--df-cyan)] transition-all duration-300 hover:border-[#5EE7F7]/60 hover:shadow-[0_0_18px_-6px_rgba(94,231,247,0.8)]"
                          >
                            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                            Live URL <ExternalLink className="h-3 w-3 opacity-60 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* Create/Edit Project Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Project' : 'Create Project'}
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSaveProject} className="space-y-3">
          <div>
            <FieldLabel>Project Name *</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Category</FieldLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
              >
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel>Tech Stack (comma-separated)</FieldLabel>
              <Input value={techStack} onChange={(e) => setTechStack(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>GitHub URL</FieldLabel>
              <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div>
              <FieldLabel>Deployment URL</FieldLabel>
              <Input value={deploymentUrl} onChange={(e) => setDeploymentUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <FieldLabel>Start Date</FieldLabel>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Target Date</FieldLabel>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Documentation</FieldLabel>
              <Select value={docStatus} onChange={(e) => setDocStatus(e.target.value as StageStatus)}>
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Testing</FieldLabel>
              <Select value={testStatus} onChange={(e) => setTestStatus(e.target.value as StageStatus)}>
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--df-text)] cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="accent-[#635BDB]"
            />
            Set as Primary Active Project
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Project
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteProject(deleteTarget.id);
            toast('Project deleted', { tone: 'info' });
          }
        }}
        title="Delete Project"
        description={`Delete "${deleteTarget?.name}" and its tasks/milestones?`}
      />
    </div>
  );
}
