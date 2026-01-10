import {
  SystemLogSchema,
  DeliveryOrderSchema,
  RAGEvaluationRequestSchema,
  RefundProcessRequestSchema,
  SimulationRequestSchema
} from '../../validators/refund.validators';
import { LogEventType, OrderStatus } from '@delivery-shield/shared';

describe('Refund Validators', () => {
  describe('SystemLogSchema', () => {
    it('should validate a valid system log', () => {
      const validLog = {
        orderId: 'order-123',
        timestamp: Date.now(),
        eventType: LogEventType.ORDER_CREATED
      };

      const result = SystemLogSchema.safeParse(validLog);
      expect(result.success).toBe(true);
    });

    it('should reject log with missing orderId', () => {
      const invalidLog = {
        timestamp: Date.now(),
        eventType: LogEventType.ORDER_CREATED
      };

      const result = SystemLogSchema.safeParse(invalidLog);
      expect(result.success).toBe(false);
    });

    it('should reject log with invalid timestamp', () => {
      const invalidLog = {
        orderId: 'order-123',
        timestamp: -1,
        eventType: LogEventType.ORDER_CREATED
      };

      const result = SystemLogSchema.safeParse(invalidLog);
      expect(result.success).toBe(false);
    });
  });

  describe('DeliveryOrderSchema', () => {
    it('should validate a valid delivery order', () => {
      const validOrder = {
        orderId: 'order-123',
        customerId: 'cust-123',
        restaurantId: 'rest-123',
        items: [
          { name: 'Pizza', quantity: 1, price: 15.99 }
        ],
        totalAmount: 15.99,
        deliveryAddress: '123 Main St',
        orderTimestamp: Date.now(),
        status: OrderStatus.PENDING
      };

      const result = DeliveryOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should reject order with empty items array', () => {
      const invalidOrder = {
        orderId: 'order-123',
        customerId: 'cust-123',
        restaurantId: 'rest-123',
        items: [],
        totalAmount: 15.99,
        deliveryAddress: '123 Main St',
        orderTimestamp: Date.now(),
        status: OrderStatus.PENDING
      };

      const result = DeliveryOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject order with negative total amount', () => {
      const invalidOrder = {
        orderId: 'order-123',
        customerId: 'cust-123',
        restaurantId: 'rest-123',
        items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
        totalAmount: -15.99,
        deliveryAddress: '123 Main St',
        orderTimestamp: Date.now(),
        status: OrderStatus.PENDING
      };

      const result = DeliveryOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });

  describe('RefundProcessRequestSchema', () => {
    it('should validate a valid refund process request', () => {
      const validRequest = {
        orderId: 'order-123',
        customerId: 'cust-123',
        customerWalletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbF',
        systemLogs: [
          {
            orderId: 'order-123',
            timestamp: Date.now(),
            eventType: LogEventType.ORDER_CREATED
          }
        ],
        deliveryOrder: {
          orderId: 'order-123',
          customerId: 'cust-123',
          restaurantId: 'rest-123',
          items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
          totalAmount: 15.99,
          deliveryAddress: '123 Main St',
          orderTimestamp: Date.now(),
          status: OrderStatus.PENDING
        }
      };

      const result = RefundProcessRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject request with invalid wallet address', () => {
      const invalidRequest = {
        orderId: 'order-123',
        customerId: 'cust-123',
        customerWalletAddress: 'invalid-address',
        systemLogs: [
          {
            orderId: 'order-123',
            timestamp: Date.now(),
            eventType: LogEventType.ORDER_CREATED
          }
        ],
        deliveryOrder: {
          orderId: 'order-123',
          customerId: 'cust-123',
          restaurantId: 'rest-123',
          items: [{ name: 'Pizza', quantity: 1, price: 15.99 }],
          totalAmount: 15.99,
          deliveryAddress: '123 Main St',
          orderTimestamp: Date.now(),
          status: OrderStatus.PENDING
        }
      };

      const result = RefundProcessRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('SimulationRequestSchema', () => {
    it('should validate valid simulation request types', () => {
      const validTypes = ['LATE_DELIVERY', 'COLD_FOOD', 'SYSTEM_ERROR'];

      validTypes.forEach(issueType => {
        const result = SimulationRequestSchema.safeParse({ issueType });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid simulation type', () => {
      const invalidRequest = {
        issueType: 'INVALID_TYPE'
      };

      const result = SimulationRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept optional latencyMs parameter', () => {
      const validRequest = {
        issueType: 'LATE_DELIVERY',
        latencyMs: 2000000
      };

      const result = SimulationRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });
});
