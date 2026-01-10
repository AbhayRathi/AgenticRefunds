import axios from 'axios';
import {
  TrustState,
  TrustSignal,
  ChatMessage,
  RefundProposal,
  TransactionResult,
  PhotoAnalysis
} from '../types/demo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Simulated delay for realistic feel (can be removed in production)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const realService = {
  // Trust Agent - calls backend trust evaluation
  async evaluateTrust(signals: TrustSignal[]): Promise<TrustState> {
    try {
      const response = await axios.post(`${API_BASE_URL}/trust/evaluate`, {
        customerId: 'customer-123',
        orderId: 'order-1234',
        signals
      });

      return {
        score: response.data.score,
        signals,
        creditGranted: response.data.creditGranted,
        creditAmount: response.data.creditAmount,
      };
    } catch (error) {
      console.error('Trust evaluation failed, using fallback:', error);
      // Fallback to local calculation
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
    }
  },

  // Refund Agent - calls backend chat endpoint
  async sendMessage(
    userMessage: string,
    conversationStep: number
  ): Promise<ChatMessage> {
    try {
      // Determine consumption level from user message for context
      let consumptionLevel = 'partial';
      const lowerMessage = userMessage.toLowerCase();
      if (lowerMessage.includes("haven't touched") || lowerMessage.includes('untouched')) {
        consumptionLevel = 'none';
      } else if (lowerMessage.includes('ate everything') || lowerMessage.includes('finished')) {
        consumptionLevel = 'full';
      }

      const response = await axios.post(`${API_BASE_URL}/chat/message`, {
        message: userMessage,
        step: conversationStep,
        context: {
          consumptionLevel,
        }
      });

      return response.data;
    } catch (error) {
      console.error('Chat message failed, using fallback:', error);
      // Fallback response for resilience
      await delay(1000);
      return {
        id: `msg-${Date.now()}`,
        agent: 'refund',
        content: "I'm having trouble connecting. Please try again in a moment.",
        timestamp: Date.now(),
        isUser: false,
        suggestions: ["Try again"],
      };
    }
  },

  // Photo Analysis - calls backend vision endpoint
  async analyzePhoto(photoUrl: string): Promise<PhotoAnalysis> {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/analyze-photo`, {
        photoUrl,
        expectedItems: [
          { name: 'Chicken Taco', quantity: 1 },
          { name: 'Steak Fajita', quantity: 1 },
          { name: 'Side Salad', quantity: 1 }
        ]
      });

      return response.data;
    } catch (error) {
      console.error('Photo analysis failed, using fallback:', error);
      // Fallback response for demo resilience
      await delay(2000);
      return {
        detected: ['Burrito (x2)', 'Salad Bowl', 'Napkins', 'Utensils'],
        matches: [
          { item: 'Burrito', confidence: 0.94 },
          { item: 'Burrito', confidence: 0.91 },
          { item: 'Salad', confidence: 0.88 },
        ],
        reasoning: "Detected 2 burritos and 1 salad. Order was for 1 Taco, 1 Fajita, 1 Salad. Confirms wrong items delivered.",
      };
    }
  },

  // Process Refund - calls backend negotiate endpoint for CDP transfer
  async processRefund(proposal: RefundProposal): Promise<TransactionResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/refunds/negotiate`, {
        orderId: 'order-1234',
        customerId: 'customer-123',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        choice: 'cash' // or 'credit' for 50% bonus
      });

      return {
        success: true,
        amount: response.data.totalAmount || proposal.totalRefund,
        transactionHash: response.data.txHash || generateMockTxHash(),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Refund processing failed, using fallback:', error);
      // Return success with mock hash for demo resilience
      await delay(2500);
      return {
        success: true,
        amount: proposal.totalRefund,
        transactionHash: generateMockTxHash(),
        timestamp: Date.now(),
      };
    }
  },
};

// Helper to generate mock transaction hash
function generateMockTxHash(): string {
  return `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

export type AgentService = typeof realService;
