import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Home,
  LayoutDashboard,
  MoreHorizontal,
  Settings,
  Timer,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/storage/db';
import { DEFAULT_USER_ID } from '@/config/personalPlan';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useIstClock } from '@/hooks/useIstClock';
import { useFocusTimer } from '@/app/providers/FocusProvider';
import { AuroraBackdrop, DayForgeLogo } from '@/components/shared/SharedComponents';
import { Button } from '@/components/ui/Button';
import { FocusModal } from '@/features/focus/FocusModal';
import { cn } from '@/lib/utils';

const DESKTOP_NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/learning', label: 'Learning Hub', icon: BookOpen },
  { to: '/career', label: 'Career', icon: Briefcase },
  { to: '/projects', label: 'Projects', icon: FolderGit2 },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

const MOBILE_PRIMARY_NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/learning', label: 'Learn', icon: BookOpen },
] as const;

const MOBILE_MORE_NAV = [
  { to: '/career', label: 'Career & Placements', desc: 'Placements, Summer 2027 Internships, Fall 2028 MS', icon: Briefcase },
  { to: '/projects', label: 'Projects', desc: 'AI Engineering, Backend & Research milestones', icon: FolderGit2 },
  { to: '/analytics', label: 'Analytics', desc: 'Weekly, monthly & long-term progress metrics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', desc: 'Profile, theme, IST timezone & JSON backup', icon: Settings },
] as const;

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const online = useOnlineStatus();
  const profile = useLiveQuery(() => db.userProfile.get(DEFAULT_USER_ID), []);
  const istNow = useIstClock(profile?.timezone ?? 'Asia/Kolkata');
  const { openFocus, isRunning, remainingSeconds, overtimeSeconds } = useFocusTimer();
  const location = useLocation();
  const reduced = useReducedMotion();

  const isMoreRouteActive = ['/career', '/projects', '/analytics', '/settings'].some(
    (p) => location.pathname.startsWith(p)
  );

  // Purely visual: how far through the day we are (drives the header light line).
  const dayProgressPct = Math.round((istNow.minutesFromMidnight / 1440) * 100);
  const focusClock =
    overtimeSeconds > 0
      ? `+${Math.floor(overtimeSeconds / 60)}:${String(overtimeSeconds % 60).padStart(2, '0')}`
      : `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-[100dvh] df-ambient-canvas text-[var(--df-text)] flex flex-col lg:flex-row">
      <AuroraBackdrop />

      {/* Desktop Floating Aurora-Glass Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:fixed lg:inset-y-3 lg:left-3 lg:z-40 flex-col justify-between rounded-[26px] df-glass transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          collapsed ? 'w-[76px]' : 'w-[248px]'
        )}
      >
        <div className="flex flex-col min-h-0">
          <div
            className={cn(
              'relative flex h-[72px] items-center px-4',
              collapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <NavLink to="/" className="group flex items-center gap-3 min-w-0">
              <span className="relative shrink-0">
                <span className="absolute -inset-2 rounded-2xl bg-[radial-gradient(closest-side,rgba(109,100,240,0.55),transparent)] blur-md opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
                <DayForgeLogo className="relative h-9 w-9" />
              </span>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--df-text)] truncate">
                    Day<span className="df-text-aurora">Forge</span>
                  </span>
                  <span className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--df-text-faint)] truncate">
                    {profile?.semester ?? 'Semester VI'}
                  </span>
                </div>
              )}
            </NavLink>
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
                className="h-7 w-7 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="absolute inset-x-4 bottom-0 df-hairline" />
          </div>

          {collapsed && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
                className="h-7 w-7 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!collapsed && <p className="df-eyebrow px-6 pt-5 pb-2">Workspace</p>}

          <nav className={cn('flex flex-col gap-1 px-3', collapsed && 'pt-3')} aria-label="Primary navigation">
            {DESKTOP_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'text-white'
                      : 'text-[var(--df-text-muted)] hover:text-[var(--df-text)] hover:bg-[var(--df-inset)]'
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="desktop-sidebar-pill"
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 32 }
                      }
                      className="absolute inset-0 rounded-[14px] bg-[linear-gradient(135deg,#7B72F6_0%,#635BDB_50%,#4C42C2_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_26px_-8px_rgba(109,100,240,0.85)]"
                    >
                      <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#5EE7F7] shadow-[0_0_12px_#5EE7F7]" />
                    </motion.span>
                  )}
                  <Icon
                    className={cn(
                      'relative z-10 h-[17px] w-[17px] shrink-0 transition-transform duration-300',
                      !isActive && 'group-hover:scale-110 group-hover:text-[var(--df-accent-secondary)]'
                    )}
                  />
                  {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="relative flex flex-col gap-3 p-3">
          <div className="absolute inset-x-4 top-0 df-hairline" />

          {/* Day progress widget */}
          {!collapsed && (
            <div className="rounded-2xl df-well p-3">
              <div className="flex items-center justify-between">
                <span className="df-eyebrow">Today</span>
                <span className="font-mono-tabular text-[11px] text-[var(--df-text-muted)]">
                  {dayProgressPct}%
                </span>
              </div>
              <p className="mt-1 font-mono-tabular text-lg font-semibold tracking-tight text-[var(--df-text)]">
                {istNow.formattedTime}
              </p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--df-inset)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#635BDB,#A78BFA,#5EE7F7)] shadow-[0_0_10px_rgba(143,135,250,0.7)] transition-[width] duration-1000"
                  style={{ width: `${dayProgressPct}%` }}
                />
              </div>
            </div>
          )}

          <Button
            variant={isRunning ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => openFocus()}
            className={cn('h-10 w-full justify-start rounded-xl', collapsed && 'justify-center px-0')}
          >
            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
              {isRunning && <span className="df-dot-live absolute inset-0 rounded-full text-white/70" />}
              <Timer className={cn('h-4 w-4', isRunning ? 'text-white' : 'text-[var(--df-accent-secondary)]')} />
            </span>
            {!collapsed && (
              <span className="truncate font-mono-tabular">
                {isRunning ? `Focus ${focusClock}` : 'Focus Mode'}
              </span>
            )}
          </Button>

          <div
            className={cn(
              'flex items-center gap-2 px-1.5 text-[11px] text-[var(--df-text-faint)]',
              collapsed && 'justify-center px-0'
            )}
          >
            {online ? (
              <Wifi className="h-3.5 w-3.5 text-[var(--df-success)] shrink-0" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-[var(--df-warning)] shrink-0" />
            )}
            {!collapsed && (
              <span className="truncate">
                {online ? 'Local-first · Online' : 'Offline Mode (Local DB)'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          collapsed ? 'lg:pl-[92px]' : 'lg:pl-[264px]'
        )}
      >
        {/* Mobile & Tablet Frosted Top Header */}
        <header className="sticky top-0 z-30 lg:hidden">
          <div className="flex h-14 items-center justify-between border-b border-[var(--df-border)] bg-[var(--df-secondary)] px-4 backdrop-blur-2xl backdrop-saturate-150">
            <NavLink to="/" className="flex items-center gap-2.5 min-w-0">
              <DayForgeLogo className="h-7 w-7 shrink-0" />
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--df-text)]">
                Day<span className="df-text-aurora">Forge</span>
              </span>
            </NavLink>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-full df-well px-2.5 py-1 font-mono-tabular text-[11px] text-[var(--df-text-muted)]">
                <span
                  className={cn(
                    'df-dot-live h-1.5 w-1.5 rounded-full',
                    online ? 'bg-[var(--df-success)] text-[var(--df-success)]' : 'bg-[var(--df-warning)] text-[var(--df-warning)]'
                  )}
                  title={online ? 'Online (Local-first)' : 'Offline'}
                />
                {istNow.formattedTime}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openFocus()}
                className="h-8 rounded-full px-3 text-xs"
              >
                <Timer className="h-3.5 w-3.5" />
                <span>
                  {isRunning
                    ? overtimeSeconds > 0
                      ? `+${Math.floor(overtimeSeconds / 60)}m`
                      : `${Math.floor(remainingSeconds / 60)}m`
                    : 'Focus'}
                </span>
              </Button>
            </div>
          </div>
          <div className="h-px w-full bg-[var(--df-border)]">
            <div
              className="h-px bg-[linear-gradient(90deg,transparent,#8F87FA,#5EE7F7)] shadow-[0_0_8px_#8F87FA]"
              style={{ width: `${dayProgressPct}%` }}
            />
          </div>
        </header>

        {/* Desktop Aurora Glass Top Bar */}
        <header className="hidden lg:flex h-[60px] items-center justify-between mx-6 mt-3 rounded-[20px] df-glass px-5 sticky top-3 z-30">
          <div className="flex items-center gap-3 text-xs text-[var(--df-text-muted)] min-w-0">
            <span className="flex items-center gap-2 rounded-full df-well px-3 py-1.5 shrink-0">
              <span
                className={cn(
                  'df-dot-live h-1.5 w-1.5 rounded-full',
                  online ? 'bg-[var(--df-success)] text-[var(--df-success)]' : 'bg-[var(--df-warning)] text-[var(--df-warning)]'
                )}
              />
              <span className="font-mono-tabular font-medium text-[var(--df-text)]">
                {istNow.formattedTime}
              </span>
              <span className="text-[var(--df-text-faint)]">IST</span>
            </span>
            <span className="font-medium text-[var(--df-text)] shrink-0">
              {istNow.dayName}, {istNow.formattedDate}
            </span>
            <span className="h-3.5 w-px bg-[var(--df-border-strong)]" />
            <span className="truncate text-[var(--df-text-faint)]">
              {profile?.institution ?? 'Amrita School of Computing, Coimbatore'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="primary" size="sm" onClick={() => openFocus()} className="rounded-full px-4">
              <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                {isRunning && <span className="df-dot-live absolute inset-0 rounded-full text-white/70" />}
                <Timer className="h-3.5 w-3.5" />
              </span>
              <span>{isRunning ? `Focus Active · ${focusClock}` : 'Start Focus'}</span>
            </Button>
          </div>
          {/* Day-progress light line */}
          <div className="absolute inset-x-6 bottom-0 h-px">
            <div
              className="h-px bg-[linear-gradient(90deg,transparent,#8F87FA_60%,#5EE7F7)] shadow-[0_0_10px_#8F87FA] transition-[width] duration-1000"
              style={{ width: `${dayProgressPct}%` }}
            />
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 pt-5 pb-32 sm:px-6 sm:pt-7 lg:pb-12">
          <motion.div
            key={location.pathname}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Floating Aurora-Glass Dock (5 Destinations) */}
      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[24px] df-glass-elevated px-1.5 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
        aria-label="Mobile bottom navigation"
      >
        {MOBILE_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMoreOpen(false)}
              className={cn(
                'relative flex min-h-[48px] min-w-[58px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-1 text-[10.5px] font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-[var(--df-text-muted)] hover:text-[var(--df-text)]'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 400, damping: 30 }
                  }
                  className="absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,#7B72F6,#5145C8)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(109,100,240,0.85)]"
                />
              )}
              <Icon className="relative z-10 h-[18px] w-[18px]" />
              <span className="relative z-10">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className={cn(
            'relative flex min-h-[48px] min-w-[58px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-1 text-[10.5px] font-medium transition-colors cursor-pointer',
            moreOpen || isMoreRouteActive
              ? 'text-white'
              : 'text-[var(--df-text-muted)] hover:text-[var(--df-text)]'
          )}
        >
          {(moreOpen || isMoreRouteActive) && (
            <motion.span
              layoutId="mobile-nav-pill"
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 400, damping: 30 }
              }
              className="absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,#7B72F6,#5145C8)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(109,100,240,0.85)]"
            />
          )}
          <MoreHorizontal className="relative z-10 h-[18px] w-[18px]" />
          <span className="relative z-10">More</span>
        </button>
      </nav>

      {/* Mobile More Bottom Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-50 flex items-end lg:hidden" role="dialog" aria-modal="true" aria-label="More destinations">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className="fixed inset-0 bg-[radial-gradient(80%_60%_at_50%_80%,rgba(40,34,110,0.35),rgba(3,4,8,0.8))] backdrop-blur-md"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={reduced ? { opacity: 1 } : { y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { y: 60, opacity: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 340, damping: 32 }
              }
              className="relative z-10 w-full rounded-t-[30px] df-glass-elevated p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--df-border-strong)]" />
              <div className="mb-4 flex items-center justify-between">
                <span className="text-base font-semibold tracking-tight text-[var(--df-text)]">
                  More Modules
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {MOBILE_MORE_NAV.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.to}
                      initial={reduced ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduced ? 0 : 0.05 + idx * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <NavLink
                        to={item.to}
                        onClick={() => setMoreOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-2xl border p-3 transition-all',
                            isActive
                              ? 'border-[#8F87FA]/50 bg-[linear-gradient(135deg,rgba(109,100,240,0.22),rgba(94,231,247,0.06))]'
                              : 'border-[var(--df-border)] bg-[var(--df-inset)] hover:border-[var(--df-border-strong)]'
                          )
                        }
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8F87FA]/30 bg-[linear-gradient(145deg,rgba(109,100,240,0.28),rgba(94,231,247,0.08))] text-[var(--df-accent-secondary)]">
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--df-text)]">
                            {item.label}
                          </p>
                          <p className="text-xs text-[var(--df-text-muted)] truncate">
                            {item.desc}
                          </p>
                        </div>
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[var(--df-text-faint)]" />
                      </NavLink>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FocusModal />
    </div>
  );
}
