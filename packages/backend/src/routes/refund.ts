import { Router } from 'express';
import { RefundController } from '../controllers/refund';

export function createRefundRoutes(refundController: RefundController): Router {
  const router = Router();

  // Evaluate refund eligibility without processing
  router.post('/evaluate', (req, res) => refundController.evaluateRefund(req, res));

  // Process a refund (evaluate + transfer)
  router.post('/process', (req, res) => refundController.processRefund(req, res));

  // Get refund status
  router.get('/status/:refundId', (req, res) => refundController.getRefundStatus(req, res));

  // Simulate delivery issues for testing
  router.post('/simulate', (req, res) => refundController.simulateDeliveryIssue(req, res));

  return router;
}
