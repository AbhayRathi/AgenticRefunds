import { Router } from 'express';
import { RefundController } from '../controllers/refund';
import { validateRequest } from '../middleware/validation';
import { refundRateLimiter } from '../middleware/security';
import {
  RAGEvaluationRequestSchema,
  RefundProcessRequestSchema,
  SimulationRequestSchema,
  NegotiateRefundSchema
} from '../validators/refund.validators';

export function createRefundRoutes(refundController: RefundController): Router {
  const router = Router();

  // Evaluate refund eligibility without processing
  router.post(
    '/evaluate',
    validateRequest(RAGEvaluationRequestSchema),
    (req, res) => refundController.evaluateRefund(req, res)
  );

  // Process a refund (evaluate + transfer)
  router.post(
    '/process',
    refundRateLimiter,
    validateRequest(RefundProcessRequestSchema),
    (req, res) => refundController.processRefund(req, res)
  );

  // Get refund status
  router.get('/status/:refundId', (req, res) => refundController.getRefundStatus(req, res));

  // Simulate delivery issues for testing
  router.post(
    '/simulate',
    validateRequest(SimulationRequestSchema),
    (req, res) => refundController.simulateDeliveryIssue(req, res)
  );

  // Negotiate refund (credit vs cash choice)
  router.post(
    '/negotiate',
    validateRequest(NegotiateRefundSchema),
    (req, res) => refundController.negotiateRefund(req, res)
  );

  // Get user ledger balance
  router.get('/ledger/:userId', (req, res) => refundController.getUserLedger(req, res));

  return router;
}
