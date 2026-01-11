import { MobileApp } from './mobile/MobileApp';
import { AgentDashboard } from './dashboard/AgentDashboard';
import { NegotiationDemo } from './demo/NegotiationDemo';
import { useState } from 'react';

function App() {
  const [view, setView] = useState<'mobile' | 'negotiation'>('negotiation');

  return (
    <div className="h-screen bg-gray-100">
      {/* View Switcher */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        background: 'white',
        borderRadius: '8px',
        padding: '0.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => setView('negotiation')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: 'none',
            background: view === 'negotiation' ? '#667eea' : '#f3f4f6',
            color: view === 'negotiation' ? 'white' : '#374151',
            cursor: 'pointer',
            fontWeight: view === 'negotiation' ? 'bold' : 'normal'
          }}
        >
          🤝 Negotiation Demo
        </button>
        <button
          onClick={() => setView('mobile')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: 'none',
            background: view === 'mobile' ? '#667eea' : '#f3f4f6',
            color: view === 'mobile' ? 'white' : '#374151',
            cursor: 'pointer',
            fontWeight: view === 'mobile' ? 'bold' : 'normal'
          }}
        >
          📱 Mobile App
        </button>
      </div>

      {/* Content */}
      {view === 'negotiation' ? (
        <NegotiationDemo />
      ) : (
        <div className="h-screen flex items-center justify-center gap-8 p-8">
          {/* Left: Mobile App */}
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold text-gray-600 mb-4">
              Customer View
            </h2>
            <MobileApp />
          </div>

          {/* Right: Agent Dashboard */}
          <div className="flex flex-col h-[812px] w-[600px]">
            <h2 className="text-lg font-semibold text-gray-600 mb-4">
              Agent Dashboard (Judges View)
            </h2>
            <div className="flex-1 rounded-xl overflow-hidden shadow-2xl">
              <AgentDashboard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
