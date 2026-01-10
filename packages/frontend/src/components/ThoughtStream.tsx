import { useEffect, useRef } from 'react';

export interface ThoughtLogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  icon?: string;
}

interface ThoughtStreamProps {
  entries: ThoughtLogEntry[];
}

export function ThoughtStream({ entries }: ThoughtStreamProps) {
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [entries]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDefaultIcon = (level: string) => {
    switch (level) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '🔍';
    }
  };

  return (
    <div style={{
      background: '#1F2937',
      borderRadius: '12px',
      padding: '1rem',
      fontFamily: 'monospace',
      fontSize: '0.875rem',
      maxHeight: '400px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #374151'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#10B981'
        }} />
        <span style={{ color: '#9CA3AF', fontWeight: 'bold' }}>
          AGENT THOUGHT STREAM
        </span>
      </div>

      <div
        ref={streamRef}
        style={{
          maxHeight: '320px',
          overflowY: 'auto',
          paddingRight: '0.5rem'
        }}
      >
        {entries.map((entry, index) => (
          <div key={index} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#6B7280', flexShrink: 0 }}>
                [{new Date(entry.timestamp).toLocaleTimeString()}]
              </span>
              <span style={{ flexShrink: 0 }}>
                {entry.icon || getDefaultIcon(entry.level)}
              </span>
              <span style={{
                color: getLevelColor(entry.level),
                wordBreak: 'break-word'
              }}>
                {entry.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
