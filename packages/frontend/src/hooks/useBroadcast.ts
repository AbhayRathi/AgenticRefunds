import { useEffect, useRef, useCallback } from 'react';
import { BroadcastEvent } from '../types/demo';

const CHANNEL_NAME = 'doordash-demo';

export function useBroadcast(onMessage?: (event: BroadcastEvent) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);

    if (onMessage) {
      channelRef.current.onmessage = (e) => onMessage(e.data);
    }

    return () => {
      channelRef.current?.close();
    };
  }, [onMessage]);

  const broadcast = useCallback((event: BroadcastEvent) => {
    channelRef.current?.postMessage(event);
  }, []);

  return { broadcast };
}
