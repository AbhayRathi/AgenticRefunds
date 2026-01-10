import { Request, Response } from 'express';
import { RAGService } from '../services/rag';
import {
  DeliveryOrder,
  OrderStatus,
  SystemLog,
  LogEventType
} from '@delivery-shield/shared';

// Demo order matching MangoDB order
const DEMO_ORDER: DeliveryOrder = {
  orderId: 'order-1234',
  customerId: 'customer-123',
  restaurantId: 'mangodb-001',
  items: [
    { name: 'Chicken Taco', quantity: 1, price: 8 },
    { name: 'Steak Fajita', quantity: 1, price: 14 },
    { name: 'Side Salad', quantity: 1, price: 10 }
  ],
  totalAmount: 32,
  deliveryAddress: '123 Main St',
  orderTimestamp: Date.now() - 3600000, // 1 hour ago
  deliveryTimestamp: Date.now() - 1800000, // 30 min ago
  status: OrderStatus.DELIVERED
};

// Chat message request interface
interface ChatMessageRequest {
  sessionId?: string;
  orderId?: string;
  customerId?: string;
  message: string;
  step: number;
  context?: {
    photoUploaded?: boolean;
    consumptionLevel?: string;
    issueType?: string;
  };
}

// Chat message response matching frontend ChatMessage type
interface ChatMessageResponse {
  id: string;
  agent: 'trust' | 'refund' | 'system';
  content: string;
  timestamp: number;
  isUser: boolean;
  suggestions?: string[];
  thinkingState?: string;
  proposalCard?: {
    items: Array<{
      name: string;
      status: 'full' | 'partial' | 'none';
      originalPrice: number;
      refundAmount: number;
      reason: string;
    }>;
    totalRefund: number;
  };
}

export class ChatController {
  constructor(private ragService: RAGService) {}

  async handleMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, step, context } = req.body as ChatMessageRequest;

      if (message === undefined || step === undefined) {
        res.status(400).json({ error: 'Missing required fields: message and step' });
        return;
      }

      const response = await this.generateResponse(message, step, context);
      res.json(response);
    } catch (error) {
      console.error('Chat message error:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  }

  private async generateResponse(
    _message: string,
    step: number,
    context?: ChatMessageRequest['context']
  ): Promise<ChatMessageResponse> {
    const timestamp = Date.now();
    const baseResponse: ChatMessageResponse = {
      id: `msg-${timestamp}`,
      agent: 'refund',
      content: '',
      timestamp,
      isUser: false
    };

    switch (step) {
      case 0:
        // Greeting with suggestions
        return {
          ...baseResponse,
          content: "Hi! I see your order from MangoDB just arrived. Is something wrong?",
          suggestions: ["Wrong items delivered", "Food was cold", "Order never arrived"]
        };

      case 1:
        // Ask what they received
        return {
          ...baseResponse,
          content: "Thanks for letting me know. What did you receive instead?",
          suggestions: [
            "I got 2 Burritos and the Salad. Missing Taco & Fajita.",
            "Completely wrong order",
            "Some items missing"
          ]
        };

      case 2:
        // Use RAG to evaluate - include thinkingState
        try {
          const systemLogs: SystemLog[] = [
            {
              orderId: DEMO_ORDER.orderId,
              timestamp: Date.now() - 1800000,
              eventType: LogEventType.DELIVERY_COMPLETED,
              metadata: { note: 'Wrong items reported' }
            }
          ];

          // Call RAG service to evaluate
          await this.ragService.evaluateRefundRequest({
            orderId: DEMO_ORDER.orderId,
            systemLogs,
            deliveryOrder: DEMO_ORDER
          });

          return {
            ...baseResponse,
            thinkingState: "Checking Inventory & Receipt (MongoDB)...",
            content: "I see. You ordered a Taco ($8), Fajita ($14), and Salad ($10) but received 2 Burritos ($12 each) and the Salad. Can you upload a photo of what you received?",
            suggestions: ["Upload photo"]
          };
        } catch (error) {
          console.error('RAG evaluation error:', error);
          return {
            ...baseResponse,
            thinkingState: "Checking Inventory & Receipt (MongoDB)...",
            content: "I see. You ordered a Taco ($8), Fajita ($14), and Salad ($10) but received 2 Burritos ($12 each) and the Salad. Can you upload a photo of what you received?",
            suggestions: ["Upload photo"]
          };
        }

      case 3:
        // Ask about consumption with thinkingState for photo analysis
        return {
          ...baseResponse,
          thinkingState: "Analyzing photo with AI...",
          content: "I can see the items. Did you consume any of the incorrect items?",
          suggestions: [
            "I ate 80% of one burrito. The other is untouched.",
            "I haven't touched anything",
            "I ate everything already"
          ]
        };

      case 4:
        // Generate proposalCard based on consumption
        const consumptionLevel = context?.consumptionLevel || 'partial';

        if (consumptionLevel === 'none') {
          // Full refund for untouched items
          return {
            ...baseResponse,
            content: "Since you haven't touched the incorrect items, I can offer a full refund for the wrong items.",
            proposalCard: {
              items: [
                { name: 'Burrito #1', status: 'full', originalPrice: 12, refundAmount: 12, reason: 'Wrong item - untouched' },
                { name: 'Burrito #2', status: 'full', originalPrice: 12, refundAmount: 12, reason: 'Wrong item - untouched' }
              ],
              totalRefund: 24
            }
          };
        } else if (consumptionLevel === 'full') {
          // Minimal refund for consumed items
          return {
            ...baseResponse,
            content: "Since you consumed the items, I can only offer a courtesy credit.",
            proposalCard: {
              items: [
                { name: 'Burrito #1', status: 'partial', originalPrice: 12, refundAmount: 2, reason: 'Wrong item - fully consumed' },
                { name: 'Burrito #2', status: 'partial', originalPrice: 12, refundAmount: 2, reason: 'Wrong item - fully consumed' }
              ],
              totalRefund: 4
            }
          };
        } else {
          // Default: partial consumption scenario
          return {
            ...baseResponse,
            content: "Okay. Since one burrito was mostly consumed, I cannot fully refund it. However, I can offer a negotiated partial refund.",
            proposalCard: {
              items: [
                { name: 'Burrito (Intact)', status: 'full', originalPrice: 12, refundAmount: 12, reason: 'Wrong item - untouched' },
                { name: 'Burrito (80% Eaten)', status: 'partial', originalPrice: 12, refundAmount: 5, reason: 'Wrong item - partially consumed' }
              ],
              totalRefund: 17
            }
          };
        }

      default:
        // Default fallback
        return {
          ...baseResponse,
          content: "Is there anything else I can help you with?",
          suggestions: ["No, that's all", "I have another issue"]
        };
    }
  }

  async analyzePhoto(req: Request, res: Response): Promise<void> {
    try {
      const { photoUrl, expectedItems } = req.body;

      if (!photoUrl) {
        res.status(400).json({ error: 'photoUrl is required' });
        return;
      }

      const items = expectedItems || [
        { name: 'Chicken Taco', quantity: 1 },
        { name: 'Steak Fajita', quantity: 1 },
        { name: 'Side Salad', quantity: 1 }
      ];

      const analysis = await this.ragService.analyzePhoto(photoUrl, items);
      res.json(analysis);
    } catch (error) {
      console.error('Photo analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze photo' });
    }
  }
}
