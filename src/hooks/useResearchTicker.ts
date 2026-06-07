import type { AxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

import { api } from '@lib/api';

const POLL_INTERVAL = 2000;
const MAX_CONSECUTIVE_FAILURES = 3;

// Maps backend phase number → source key used by SourceRow
const PHASE_TO_SOURCE: Record<number, string> = {
  0: 'youtube',
  1: 'youtube',
  2: 'reddit',
  3: 'google',
  4: 'blog',
  5: 'building',
};

export type ResearchDiscovery = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  source: 'youtube' | 'reddit' | 'blog' | 'maps';
};

type Stats = { places: number; tips: number; photoStops: number };

interface ResearchJobResponse {
  status: 'pending' | 'researching' | 'building' | 'completed' | 'failed';
  phase: number;
  progress: number;
  message: string | null;
  stats: Stats;
  discoveries: ResearchDiscovery[];
}

const INITIAL_DISCOVERY: ResearchDiscovery = {
  id: 'init',
  title: 'Starting your research...',
  body: 'Our AI is beginning to scan sources for the best recommendations for your trip.',
  tags: ['#Starting'],
  source: 'youtube',
};

export interface UseResearchTickerReturn {
  currentPhase: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  progressLabel: string;
  displayProgress: number;
  stats: Stats;
  activeSource: string;
  currentDiscovery: ResearchDiscovery;
  discoveryOpacity: ReturnType<typeof useSharedValue<number>>;
  hasError: boolean;
  isRateLimited: boolean;
  retryAfterMs: number | null;
  retry: () => void;
}

export function useResearchTicker(tripId: string, onComplete: () => void): UseResearchTickerReturn {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('STARTING RESEARCH...');
  const [stats, setStats] = useState<Stats>({ places: 0, tips: 0, photoStops: 0 });
  const [activeSource, setActiveSource] = useState('youtube');
  const [currentDiscovery, setCurrentDiscovery] = useState<ResearchDiscovery>(INITIAL_DISCOVERY);
  const [hasError, setHasError] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfterMs, setRetryAfterMs] = useState<number | null>(null);
  // Incrementing this triggers the polling useEffect to restart
  const [restartKey, setRestartKey] = useState(0);

  const progress = useSharedValue(0);
  const discoveryOpacity = useSharedValue(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevDiscoveriesLen = useRef(0);
  const isMounted = useRef(true);
  const isCompleted = useRef(false);
  const consecutiveFailures = useRef(0);
  // Exponential backoff: skip poll ticks until this timestamp passes
  const backoffUntil = useRef(0);
  const backoffMs = useRef(POLL_INTERVAL);

  // Stable ref so the polling closure always calls the latest onComplete
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const retry = useCallback(() => {
    consecutiveFailures.current = 0;
    prevDiscoveriesLen.current = 0;
    isCompleted.current = false;
    backoffUntil.current = 0;
    backoffMs.current = POLL_INTERVAL;
    setHasError(false);
    setIsRateLimited(false);
    setRetryAfterMs(null);
    setDisplayProgress(0);
    setProgressLabel('STARTING RESEARCH...');
    setCurrentDiscovery(INITIAL_DISCOVERY);
    // Bump the key so the polling effect re-runs
    setRestartKey((k) => k + 1);
  }, []);

  const swapDiscovery = useCallback(
    (next: ResearchDiscovery) => {
      discoveryOpacity.value = withTiming(0, { duration: 150, easing: Easing.ease });
      setTimeout(() => {
        if (!isMounted.current) return;
        setCurrentDiscovery(next);
        discoveryOpacity.value = withTiming(1, { duration: 350, easing: Easing.ease });
      }, 150);
    },
    [discoveryOpacity],
  );

  useEffect(() => {
    isMounted.current = true;
    isCompleted.current = false;
    consecutiveFailures.current = 0;
    backoffUntil.current = 0;
    backoffMs.current = POLL_INTERVAL;

    const handleResponse = (data: ResearchJobResponse) => {
      if (!isMounted.current || isCompleted.current) return;

      // Backend reported a permanent failure
      if (data.status === 'failed') {
        stopPolling();
        if (isMounted.current) setHasError(true);
        return;
      }

      setCurrentPhase(data.phase);
      setDisplayProgress(data.progress);
      setProgressLabel(data.message ?? 'Researching...');
      setStats(data.stats);
      setActiveSource(PHASE_TO_SOURCE[data.phase] ?? 'youtube');

      progress.value = withTiming(data.progress, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });

      // Show the latest discovery card whenever a new one arrives
      const discoveries = Array.isArray(data.discoveries) ? data.discoveries : [];
      if (discoveries.length > prevDiscoveriesLen.current) {
        prevDiscoveriesLen.current = discoveries.length;
        const latest = discoveries[discoveries.length - 1];
        if (latest) swapDiscovery(latest);
      }

      if (data.status === 'completed') {
        isCompleted.current = true;
        stopPolling();
        progress.value = withTiming(100, { duration: 400, easing: Easing.ease });
        setDisplayProgress(100);
        setTimeout(() => {
          if (isMounted.current) onCompleteRef.current();
        }, 600);
      }
    };

    const poll = async () => {
      // Skip this tick if we're in an exponential-backoff window
      if (Date.now() < backoffUntil.current) return;

      try {
        const res = await api.get<ResearchJobResponse>(`/trips/${tripId}/research`);
        consecutiveFailures.current = 0;
        backoffMs.current = POLL_INTERVAL;
        handleResponse(res.data);
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;

        // 429: rate limited — stop polling, surface specific state, do NOT
        // auto-retry (hammering a rate-limited endpoint just wastes quota).
        if (status === 429) {
          const retryAfterHeader = (err as AxiosError)?.response?.headers?.['retry-after'];
          const waitMs = retryAfterHeader
            ? parseInt(retryAfterHeader as string, 10) * 1000
            : 60_000;
          stopPolling();
          if (isMounted.current) {
            setIsRateLimited(true);
            setRetryAfterMs(waitMs);
          }
          return;
        }

        // 5xx / network: exponential backoff — double the wait on each failure,
        // cap at 30s, then count toward the hard-stop threshold.
        backoffMs.current = Math.min(backoffMs.current * 2, 30_000);
        backoffUntil.current = Date.now() + backoffMs.current;
        consecutiveFailures.current += 1;
        console.warn(
          `[useResearchTicker] poll failed (${consecutiveFailures.current}/${MAX_CONSECUTIVE_FAILURES}):`,
          err,
        );
        if (consecutiveFailures.current >= MAX_CONSECUTIVE_FAILURES) {
          stopPolling();
          if (isMounted.current) setHasError(true);
        }
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      isMounted.current = false;
      stopPolling();
    };
  }, [tripId, restartKey, progress, swapDiscovery, stopPolling]);

  return {
    currentPhase,
    progress,
    progressLabel,
    displayProgress,
    stats,
    activeSource,
    currentDiscovery,
    discoveryOpacity,
    hasError,
    isRateLimited,
    retryAfterMs,
    retry,
  };
}
