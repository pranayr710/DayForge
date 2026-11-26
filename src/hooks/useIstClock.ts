import { useEffect, useState } from 'react';
import { getNowParts, type ZonedNowParts } from '@/lib/dateUtils';

export function useIstClock(timezone = 'Asia/Kolkata'): ZonedNowParts {
  const [nowParts, setNowParts] = useState<ZonedNowParts>(() =>
    getNowParts(timezone)
  );

  useEffect(() => {
    const refresh = () => setNowParts(getNowParts(timezone));
    refresh();
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [timezone]);

  return nowParts;
}
