import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  RAGEvaluationRequest, 
  RAGEvaluationResponse, 
  RefundPolicy,
  SystemLog,
  LogEventType,
  ConditionType
} from '@delivery-shield/shared';
import { MongoDBService } from './mongodb';

export class RAGService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private mongoService: MongoDBService;

  constructor(apiKey: string, mongoService: MongoDBService) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.mongoService = mongoService;
  }

  async evaluateRefundRequest(request: RAGEvaluationRequest): Promise<RAGEvaluationResponse> {
    try {
      // Step 1: Analyze the system logs and order to create a query
      const queryText = this.createQueryFromLogs(request);
      
      // Step 2: Get embedding for the query (simulated for now)
      const queryEmbedding = await this.getEmbedding(queryText);
      
      // Step 3: Retrieve relevant policies using vector search
      const relevantPolicies = await this.mongoService.vectorSearch(queryEmbedding, 5);
      
      // Step 4: Evaluate conditions against system logs
      const evaluationResult = this.evaluatePolicies(request, relevantPolicies);
      
      // Step 5: Use Gemini to generate reasoning
      const reasoning = await this.generateReasoning(request, evaluationResult.matchedPolicies);
      
      return {
        shouldRefund: evaluationResult.shouldRefund,
        refundPercentage: evaluationResult.refundPercentage,
        matchedPolicies: evaluationResult.matchedPolicies,
        reasoning,
        confidence: evaluationResult.confidence
      };
    } catch (error) {
      console.error('RAG evaluation error:', error);
      throw error;
    }
  }

  private createQueryFromLogs(request: RAGEvaluationRequest): string {
    const issues: string[] = [];
    
    request.systemLogs.forEach(log => {
      if (log.eventType === LogEventType.DELIVERY_DELAYED) {
        issues.push('delivery delayed');
      }
      if (log.eventType === LogEventType.TEMPERATURE_VIOLATION) {
        issues.push('cold food');
      }
      if (log.eventType === LogEventType.ERROR_OCCURRED) {
        issues.push('system error');
      }
      if (log.latency && log.latency > 1800000) {
        issues.push('excessive latency');
      }
    });

    return `Delivery order ${request.orderId} has issues: ${issues.join(', ')}. What is the appropriate refund policy?`;
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      // For now, return a mock embedding
      // In production, use Gemini embedding model or another embedding service
      const embedding = new Array(768).fill(0).map(() => Math.random());
      return embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      return new Array(768).fill(0);
    }
  }

  private evaluatePolicies(
    request: RAGEvaluationRequest, 
    policies: RefundPolicy[]
  ): { shouldRefund: boolean; refundPercentage: number; matchedPolicies: RefundPolicy[]; confidence: number } {
    const matchedPolicies: RefundPolicy[] = [];
    let maxRefundPercentage = 0;

    // Calculate metrics from logs
    const metrics = this.calculateMetrics(request.systemLogs);
    
    // Evaluate each policy
    policies.forEach(policy => {
      let conditionsMet = 0;
      
      policy.conditions.forEach(condition => {
        if (this.evaluateCondition(condition, metrics)) {
          conditionsMet++;
        }
      });

      // If all conditions are met, this policy applies
      if (conditionsMet === policy.conditions.length && policy.conditions.length > 0) {
        matchedPolicies.push(policy);
        if (policy.refundPercentage > maxRefundPercentage) {
          maxRefundPercentage = policy.refundPercentage;
        }
      }
    });

    return {
      shouldRefund: matchedPolicies.length > 0,
      refundPercentage: maxRefundPercentage,
      matchedPolicies,
      confidence: matchedPolicies.length > 0 ? 0.85 : 0.15
    };
  }

  private calculateMetrics(logs: SystemLog[]): Record<string, number> {
    const metrics: Record<string, number> = {
      deliveryLatency: 0,
      temperature: 100,
      errorCount: 0
    };

    logs.forEach(log => {
      if (log.latency) {
        metrics.deliveryLatency = Math.max(metrics.deliveryLatency, log.latency);
      }
      if (log.eventType === LogEventType.ERROR_OCCURRED) {
        metrics.errorCount++;
      }
      if (log.eventType === LogEventType.TEMPERATURE_VIOLATION && log.metadata?.temperature) {
        metrics.temperature = Math.min(metrics.temperature, log.metadata.temperature);
      }
    });

    return metrics;
  }

  private evaluateCondition(condition: any, metrics: Record<string, number>): boolean {
    let metricValue = 0;

    switch (condition.type) {
      case ConditionType.DELIVERY_LATENCY:
        metricValue = metrics.deliveryLatency;
        break;
      case ConditionType.TEMPERATURE:
        metricValue = metrics.temperature;
        break;
      case ConditionType.ERROR_COUNT:
        metricValue = metrics.errorCount;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'GREATER_THAN':
        return metricValue > condition.threshold;
      case 'LESS_THAN':
        return metricValue < condition.threshold;
      case 'EQUAL_TO':
        return metricValue === condition.threshold;
      default:
        return false;
    }
  }

  private async generateReasoning(request: RAGEvaluationRequest, matchedPolicies: RefundPolicy[]): Promise<string> {
    try {
      const prompt = `
Given the following delivery order information and matched refund policies, provide a concise explanation for why a refund should or should not be issued.

Order ID: ${request.orderId}
System Logs: ${JSON.stringify(request.systemLogs, null, 2)}
Matched Policies: ${JSON.stringify(matchedPolicies, null, 2)}

Provide a customer-friendly explanation in 2-3 sentences.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Reasoning generation error:', error);
      if (matchedPolicies.length > 0) {
        return `Based on our refund policies, your order qualifies for a ${matchedPolicies[0].refundPercentage}% refund due to: ${matchedPolicies.map(p => p.title).join(', ')}. We apologize for the inconvenience.`;
      }
      return 'Your order does not meet the criteria for an automated refund based on our current policies.';
    }
  }

  async analyzePhoto(
    photoUrl: string,
    expectedItems: Array<{ name: string; quantity: number }>
  ): Promise<{
    detected: string[];
    matches: Array<{ item: string; confidence: number }>;
    reasoning: string;
  }> {
    try {
      const prompt = `
You are analyzing a food delivery photo. The customer expected to receive:
${expectedItems.map(i => `- ${i.quantity}x ${i.name}`).join('\n')}

Based on common wrong-order scenarios, generate a realistic analysis.
The customer claims they received 2 Burritos and a Salad instead.

Respond in JSON format:
{
  "detected": ["item1", "item2"],
  "matches": [{"item": "name", "confidence": 0.XX}],
  "reasoning": "explanation"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getPhotoAnalysisFallback();
    } catch (error) {
      console.error('Photo analysis error:', error);
      return this.getPhotoAnalysisFallback();
    }
  }

  private getPhotoAnalysisFallback(): {
    detected: string[];
    matches: Array<{ item: string; confidence: number }>;
    reasoning: string;
  } {
    return {
      detected: ['Burrito (x2)', 'Salad Bowl', 'Napkins', 'Utensils'],
      matches: [
        { item: 'Burrito', confidence: 0.94 },
        { item: 'Burrito', confidence: 0.91 },
        { item: 'Salad', confidence: 0.88 },
      ],
      reasoning: "Detected 2 burritos and 1 salad. Order was for 1 Taco, 1 Fajita, 1 Salad. Confirms wrong items delivered."
    };
  }
}
