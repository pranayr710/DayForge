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
      <div className="min-h-[100dvh] bg-[#111318] text-[#F3F4F6] flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-[#E05252]/40 bg-[#191D25] p-6">
          <h1 className="text-base font-semibold">Unable to open DayForge database</h1>
          <p className="mt-2 text-xs text-[#9CA3AF]">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-[100dvh] bg-[#111318] text-[#F3F4F6] flex flex-col items-center justify-center gap-3">
        <DayForgeLogo className="h-10 w-10 animate-pulse" />
        <p className="text-xs text-[#9CA3AF]">Preparing local workspace…</p>
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
