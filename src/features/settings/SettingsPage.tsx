import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  Database,
  Download,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Sun,
  Upload,
  UserRound,
} from 'lucide-react';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID } from '@/config/personalPlan';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useToast } from '@/app/providers/ToastProvider';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  exportDayForgeBackup,
  importDayForgeBackup,
  updateUserProfile,
} from '@/services/storage/repositories';
import { resetRecurringTemplatesToDefaults } from '@/services/storage/seed';
import { backupPayloadSchema } from '@/lib/validations';
import { ConfirmDialog, DayForgeLogo, PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select } from '@/components/ui/FormControls';
import { Reveal } from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/types';

const ICON_CHIP =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#8F87FA]/30 bg-[#6D64F0]/12 text-[var(--df-accent-secondary)]';

/** Purely decorative preview of the theme options (selection still happens via the Select). */
const THEME_PREVIEW: { value: ThemeMode; label: string; icon: typeof Moon; swatch: string }[] = [
  { value: 'dark', label: 'Dark', icon: Moon, swatch: 'bg-[linear-gradient(135deg,#1B1D33,#0B0C16)]' },
  { value: 'light', label: 'Light', icon: Sun, swatch: 'bg-[linear-gradient(135deg,#FFFFFF,#E7E8F3)]' },
  { value: 'system', label: 'System', icon: Monitor, swatch: 'bg-[linear-gradient(135deg,#1B1D33_50%,#E7E8F3_50%)]' },
];

