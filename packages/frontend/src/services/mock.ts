import {
  TrustState,
  TrustSignal,
  ChatMessage,
  RefundProposal,
  TransactionResult,
  PhotoAnalysis
} from '../types/demo';

// Simulated delays for realistic feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockService = {
  // Trust Agent
  async evaluateTrust(signals: TrustSignal[]): Promise<TrustState> {
    await delay(500);

    const baseScore = 100;
    const totalImpact = signals.reduce((sum, s) => sum + s.scoreImpact, 0);
    const score = Math.max(0, Math.min(100, baseScore - totalImpact));

    return {
      score,
      signals,
      creditGranted: score < 40,
      creditAmount: score < 40 ? 25 : undefined,
    };
  },

  // Refund Agent - scripted conversation
  async sendMessage(
    _userMessage: string,
    conversationStep: number
  ): Promise<ChatMessage> {
    await delay(1000 + Math.random() * 500);

    const responses: Record<number, Partial<ChatMessage>> = {
      0: {
        content: "Hi! I see your order from MangoDB just arrived. Is something wrong?",
        suggestions: ["Wrong items delivered", "Food was cold", "Order never arrived"],
      },
      1: {
        content: "Thanks for letting me know. What did you receive instead?",
        suggestions: [
          "I got 2 Burritos and the Salad. Missing Taco & Fajita.",
          "Completely wrong order",
          "Some items missing"
        ],
      },
      2: {
        thinkingState: "Checking Inventory & Receipt (MongoDB)...",
        content: "I see. You ordered a Taco ($8), Fajita ($14), and Salad ($10) but received 2 Burritos ($12 each) and the Salad. Can you upload a photo of what you received?",
        suggestions: ["Upload photo"],
      },
      3: {
        thinkingState: "Analyzing photo with AI...",
        content: "I can see the items. Did you consume any of the incorrect items?",
        suggestions: [
          "I ate 80% of one burrito. The other is untouched.",
          "I haven't touched anything",
          "I ate everything already"
        ],
      },
      4: {
        content: "Okay. Since one burrito was mostly consumed, I cannot fully refund it. However, I can offer a negotiated partial refund.",
        proposalCard: {
          items: [
            { name: 'Burrito (Intact)', status: 'full', originalPrice: 12, refundAmount: 12, reason: 'Wrong item - untouched' },
            { name: 'Burrito (80% Eaten)', status: 'partial', originalPrice: 12, refundAmount: 5, reason: 'Wrong item - partially consumed' },
          ],
          totalRefund: 17,
        },
      },
    };

    const response = responses[conversationStep] || {
      content: "Is there anything else I can help you with?",
    };

    return {
      id: `msg-${Date.now()}`,
      agent: 'refund',
      content: response.content || '',
      timestamp: Date.now(),
      isUser: false,
      ...response,
    };
  },

  // Photo Analysis (mock)
  async analyzePhoto(_photoUrl: string): Promise<PhotoAnalysis> {
    await delay(2000);

    return {
      detected: ['Burrito (x2)', 'Salad Bowl', 'Napkins', 'Utensils'],
      matches: [
        { item: 'Burrito', confidence: 0.94 },
        { item: 'Burrito', confidence: 0.91 },
        { item: 'Salad', confidence: 0.88 },
      ],
      reasoning: "Detected 2 burritos and 1 salad. Order was for 1 Taco, 1 Fajita, 1 Salad. Confirms wrong items delivered. One burrito appears partially consumed (~80%).",
    };
  },

  // Process Refund (mock x402)
  async processRefund(proposal: RefundProposal): Promise<TransactionResult> {
    await delay(2500);

    return {
      success: true,
      amount: proposal.totalRefund,
      transactionHash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: Date.now(),
    };
  },
};

export type AgentService = typeof mockService;
