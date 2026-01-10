import { useState, useCallback } from 'react';
import { useBroadcast } from '../hooks/useBroadcast';
import {
  TrustState,
  ChatMessage,
  PhotoAnalysis,
  TransactionResult,
  BroadcastEvent
} from '../types/demo';
import { TrustScoreGauge } from './components/TrustScoreGauge';
import { SignalsLog } from './components/SignalsLog';
import { AgentReasoning } from './components/AgentReasoning';
import { PhotoAnalysisPanel } from './components/PhotoAnalysis';
import { TransactionStatus } from './components/TransactionStatus';

export function AgentDashboard() {
  const [trustState, setTrustState] = useState<TrustState>({
    score: 100,
    signals: [],
    creditGranted: false,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [transaction, setTransaction] = useState<TransactionResult | null>(null);

  const handleBroadcast = useCallback((event: BroadcastEvent) => {
    switch (event.type) {
      case 'TRUST_UPDATE':
        setTrustState(event.payload);
        break;
      case 'CHAT_MESSAGE':
        setMessages(prev => [...prev, event.payload]);
        break;
      case 'PHOTO_ANALYZED':
        setPhotoAnalysis(event.payload);
        break;
      case 'TRANSACTION_COMPLETE':
        setTransaction(event.payload);
        break;
    }
  }, []);

  useBroadcast(handleBroadcast);

  return (
    <div className="h-full bg-gray-900 text-white p-6 overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🎛️</span>
          Agent Dashboard
        </h1>
        <p className="text-gray-400 text-sm">Real-time system visibility</p>
      </header>

      <div className="grid grid-cols-2 gap-6">
        {/* Trust Score Section */}
        <div className="space-y-4">
          <TrustScoreGauge score={trustState.score} />
          <SignalsLog signals={trustState.signals} />

          {trustState.creditGranted && (
            <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <span>🎁</span>
                <span>Proactive Credit Issued</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                ${trustState.creditAmount?.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Agent Activity Section */}
        <div className="space-y-4">
          <AgentReasoning messages={messages} />

          {photoAnalysis && (
            <PhotoAnalysisPanel analysis={photoAnalysis} />
          )}

          {transaction && (
            <TransactionStatus result={transaction} />
          )}
        </div>
      </div>
    </div>
  );
}
