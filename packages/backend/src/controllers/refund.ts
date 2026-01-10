import { Request, Response } from 'express';
import { 
  RefundRequest, 
  RefundResponse, 
  RefundStatus,
  RAGEvaluationRequest,
  SystemLog,
  LogEventType
} from '@delivery-shield/shared';
import { RAGService } from '../services/rag';
import { CDPService } from '../services/cdp';
import { PaymentService } from '../services/payment';
import { ledgerService } from '../services/ledger';
import { logger } from '../config/logger';

// Constants
const DEMO_REFUND_AMOUNT = 8.0; // Hardcoded for demo; replace with RAG evaluation in production

export class RefundController {
  private paymentService: PaymentService;

  constructor(
    private ragService: RAGService,
    private cdpService: CDPService
  ) {
    this.paymentService = new PaymentService(cdpService);
  }

  async evaluateRefund(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, customerId, systemLogs, deliveryOrder } = req.body;

      if (!orderId || !customerId || !systemLogs || !deliveryOrder) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const evaluationRequest: RAGEvaluationRequest = {
        orderId,
        systemLogs,
        deliveryOrder
      };

      const evaluation = await this.ragService.evaluateRefundRequest(evaluationRequest);

      res.json({
        evaluation,
        message: evaluation.shouldRefund 
          ? 'Refund approved' 
          : 'Refund not approved based on current policies'
      });
    } catch (error) {
      console.error('Refund evaluation error:', error);
      res.status(500).json({ error: 'Failed to evaluate refund' });
    }
  }

  async processRefund(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, customerId, customerWalletAddress, systemLogs, deliveryOrder } = req.body;

      if (!orderId || !customerId || !customerWalletAddress || !systemLogs || !deliveryOrder) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Step 1: Evaluate refund using RAG
      const evaluationRequest: RAGEvaluationRequest = {
        orderId,
        systemLogs,
        deliveryOrder
      };

      const evaluation = await this.ragService.evaluateRefundRequest(evaluationRequest);

      if (!evaluation.shouldRefund) {
        res.json({
          refundId: `ref-${orderId}-${Date.now()}`,
          orderId,
          amount: 0,
          status: RefundStatus.REJECTED,
          reasoning: evaluation.reasoning,
          timestamp: Date.now()
        } as RefundResponse);
        return;
      }

      // Step 2: Calculate refund amount
      const refundAmount = (deliveryOrder.totalAmount * evaluation.refundPercentage / 100).toFixed(2);

      // Step 3: Process transfer via CDP
      const transferResult = await this.cdpService.transfer({
        recipientAddress: customerWalletAddress,
        amount: refundAmount,
        currency: 'USDC',
        orderId
      });

      // Step 4: Return refund response
      const refundResponse: RefundResponse = {
        refundId: `ref-${orderId}-${Date.now()}`,
        orderId,
        amount: parseFloat(refundAmount),
        status: transferResult.success ? RefundStatus.COMPLETED : RefundStatus.FAILED,
        transactionHash: transferResult.transactionHash,
        timestamp: Date.now()
      };

      res.json({
        ...refundResponse,
        reasoning: evaluation.reasoning,
        matchedPolicies: evaluation.matchedPolicies
      });
    } catch (error) {
      console.error('Refund processing error:', error);
      res.status(500).json({ error: 'Failed to process refund' });
    }
  }

  async getRefundStatus(req: Request, res: Response): Promise<void> {
    try {
      const { refundId } = req.params;
      
      // In a real implementation, this would query a database
      res.json({
        refundId,
        status: RefundStatus.COMPLETED,
        message: 'Refund status retrieved'
      });
    } catch (error) {
      console.error('Refund status error:', error);
      res.status(500).json({ error: 'Failed to get refund status' });
    }
  }

  async simulateDeliveryIssue(req: Request, res: Response): Promise<void> {
    try {
      const { issueType, latencyMs } = req.body;

      const systemLogs: SystemLog[] = [];
      const now = Date.now();

      switch (issueType) {
        case 'LATE_DELIVERY':
          systemLogs.push({
            orderId: 'sim-' + now,
            timestamp: now,
            eventType: LogEventType.DELIVERY_DELAYED,
            latency: latencyMs || 2000000,
            metadata: { reason: 'Traffic delay' }
          });
          break;
        case 'COLD_FOOD':
          systemLogs.push({
            orderId: 'sim-' + now,
            timestamp: now,
            eventType: LogEventType.TEMPERATURE_VIOLATION,
            metadata: { temperature: 40 }
          });
          break;
        case 'SYSTEM_ERROR':
          systemLogs.push({
            orderId: 'sim-' + now,
            timestamp: now,
            eventType: LogEventType.ERROR_OCCURRED,
            errorMessage: 'Payment processing error'
          });
          systemLogs.push({
            orderId: 'sim-' + now,
            timestamp: now + 1000,
            eventType: LogEventType.ERROR_OCCURRED,
            errorMessage: 'Delivery routing error'
          });
          systemLogs.push({
            orderId: 'sim-' + now,
            timestamp: now + 2000,
            eventType: LogEventType.ERROR_OCCURRED,
            errorMessage: 'API timeout'
          });
          break;
        default:
          res.status(400).json({ error: 'Invalid issue type' });
          return;
      }

      res.json({
        systemLogs,
        message: `Simulated ${issueType} issue`
      });
    } catch (error) {
      console.error('Simulation error:', error);
      res.status(500).json({ error: 'Failed to simulate issue' });
    }
  }

  async negotiateRefund(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, customerId, walletAddress, choice } = req.body;

      // Validate choice
      if (!['cash', 'credit'].includes(choice)) {
        res.status(400).json({ error: 'Invalid choice. Must be "cash" or "credit"' });
        return;
      }

      // For demo: assume refund already evaluated
      // In real flow, you'd call ragService.evaluateRefund first
      const result = await this.paymentService.processRefund(
        customerId,
        DEMO_REFUND_AMOUNT,
        walletAddress,
        choice as 'cash' | 'credit'
      );

      const response = {
        orderId,
        customerId,
        approved: true,
        baseAmount: DEMO_REFUND_AMOUNT,
        bonusAmount: choice === 'credit' ? DEMO_REFUND_AMOUNT * 0.5 : 0,
        totalAmount: choice === 'credit' ? DEMO_REFUND_AMOUNT * 1.5 : DEMO_REFUND_AMOUNT,
        ...result
      };

      logger.info('Negotiate refund completed', response);
      res.json(response);
    } catch (error) {
      logger.error('Negotiate refund failed', { error });
      res.status(500).json({ error: 'Failed to process negotiation' });
    }
  }

  async getUserLedger(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const balance = ledgerService.getBalance(userId);
      const wallet = ledgerService.getWalletAddress(userId);

      res.json({
        userId,
        storeCreditBalance: balance,
        walletAddress: wallet || 'Not set'
      });
    } catch (error) {
      logger.error('Get ledger failed', { error });
      res.status(500).json({ error: 'Failed to fetch ledger' });
    }
  }
}
