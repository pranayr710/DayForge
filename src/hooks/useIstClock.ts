import { useEffect, useState } from 'react';
import { getNowParts, type ZonedNowParts } from '@/lib/dateUtils';

export function useIstClock(timezone = 'Asia/Kolkata'): ZonedNowParts {
  const [nowParts, setNowParts] = useState<ZonedNowParts>(() =>
    getNowParts(timezone)
  );

  useEffect(() => {
    setNowParts(getNowParts(timezone));
    const timer = window.setInterval(() => {
      setNowParts(getNowParts(timezone));
    }, 30000);
    return () => window.clearInterval(timer);
  }, [timezone]);

  return nowParts;
}
