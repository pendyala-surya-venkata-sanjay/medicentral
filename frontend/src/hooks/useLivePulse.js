import { useState, useEffect, useRef } from 'react';

/** Brief pulse when queue data refreshes (realtime feel) */
export const useLivePulse = (refreshKey = 0) => {
  const [pulsing, setPulsing] = useState(false);
  const prev = useRef(refreshKey);

  useEffect(() => {
    if (prev.current !== refreshKey) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 1200);
      prev.current = refreshKey;
      return () => clearTimeout(t);
    }
  }, [refreshKey]);

  return pulsing;
};

export default useLivePulse;
