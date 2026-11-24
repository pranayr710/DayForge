import { useEffect, useState } from 'react';
import { ensureDatabaseSeeded } from '@/services/storage/seed';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { ToastProvider } from '@/app/providers/ToastProvider';
import { FocusProvider } from '@/app/providers/FocusProvider';
import { AppRouter } from '@/app/router/AppRouter';
import { DayForgeLogo } from '@/components/shared/SharedComponents';

export function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    ensureDatabaseSeeded()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to initialize local storage.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="relative min-h-[100dvh] bg-[#07080D] text-[#F4F5FB] flex items-center justify-center overflow-hidden p-6">
        <div aria-hidden="true" className="absolute left-1/2 top-1/3 h-[50vmin] w-[50vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(240,106,106,0.25),transparent)] blur-3xl" />
        <div className="relative max-w-md rounded-[24px] border border-[#F06A6A]/35 bg-[rgba(20,22,34,0.7)] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          <h1 className="text-base font-semibold tracking-tight">Unable to open DayForge database</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#9EA3B8]">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="relative min-h-[100dvh] bg-[#07080D] text-[#F4F5FB] flex flex-col items-center justify-center gap-5 overflow-hidden">
        <div aria-hidden="true" className="df-breathe absolute left-1/2 top-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(109,100,240,0.4),transparent)] blur-3xl" />
        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-4 rounded-3xl bg-[radial-gradient(closest-side,rgba(143,135,250,0.6),transparent)] blur-xl" />
          <DayForgeLogo className="relative h-14 w-14 df-float" />
        </div>
        <div className="relative flex flex-col items-center gap-2">
          <p className="text-sm font-semibold tracking-tight">
            Day<span className="df-text-aurora">Forge</span>
          </p>
          <div className="h-0.5 w-32 overflow-hidden rounded-full bg-white/10">
            <div className="df-shimmer h-full w-full rounded-full bg-[linear-gradient(90deg,#635BDB,#A78BFA,#5EE7F7)]" />
          </div>
          <p className="text-[11px] tracking-wide text-[#9EA3B8]">Preparing local workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <FocusProvider>
          <AppRouter />
        </FocusProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
