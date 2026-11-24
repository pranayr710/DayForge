import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Check,
  ExternalLink,
  FolderGit2,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { db } from '@/services/storage/db';
import { useToast } from '@/app/providers/ToastProvider';
import {
  deleteProject,
  updateProjectTasksAndMilestones,
  upsertProject,
} from '@/services/storage/repositories';
import { createId, cn } from '@/lib/utils';
import { formatShortDateLabel } from '@/lib/dateUtils';
import { ConfirmDialog, EmptyState, PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/Primitives';
import type { ProjectCategory, ProjectItem, StageStatus } from '@/types';

const PROJECT_CATEGORIES: ProjectCategory[] = [
  'AI Engineering',
  'Backend / Distributed Systems',
  'AI/ML Research',
];

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
          <Button variant="primary" size="sm" onClick={openNewModal}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {(['All', ...PROJECT_CATEGORIES] as const).map((cat) => (
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No projects tracked yet"
          description="Add your AI Engineering, Backend / Distributed Systems, or AI/ML Research projects to track tasks and milestones."
          actionLabel="Create First Project"
          onAction={openNewModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((proj) => {
            const totalItems = proj.tasks.length + proj.milestones.length;
            const doneItems =
              proj.tasks.filter((t) => t.completed).length +
              proj.milestones.filter((m) => m.completed).length;
            const progress =
              totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

            return (
              <Card
                key={proj.id}
                className={cn(proj.isPrimary && 'border-[#635BDB]')}
              >
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--df-text)]">
                          {proj.name}
                        </h3>
                        {proj.isPrimary && (
                          <Badge tone="accent">
                            <Star className="h-3 w-3" /> Primary Active
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[var(--df-text-muted)]">
                        {proj.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!proj.isPrimary && (
                        <Button
                          variant="ghost"
                          size="sm"
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
                      <Button variant="outline" size="sm" onClick={() => openEditModal(proj)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(proj)}
                        aria-label={`Delete ${proj.name}`}
                        className="text-[#E05252]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

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
                    <div className="flex flex-wrap gap-1">
                      {proj.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded border border-[var(--df-border)] bg-[var(--df-bg)] px-2 py-0.5 text-[11px] text-[var(--df-text-muted)]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="mb-1 flex justify-between text-xs font-mono-tabular">
                      <span className="text-[var(--df-text-muted)]">
                        Progress ({doneItems}/{totalItems} items)
                      </span>
                      <span className="text-[var(--df-text)]">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} />
                  </div>

                  {/* Milestones */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-[var(--df-text)]">Milestones</p>
                    {proj.milestones.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          void updateProjectTasksAndMilestones(proj.id, {
                            milestones: proj.milestones.map((item) =>
                              item.id === m.id ? { ...item, completed: !item.completed } : item
                            ),
                          })
                        }
                        className="flex w-full items-center gap-2 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)] px-2.5 py-1.5 text-left text-xs cursor-pointer"
                      >
                        <span
                          className={cn(
                            'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border',
                            m.completed
                              ? 'border-[#16A34A] bg-[#16A34A] text-white'
                              : 'border-[var(--df-text-muted)]/50'
                          )}
                        >
                          {m.completed && <Check className="h-2.5 w-2.5" />}
                        </span>
                        <span className={cn(m.completed && 'line-through text-[var(--df-text-muted)]')}>
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
                        void updateProjectTasksAndMilestones(proj.id, {
                          milestones: [
                            ...proj.milestones,
                            { id: createId('pm'), title: val, completed: false },
                          ],
                        });
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
                      <Button type="submit" size="sm" variant="secondary">
                        Add
                      </Button>
                    </form>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-[var(--df-text)]">Project Tasks</p>
                    {proj.tasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          void updateProjectTasksAndMilestones(proj.id, {
                            tasks: proj.tasks.map((item) =>
                              item.id === t.id ? { ...item, completed: !item.completed } : item
                            ),
                          })
                        }
                        className="flex w-full items-center gap-2 rounded-lg border border-[var(--df-border)] bg-[var(--df-bg)] px-2.5 py-1.5 text-left text-xs cursor-pointer"
                      >
                        <span
                          className={cn(
                            'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border',
                            t.completed
                              ? 'border-[#16A34A] bg-[#16A34A] text-white'
                              : 'border-[var(--df-text-muted)]/50'
                          )}
                        >
                          {t.completed && <Check className="h-2.5 w-2.5" />}
                        </span>
                        <span className={cn(t.completed && 'line-through text-[var(--df-text-muted)]')}>
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
                        void updateProjectTasksAndMilestones(proj.id, {
                          tasks: [
                            ...proj.tasks,
                            { id: createId('pt'), title: val, completed: false },
                          ],
                        });
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
                      <Button type="submit" size="sm" variant="secondary">
                        Add
                      </Button>
                    </form>
                  </div>

                  {(proj.githubUrl || proj.deploymentUrl) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--df-border)] px-2.5 py-1 text-xs text-[var(--df-text)] hover:border-[#635BDB]"
                        >
                          GitHub <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {proj.deploymentUrl && (
                        <a
                          href={proj.deploymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--df-border)] px-2.5 py-1 text-xs text-[var(--df-text)] hover:border-[#635BDB]"
                        >
                          Live URL <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
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
