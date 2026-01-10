import { TrustSignal } from '../../types/demo';

interface SignalsLogProps {
  signals: TrustSignal[];
}

export function SignalsLog({ signals }: SignalsLogProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4">DETECTED SIGNALS</h3>

      {signals.length === 0 ? (
        <p className="text-gray-500 text-sm">No signals detected yet</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {signals.slice().reverse().map((signal, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg text-sm"
            >
              <span className="text-red-400 font-mono">-{signal.scoreImpact}</span>
              <span className="text-yellow-400">{signal.type}</span>
              {signal.details && (
                <span className="text-gray-400 truncate">{signal.details}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
