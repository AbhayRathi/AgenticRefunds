import { Request, Response } from 'express';

interface TrustSignal {
  type: 'RAGE_TAP' | 'FAST_NAVIGATION' | 'RECEIPT_SCRUB' | 'NEGATIVE_CHIP' | 'ABANDONED_DRAFT';
  timestamp: number;
  details?: string;
  scoreImpact: number;
}

interface TrustEvaluationRequest {
  customerId: string;
  orderId?: string;
  signals: TrustSignal[];
}

// In-memory customer history for demo
const customerHistory = new Map<string, { previousRefunds: number }>();

export class TrustController {
  async evaluateTrust(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, signals } = req.body as TrustEvaluationRequest;

      if (!signals || !Array.isArray(signals)) {
        res.status(400).json({ error: 'signals array is required' });
        return;
      }

      const baseScore = 100;
      const now = Date.now();

      // Apply signal impacts with decay (5-minute window)
      let totalImpact = 0;
      for (const signal of signals) {
        const ageSeconds = (now - signal.timestamp) / 1000;
        const decayFactor = Math.max(0.5, 1 - (ageSeconds / 300));
        totalImpact += signal.scoreImpact * decayFactor;
      }

      // Adjust for customer history
      const history = customerHistory.get(customerId) || { previousRefunds: 0 };
      if (history.previousRefunds > 3) {
        totalImpact *= 0.8;
      }

      const score = Math.max(0, Math.min(100, baseScore - totalImpact));
      const creditGranted = score < 40;
      const creditAmount = creditGranted ? 25 : undefined;

      // Determine recommendation
      let recommendation: 'APPROVE' | 'MONITOR' | 'ESCALATE' = 'APPROVE';
      if (score >= 70) recommendation = 'APPROVE';
      else if (score >= 40) recommendation = 'MONITOR';
      else recommendation = 'ESCALATE';

      res.json({
        score: Math.round(score),
        signals,
        creditGranted,
        creditAmount,
        reasoning: `Customer showing ${score < 40 ? 'high' : score < 70 ? 'moderate' : 'low'} frustration. ${signals.length} signal(s) detected.`,
        recommendation
      });
    } catch (error) {
      console.error('Trust evaluation error:', error);
      res.status(500).json({ error: 'Failed to evaluate trust' });
    }
  }
}
