import { useState, useCallback, useRef } from 'react';
import { TrustState, TrustSignal, TrustSignalType } from '../types/demo';
import { agentService } from '../services';

const SIGNAL_IMPACTS: Record<TrustSignalType, number> = {
  RAGE_TAP: 15,
  FAST_NAVIGATION: 10,
  RECEIPT_SCRUB: 8,
  NEGATIVE_CHIP: 20,
  ABANDONED_DRAFT: 12,
};

export function useTrustScore(onUpdate?: (state: TrustState) => void) {
  const [state, setState] = useState<TrustState>({
    score: 100,
    signals: [],
    creditGranted: false,
  });

  // Rage tap detection
  const tapTimestamps = useRef<number[]>([]);
  const navigationTimestamps = useRef<{ view: string; time: number }[]>([]);

  const addSignal = useCallback(async (type: TrustSignalType, details?: string) => {
    const signal: TrustSignal = {
      type,
      timestamp: Date.now(),
      details,
      scoreImpact: SIGNAL_IMPACTS[type],
    };

    const newSignals = [...state.signals, signal];
    const newState = await agentService.evaluateTrust(newSignals);

    setState(newState);
    onUpdate?.(newState);

    return newState;
  }, [state.signals, onUpdate]);

  const detectRageTap = useCallback((elementId: string) => {
    const now = Date.now();
    tapTimestamps.current.push(now);

    // Keep only taps within last 1.5 seconds
    tapTimestamps.current = tapTimestamps.current.filter(t => now - t < 1500);

    if (tapTimestamps.current.length >= 3) {
      addSignal('RAGE_TAP', `${tapTimestamps.current.length} taps on ${elementId}`);
      tapTimestamps.current = []; // Reset after detection
    }
  }, [addSignal]);

  const detectFastNavigation = useCallback((currentView: string) => {
    const now = Date.now();
    navigationTimestamps.current.push({ view: currentView, time: now });

    // Keep only navigations within last 10 seconds
    navigationTimestamps.current = navigationTimestamps.current.filter(n => now - n.time < 10000);

    // Check for back-and-forth pattern (2+ switches)
    if (navigationTimestamps.current.length >= 4) {
      const views = navigationTimestamps.current.map(n => n.view);
      const switches = views.filter((v, i) => i > 0 && v !== views[i - 1]).length;

      if (switches >= 2) {
        addSignal('FAST_NAVIGATION', `${switches} view switches in 10s`);
        navigationTimestamps.current = [];
      }
    }
  }, [addSignal]);

  const reset = useCallback(() => {
    setState({ score: 100, signals: [], creditGranted: false });
    tapTimestamps.current = [];
    navigationTimestamps.current = [];
  }, []);

  return {
    state,
    addSignal,
    detectRageTap,
    detectFastNavigation,
    reset,
  };
}
