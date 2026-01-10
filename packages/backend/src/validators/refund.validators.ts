import { z } from 'zod';
import { 
  LogEventType, 
  OrderStatus, 
  ConditionType, 
  ComparisonOperator 
} from '@delivery-shield/shared';

// System Log Schema
export const SystemLogSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  timestamp: z.number().int().positive('Timestamp must be positive'),
  eventType: z.nativeEnum(LogEventType),
  latency: z.number().int().nonnegative().optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

// Order Item Schema
export const OrderItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().nonnegative('Price must be non-negative')
});

// Delivery Order Schema
export const DeliveryOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  orderTimestamp: z.number().int().positive(),
  deliveryTimestamp: z.number().int().positive().optional(),
  status: z.nativeEnum(OrderStatus)
});

// RAG Evaluation Request Schema
export const RAGEvaluationRequestSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  systemLogs: z.array(SystemLogSchema).min(1, 'At least one system log is required'),
  deliveryOrder: DeliveryOrderSchema
});

// Refund Process Request Schema
export const RefundProcessRequestSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  customerWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address'),
  systemLogs: z.array(SystemLogSchema).min(1, 'At least one system log is required'),
  deliveryOrder: DeliveryOrderSchema
});

// Simulation Request Schema
export const SimulationRequestSchema = z.object({
  issueType: z.enum(['LATE_DELIVERY', 'COLD_FOOD', 'SYSTEM_ERROR']),
  latencyMs: z.number().int().nonnegative().optional()
});

// Negotiate Refund Schema
export const NegotiateRefundSchema = z.object({
  orderId: z.string().min(1, 'Order ID required'),
  customerId: z.string().min(1, 'Customer ID required'),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  choice: z.enum(['cash', 'credit']).refine(
    (val) => ['cash', 'credit'].includes(val),
    { message: 'Choice must be "cash" or "credit"' }
  )
});

// Type exports for use in controllers
export type RAGEvaluationRequest = z.infer<typeof RAGEvaluationRequestSchema>;
export type RefundProcessRequest = z.infer<typeof RefundProcessRequestSchema>;
export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;
export type NegotiateRefundRequest = z.infer<typeof NegotiateRefundSchema>;
