import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  Upload,
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
import { ConfirmDialog, PageHeader } from '@/components/shared/SharedComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select } from '@/components/ui/FormControls';
import type { ThemeMode } from '@/types';

export default function SettingsPage() {
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const online = useOnlineStatus();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        <Card>
          <CardHeader>
            <CardTitle>Profile &amp; Academic Configuration</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Appearance, Timezone &amp; Schedule Preferences</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

            <label className="flex items-center gap-2 text-xs text-[var(--df-text)] sm:col-span-3 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="accent-[#635BDB]"
              />
              Enable in-app schedule reminders (local preference)
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management &amp; Backups</CardTitle>
          <Database className="h-4 w-4 text-[#8178F5]" />
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-[var(--df-text-muted)]">
            All schedules, tasks, DSA logs, curriculum progress, projects, and career entries are stored locally in IndexedDB. Export a JSON snapshot anytime.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => void handleExport()}>
              <Download className="h-4 w-4" />
              Export JSON Backup
            </Button>
            <Button
              variant="outline"
              size="sm"
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
            <Button
              variant="danger"
              size="sm"
              onClick={() => setResetConfirmOpen(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Reset Recurring Timetable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About DayForge */}
      <Card>
        <CardHeader>
          <CardTitle>About DayForge</CardTitle>
          <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-[var(--df-text-muted)]">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">DayForge v1.0.0</Badge>
            <Badge tone={online ? 'success' : 'warning'}>
              {online ? 'Online · Local DB Active' : 'Offline · Local DB Active'}
            </Badge>
            <Badge tone="neutral">Sync: Local-only (Phase 1)</Badge>
          </div>
          <p>
            <strong>Tagline:</strong> Plan your day. Build your future.
          </p>
          <p>
            Offline-first PWA powered by React 19, TypeScript, Vite, Tailwind CSS, and IndexedDB (Dexie). Cloud synchronization via Supabase is architected at the service boundary for Phase 2 and is not yet active.
          </p>
        </CardContent>
      </Card>

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
