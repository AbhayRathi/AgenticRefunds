interface TrustScoreGaugeProps {
  score: number;
}

export function TrustScoreGauge({ score }: TrustScoreGaugeProps) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4">TRUST SCORE</h3>

      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="#374151"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-400">
        {score >= 70 ? 'Healthy' : score >= 40 ? 'Warning' : 'Critical'}
      </div>
    </div>
  );
}