export default function SettingsPage() {
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const online = useOnlineStatus();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reduced = useReducedMotion();

  const [displayName, setDisplayName] = useState('');
  const [institution, setInstitution] = useState('');
  const [programme, setProgramme] = useState('');
  const [semester, setSemester] = useState('');
  const [electiveThreeName, setElectiveThreeName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>('monday');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setInstitution(profile.institution);
    setProgramme(profile.academicProgramme);
    setSemester(profile.semester);
    setElectiveThreeName(profile.electiveThreeName);
    setTimezone(profile.timezone);
    setWeekStartsOn(profile.weekStartsOn);
    setNotificationsEnabled(profile.notificationsEnabled);
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    await updateUserProfile({
      displayName: displayName.trim() || 'Sujith',
      institution: institution.trim(),
      academicProgramme: programme.trim(),
      semester: semester.trim(),
      electiveThreeName: electiveThreeName.trim() || 'Professional Elective III',
      timezone: timezone.trim() || 'Asia/Kolkata',
      weekStartsOn,
      notificationsEnabled,
    });
    toast('Settings saved locally', { tone: 'success' });
  }

  async function handleExport() {
    const payload = await exportDayForgeBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dayforge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup exported as JSON', { tone: 'success' });
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = backupPayloadSchema.parse(JSON.parse(text));
      await importDayForgeBackup(parsed as never);
      toast('Backup restored successfully', { tone: 'success' });
    } catch (err) {
      toast('Invalid backup file', {
        description: err instanceof Error ? err.message : 'Schema validation failed',
        tone: 'error',
      });
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Profile, theme, IST schedule preferences, local IndexedDB backups, and system info"
      />

      <form onSubmit={handleSaveProfile} className="space-y-5">
        <Reveal delay={0.05}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className={ICON_CHIP} aria-hidden="true">
                  <UserRound className="h-4 w-4" />
                </span>
                <div>
                  <p className="df-eyebrow">Identity</p>
                  <CardTitle className="mt-0.5">Profile &amp; Academic Configuration</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="set-name">Display Name</FieldLabel>
                <Input
                  id="set-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="set-sem">Current Semester</FieldLabel>
                <Input
                  id="set-sem"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="set-prog">Programme</FieldLabel>
                <Input
                  id="set-prog"
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="set-inst">Institution</FieldLabel>
                <Input
                  id="set-inst"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="set-elective">
                  Professional Elective III Label (updates timetable dynamically)
                </FieldLabel>
                <Input
                  id="set-elective"
                  value={electiveThreeName}
                  onChange={(e) => setElectiveThreeName(e.target.value)}
                  placeholder="Professional Elective III"
                />
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className={ICON_CHIP} aria-hidden="true">
                  <Palette className="h-4 w-4" />
                </span>
                <div>
                  <p className="df-eyebrow">Preferences</p>
                  <CardTitle className="mt-0.5">Appearance, Timezone &amp; Schedule Preferences</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 rounded-2xl df-well p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div>
                    <FieldLabel htmlFor="set-theme">Theme</FieldLabel>
                    <Select
                      id="set-theme"
                      value={theme}
                      onChange={(e) => void setTheme(e.target.value as ThemeMode)}
                    >
                      <option value="dark">Dark (Default)</option>
                      <option value="light">Light</option>
                      <option value="system">System</option>
                    </Select>
                  </div>
                  {/* Decorative preview of the active theme */}
                  <div aria-hidden="true" className="flex items-center gap-2">
                    {THEME_PREVIEW.map((opt) => {
                      const active = theme === opt.value;
                      const Icon = opt.icon;
                      return (
                        <div
                          key={opt.value}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-all duration-300',
                            active
                              ? 'border-[#8F87FA]/60 bg-[#6D64F0]/10 shadow-[0_0_20px_-8px_rgba(109,100,240,0.9)]'
                              : 'border-[var(--df-border)] opacity-60'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-7 w-11 items-center justify-center rounded-lg border border-[var(--df-border-strong)]',
                              opt.swatch
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-3 w-3',
                                opt.value === 'light' ? 'text-[#5145C8]' : 'text-[#A59FFB]'
                              )}
                            />
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-medium',
                              active ? 'text-[var(--df-accent-secondary)]' : 'text-[var(--df-text-muted)]'
                            )}
                          >
                            {opt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="set-tz">Timezone</FieldLabel>
                <Select
                  id="set-tz"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                </Select>
              </div>
              <div>
                <FieldLabel htmlFor="set-week">Week Starts On</FieldLabel>
                <Select
                  id="set-week"
                  value={weekStartsOn}
                  onChange={(e) =>
                    setWeekStartsOn(e.target.value as 'monday' | 'sunday')
                  }
                >
                  <option value="monday">Monday</option>
                  <option value="sunday">Sunday</option>
                </Select>
              </div>

              <label className="flex items-center gap-3 rounded-2xl df-well px-3.5 py-3 text-xs text-[var(--df-text)] sm:col-span-2 cursor-pointer transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-300',
                    notificationsEnabled
                      ? 'border-[var(--df-success)]/50 bg-[var(--df-success)]/15 text-[var(--df-success)] shadow-[0_0_12px_rgba(34,197,94,0.45)]'
                      : 'border-[var(--df-border)] text-[var(--df-text-muted)]'
                  )}
                >
                  <Bell className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">Enable in-app schedule reminders (local preference)</span>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#635BDB]"
                />
              </label>
            </CardContent>
          </Card>
        </Reveal>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" className="rounded-full">
            <Save className="h-4 w-4" />
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Data Management */}
      <Reveal delay={0.15}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className={ICON_CHIP} aria-hidden="true">
                <Database className="h-4 w-4" />
              </span>
              <div>
                <p className="df-eyebrow">Local data</p>
                <CardTitle className="mt-0.5">Data Management &amp; Backups</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--df-text-muted)]">
              All schedules, tasks, DSA logs, curriculum progress, projects, and career entries are stored locally in IndexedDB. Export a JSON snapshot anytime.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Export tile */}
              <div className="flex flex-col justify-between gap-3 rounded-2xl df-well p-3.5 transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]">
                <div className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--df-cyan)]/30 bg-[var(--df-cyan)]/10 text-[var(--df-cyan)]"
                  >
                    <Download className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--df-text)]">Export</p>
                    <p className="text-[11px] text-[var(--df-text-muted)]">Download a full JSON snapshot.</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full rounded-full"
                  onClick={() => void handleExport()}
                >
                  <Download className="h-4 w-4" />
                  Export JSON Backup
                </Button>
              </div>

              {/* Import tile */}
              <div className="flex flex-col justify-between gap-3 rounded-2xl df-well p-3.5 transition-all hover:border-[var(--df-border-strong)] hover:bg-[var(--df-secondary)]">
                <div className="flex items-start gap-2.5">
                  <span aria-hidden="true" className={ICON_CHIP}>
                    <Upload className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--df-text)]">Import</p>
                    <p className="text-[11px] text-[var(--df-text-muted)]">Restore from a DayForge backup file.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Import JSON Backup
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>

              {/* Reset tile */}
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--df-error)]/25 bg-[var(--df-error)]/[0.06] p-3.5 transition-all hover:border-[var(--df-error)]/45">
                <div className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--df-error)]/30 bg-[var(--df-error)]/10 text-[var(--df-error)]"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--df-text)]">Reset</p>
                    <p className="text-[11px] text-[var(--df-text-muted)]">Restore default recurring templates.</p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full rounded-full"
                  onClick={() => setResetConfirmOpen(true)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Recurring Timetable
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* About DayForge */}
      <Reveal delay={0.2}>
        <Card elevated className="relative overflow-hidden">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(109,100,240,0.35),transparent)] blur-2xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(94,231,247,0.18),transparent)] blur-2xl"
          />
          <CardHeader>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className={ICON_CHIP}>
                <ShieldCheck className="h-4 w-4 text-[var(--df-success)]" />
              </span>
              <div>
                <p className="df-eyebrow">System</p>
                <CardTitle className="mt-0.5">About DayForge</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3 text-xs text-[var(--df-text-muted)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <motion.span
                className="relative inline-flex shrink-0 self-start sm:self-center"
                initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  aria-hidden="true"
                  className="absolute -inset-3 rounded-3xl bg-[radial-gradient(closest-side,rgba(109,100,240,0.6),transparent)] blur-md df-breathe"
                />
                <DayForgeLogo className="relative h-14 w-14" />
              </motion.span>
              <div className="min-w-0 space-y-2">
                <p className="text-lg font-semibold tracking-[-0.03em] df-text-gradient">DayForge</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">DayForge v1.0.0</Badge>
                  <Badge tone={online ? 'success' : 'warning'}>
                    {online ? 'Online · Local DB Active' : 'Offline · Local DB Active'}
                  </Badge>
                  <Badge tone="neutral">Sync: Local-only (Phase 1)</Badge>
                </div>
              </div>
            </div>
            <div className="df-hairline" />
            <p>
              <strong className="text-[var(--df-text)]">Tagline:</strong> Plan your day. Build your future.
            </p>
            <p className="leading-relaxed">
              Offline-first PWA powered by React 19, TypeScript, Vite, Tailwind CSS, and IndexedDB (Dexie). Cloud synchronization via Supabase is architected at the service boundary for Phase 2 and is not yet active.
            </p>
          </CardContent>
        </Card>
      </Reveal>

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          void resetRecurringTemplatesToDefaults().then(() => {
            toast('Recurring timetable & routine restored to defaults', {
              tone: 'info',
            });
          });
        }}
        title="Reset Recurring Timetable"
        description="Restore the Semester VI college timetable and master daily routines to their original defaults? Your tasks, DSA logs, and notes will not be affected."
        confirmLabel="Reset Templates"
      />
    </div>
  );
}
