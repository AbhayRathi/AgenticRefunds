import { TrustState } from '../../types/demo';

interface TrustSignalsPanelProps {
  trustState: TrustState;
  onClose: () => void;
}

export function TrustSignalsPanel({ trustState, onClose }: TrustSignalsPanelProps) {
  const scoreColor = trustState.score >= 70 ? 'text-green-600' :
                     trustState.score >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-gray-900 text-white p-4 animate-slide-down">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          🛡️ Trust Signals
        </h3>
        <button onClick={onClose} className="text-gray-400">✕</button>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className={`text-3xl font-bold ${scoreColor}`}>
          {trustState.score}
        </div>
        <div className="text-sm text-gray-400">/ 100</div>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              trustState.score >= 70 ? 'bg-green-500' :
              trustState.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${trustState.score}%` }}
          />
        </div>
      </div>

      {trustState.signals.length > 0 ? (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {trustState.signals.slice(-5).reverse().map((signal, i) => (
            <div key={i} className="text-sm flex items-center gap-2 text-gray-300">
              <span className="text-red-400">−{signal.scoreImpact}</span>
              <span>{signal.type.replace('_', ' ')}</span>
              {signal.details && (
                <span className="text-gray-500">({signal.details})</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No frustration signals detected</p>
      )}
    </div>
  );
}
