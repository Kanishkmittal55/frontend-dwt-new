/**
 * DiscoveryLiveContext
 * Provides per-pursuit invalidation for discovery data when WebSocket events arrive.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface DiscoveryLiveContextValue {
  /** Increment refresh trigger for a pursuit (called when founder.agent.discoveries arrives) */
  invalidateDiscoveries: (pursuitUUID: string) => void;
  /** Get current refresh trigger for a pursuit (for useDiscoveries/useDiscoveriesSummary) */
  getRefreshTrigger: (pursuitUUID: string) => number;
  /** Increment refresh trigger for radar runs (when discoveries arrive or run created/deleted) */
  invalidateRadarRunsByPursuit: (pursuitUUID: string) => void;
  /** Get refresh trigger for radar runs of a pursuit's tracks */
  getRadarRunsRefreshTrigger: (pursuitUUID: string) => number;
}

const DiscoveryLiveContext = createContext<DiscoveryLiveContextValue | null>(null);

const RADAR_RUNS_PREFIX = 'radarRuns:';

export function DiscoveryLiveProvider({ children }: { children: React.ReactNode }) {
  const [triggers, setTriggers] = useState<Record<string, number>>({});

  const invalidateDiscoveries = useCallback((pursuitUUID: string) => {
    setTriggers((prev) => ({
      ...prev,
      [pursuitUUID]: (prev[pursuitUUID] ?? 0) + 1
    }));
  }, []);

  const invalidateRadarRunsByPursuit = useCallback((pursuitUUID: string) => {
    const key = RADAR_RUNS_PREFIX + pursuitUUID;
    setTriggers((prev) => ({
      ...prev,
      [key]: (prev[key] ?? 0) + 1
    }));
  }, []);

  const getRefreshTrigger = useCallback(
    (pursuitUUID: string) => triggers[pursuitUUID] ?? 0,
    [triggers]
  );

  const getRadarRunsRefreshTrigger = useCallback(
    (pursuitUUID: string) => triggers[RADAR_RUNS_PREFIX + pursuitUUID] ?? 0,
    [triggers]
  );

  const value = useMemo(
    () => ({
      invalidateDiscoveries,
      getRefreshTrigger,
      invalidateRadarRunsByPursuit,
      getRadarRunsRefreshTrigger
    }),
    [invalidateDiscoveries, getRefreshTrigger, invalidateRadarRunsByPursuit, getRadarRunsRefreshTrigger]
  );

  return (
    <DiscoveryLiveContext.Provider value={value}>
      {children}
    </DiscoveryLiveContext.Provider>
  );
}

export function useDiscoveryLive() {
  const ctx = useContext(DiscoveryLiveContext);
  if (!ctx) {
    return {
      invalidateDiscoveries: () => {},
      getRefreshTrigger: () => 0,
      invalidateRadarRunsByPursuit: () => {},
      getRadarRunsRefreshTrigger: () => 0
    };
  }
  return ctx;
}

/** Hook that returns refresh trigger for a pursuit (for useDiscoveries) */
export function useDiscoveryRefreshTrigger(pursuitUUID: string | null): number {
  const { getRefreshTrigger } = useDiscoveryLive();
  return pursuitUUID ? getRefreshTrigger(pursuitUUID) : 0;
}
