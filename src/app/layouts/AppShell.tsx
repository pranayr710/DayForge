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
import { DayForgeLogo } from '@/components/shared/SharedComponents';
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
  const { openFocus, isRunning, remainingSeconds } = useFocusTimer();
  const location = useLocation();
  const reduced = useReducedMotion();

  const isMoreRouteActive = ['/career', '/projects', '/analytics', '/settings'].some(
    (p) => location.pathname.startsWith(p)
  );

  return (
    <div className="min-h-[100dvh] bg-[var(--df-bg)] df-ambient-canvas text-[var(--df-text)] flex flex-col lg:flex-row">
      {/* Desktop Floating Smoked-Glass Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:fixed lg:inset-y-3 lg:left-3 lg:z-40 flex-col justify-between rounded-2xl df-glass transition-[width] duration-250 ease-out',
          collapsed ? 'w-[72px]' : 'w-60'
        )}
      >
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--df-border)]">
            <NavLink to="/" className="flex items-center gap-2.5 min-w-0">
              <DayForgeLogo className="h-7 w-7 shrink-0" />
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold tracking-tight text-[var(--df-text)] truncate">
                    DayForge
                  </span>
                  <span className="text-[11px] text-[var(--df-text-muted)] truncate">
                    {profile?.semester ?? 'Semester VI'}
                  </span>
                </div>
              )}
            </NavLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="h-7 w-7"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          <nav className="flex flex-col gap-1 p-2.5" aria-label="Primary navigation">
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
                    'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'text-white'
                      : 'text-[var(--df-text-muted)] hover:text-[var(--df-text)] hover:bg-white/[0.04]'
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
                      className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#6F67E5] to-[#5B52D1] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_18px_-6px_rgba(99,91,219,0.55)]"
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4 shrink-0" />
                  {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-[var(--df-border)] p-2.5 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openFocus()}
            className={cn('w-full justify-start', collapsed && 'justify-center px-0')}
          >
            <Timer className="h-4 w-4 text-[#8178F5] shrink-0" />
            {!collapsed && (
              <span className="truncate font-mono-tabular">
                {isRunning
                  ? `Focus ${Math.floor(remainingSeconds / 60)}:${String(
                      remainingSeconds % 60
                    ).padStart(2, '0')}`
                  : 'Focus Mode'}
              </span>
            )}
          </Button>

          <div
            className={cn(
              'flex items-center gap-2 px-2 py-1 text-[11px] text-[var(--df-text-muted)]',
              collapsed && 'justify-center px-0'
            )}
          >
            {online ? (
              <Wifi className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-[#E5A03C] shrink-0" />
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
          'flex-1 flex flex-col min-w-0 transition-[padding] duration-250 ease-out',
          collapsed ? 'lg:pl-[92px]' : 'lg:pl-[264px]'
        )}
      >
        {/* Mobile & Tablet Frosted Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--df-border)] bg-[var(--df-secondary)] backdrop-blur-xl px-4 lg:hidden">
          <NavLink to="/" className="flex items-center gap-2 min-w-0">
            <DayForgeLogo className="h-6 w-6 shrink-0" />
            <span className="text-sm font-semibold tracking-tight text-[var(--df-text)]">
              DayForge
            </span>
          </NavLink>
          <div className="flex items-center gap-2">
            <span className="font-mono-tabular text-[11px] text-[var(--df-text-muted)]">
              {istNow.formattedTime} IST
            </span>
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                online ? 'bg-[#16A34A]' : 'bg-[#E5A03C]'
              )}
              title={online ? 'Online (Local-first)' : 'Offline'}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => openFocus()}
              className="h-8 px-2.5 text-xs"
            >
              <Timer className="h-3.5 w-3.5" />
              <span>{isRunning ? `${Math.floor(remainingSeconds / 60)}m` : 'Focus'}</span>
            </Button>
          </div>
        </header>

        {/* Desktop Subtle Glass Top Bar */}
        <header className="hidden lg:flex h-14 items-center justify-between mx-6 mt-3 rounded-2xl df-glass px-5 sticky top-3 z-30">
          <div className="flex items-center gap-3 text-xs text-[var(--df-text-muted)] min-w-0">
            <span className="font-medium text-[var(--df-text)] shrink-0">
              {istNow.dayName}, {istNow.formattedDate}
            </span>
            <span>·</span>
            <span className="font-mono-tabular shrink-0">{istNow.formattedTime} IST</span>
            <span>·</span>
            <span className="truncate">
              {profile?.institution ?? 'Amrita School of Computing, Coimbatore'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="primary" size="sm" onClick={() => openFocus()}>
              <Timer className="h-3.5 w-3.5" />
              <span>{isRunning ? 'Focus Active' : 'Start Focus'}</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 pt-4 pb-28 sm:px-6 sm:pt-5 lg:pb-10">
          <motion.div
            key={location.pathname}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Floating Smoked-Glass Bottom Navigation (5 Destinations) */}
      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl df-glass-elevated px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
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
                'relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[11px] font-medium transition-colors',
                isActive
                  ? 'text-[#8178F5]'
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
                  className="absolute inset-0 rounded-xl bg-[#635BDB]/15 border border-[#635BDB]/30"
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className={cn(
            'relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer',
            moreOpen || isMoreRouteActive
              ? 'text-[#8178F5]'
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
              className="absolute inset-0 rounded-xl bg-[#635BDB]/15 border border-[#635BDB]/30"
            />
          )}
          <MoreHorizontal className="relative z-10 h-4 w-4" />
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
              transition={{ duration: reduced ? 0 : 0.16 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={reduced ? { opacity: 1 } : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 360, damping: 32 }
              }
              className="relative z-10 w-full rounded-t-3xl df-glass-elevated p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--df-text)]">
                  More Modules
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {MOBILE_MORE_NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl border border-[var(--df-border)] p-3 transition-colors',
                          isActive
                            ? 'border-[#635BDB]/50 bg-[#635BDB]/15'
                            : 'bg-[var(--df-bg)]/70 hover:bg-[var(--df-elevated)]'
                        )
                      }
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#635BDB]/15 text-[#8178F5]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--df-text)]">
                          {item.label}
                        </p>
                        <p className="text-xs text-[var(--df-text-muted)] truncate">
                          {item.desc}
                        </p>
                      </div>
                    </NavLink>
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
