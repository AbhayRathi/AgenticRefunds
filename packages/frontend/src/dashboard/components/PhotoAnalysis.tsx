import { PhotoAnalysis } from '../../types/demo';

interface PhotoAnalysisPanelProps {
  analysis: PhotoAnalysis;
}

export function PhotoAnalysisPanel({ analysis }: PhotoAnalysisPanelProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4">📸 PHOTO ANALYSIS</h3>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-gray-500 mb-2">Detected Items</div>
          <div className="flex flex-wrap gap-2">
            {analysis.detected.map((item, i) => (
              <span key={i} className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">Confidence Scores</div>
          {analysis.matches.map((match, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="text-sm flex-1">{match.item}</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${match.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-12">
                {(match.confidence * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">AI Reasoning</div>
          <p className="text-sm text-gray-300">{analysis.reasoning}</p>
        </div>
      </div>
    </div>
  );
}
