import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { 
  RefundStatus, 
  LogEventType,
  OrderStatus
} from '@delivery-shield/shared';
import { securityMiddleware, rateLimiter, refundRateLimiter } from './middleware/security';
import { validateRequest } from './middleware/validation';
import {
  RAGEvaluationRequestSchema,
  RefundProcessRequestSchema,
  SimulationRequestSchema
} from './validators/refund.validators';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(securityMiddleware);
app.use(rateLimiter);

// Core middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: false,
      rag: true,
      cdp: false
    },
    mode: 'mock'
  });
});

// Mock refund evaluation
app.post('/api/refunds/evaluate', validateRequest(RAGEvaluationRequestSchema), (req, res) => {
  const { orderId, systemLogs } = req.body;
  
  // Simple mock logic: check for delayed deliveries
  const hasDelay = systemLogs.some((log: any) => 
    log.eventType === LogEventType.DELIVERY_DELAYED || 
    (log.latency && log.latency > 1800000)
  );

  const hasTemp = systemLogs.some((log: any) => 
    log.eventType === LogEventType.TEMPERATURE_VIOLATION
  );

  const hasErrors = systemLogs.filter((log: any) => 
    log.eventType === LogEventType.ERROR_OCCURRED
  ).length >= 3;

  let refundPercentage = 0;
  let matchedPolicies: any[] = [];
  let reasoning = '';

  if (hasDelay) {
    refundPercentage = 100;
    matchedPolicies.push({
      id: 'policy-1',
      title: 'Late Delivery Refund',
      refundPercentage: 100
    });
    reasoning = 'Your delivery was significantly delayed by more than 30 minutes. We apologize for the inconvenience and are issuing a full refund.';
  } else if (hasTemp) {
    refundPercentage = 50;
    matchedPolicies.push({
      id: 'policy-2',
      title: 'Cold Food Partial Refund',
      refundPercentage: 50
    });
    reasoning = 'Your food was delivered cold. We are issuing a 50% partial refund for the quality issue.';
  } else if (hasErrors) {
    refundPercentage = 30;
    matchedPolicies.push({
      id: 'policy-3',
      title: 'System Error Refund',
      refundPercentage: 30
    });
    reasoning = 'Multiple system errors occurred during your order processing. We are issuing a 30% refund.';
  } else {
    reasoning = 'Your order was delivered successfully without any issues. No refund is warranted.';
  }

  res.json({
    evaluation: {
      shouldRefund: refundPercentage > 0,
      refundPercentage,
      matchedPolicies,
      reasoning,
      confidence: 0.85
    }
  });
});

// Mock refund processing
app.post('/api/refunds/process', refundRateLimiter, validateRequest(RefundProcessRequestSchema), (req, res) => {
  const { orderId, customerId, customerWalletAddress, systemLogs, deliveryOrder } = req.body;

  // Reuse evaluation logic
  const hasDelay = systemLogs.some((log: any) => 
    log.eventType === LogEventType.DELIVERY_DELAYED || 
    (log.latency && log.latency > 1800000)
  );

  const hasTemp = systemLogs.some((log: any) => 
    log.eventType === LogEventType.TEMPERATURE_VIOLATION
  );

  const hasErrors = systemLogs.filter((log: any) => 
    log.eventType === LogEventType.ERROR_OCCURRED
  ).length >= 3;

  let refundPercentage = 0;
  let matchedPolicies: any[] = [];
  let reasoning = '';

  if (hasDelay) {
    refundPercentage = 100;
    matchedPolicies.push({
      id: 'policy-1',
      title: 'Late Delivery Refund',
      refundPercentage: 100
    });
    reasoning = 'Your delivery was significantly delayed by more than 30 minutes. We apologize for the inconvenience and have issued a full refund to your wallet.';
  } else if (hasTemp) {
    refundPercentage = 50;
    matchedPolicies.push({
      id: 'policy-2',
      title: 'Cold Food Partial Refund',
      refundPercentage: 50
    });
    reasoning = 'Your food was delivered cold. We have issued a 50% partial refund to your wallet for the quality issue.';
  } else if (hasErrors) {
    refundPercentage = 30;
    matchedPolicies.push({
      id: 'policy-3',
      title: 'System Error Refund',
      refundPercentage: 30
    });
    reasoning = 'Multiple system errors occurred during your order processing. We have issued a 30% refund to your wallet.';
  } else {
    reasoning = 'Your order was delivered successfully without any issues. No refund is warranted.';
  }

  const refundAmount = (deliveryOrder.totalAmount * refundPercentage / 100).toFixed(2);
  const mockTxHash = refundPercentage > 0 ? `0x${Math.random().toString(16).substr(2, 64)}` : undefined;

  res.json({
    refundId: `ref-${orderId}-${Date.now()}`,
    orderId,
    amount: parseFloat(refundAmount),
    status: refundPercentage > 0 ? RefundStatus.COMPLETED : RefundStatus.REJECTED,
    transactionHash: mockTxHash,
    timestamp: Date.now(),
    reasoning,
    matchedPolicies
  });
});

// Mock refund status
app.get('/api/refunds/status/:refundId', (req, res) => {
  const { refundId } = req.params;
  res.json({
    refundId,
    status: RefundStatus.COMPLETED,
    message: 'Mock refund status - always completed'
  });
});

// Mock delivery issue simulation
app.post('/api/refunds/simulate', validateRequest(SimulationRequestSchema), (req, res) => {
  const { issueType, latencyMs } = req.body;
  const now = Date.now();
  const systemLogs: any[] = [];

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
      systemLogs.push(
        {
          orderId: 'sim-' + now,
          timestamp: now,
          eventType: LogEventType.ERROR_OCCURRED,
          errorMessage: 'Payment processing error'
        },
        {
          orderId: 'sim-' + now,
          timestamp: now + 1000,
          eventType: LogEventType.ERROR_OCCURRED,
          errorMessage: 'Delivery routing error'
        },
        {
          orderId: 'sim-' + now,
          timestamp: now + 2000,
          eventType: LogEventType.ERROR_OCCURRED,
          errorMessage: 'API timeout'
        }
      );
      break;
    default:
      res.status(400).json({ error: 'Invalid issue type' });
      return;
  }

  res.json({ systemLogs });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Delivery Shield MOCK backend running on port ${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/health`);
  logger.info(`📍 API base: http://localhost:${PORT}/api`);
  logger.warn('⚠️  NOTE: This is a mock server for testing without external dependencies');
});
