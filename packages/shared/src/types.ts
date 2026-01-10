import { z } from 'zod';

// x402 Protocol Types
export interface X402Payment {
  amount: string;
  currency: string;
  recipient: string;
  sender: string;
  timestamp: number;
  transactionHash?: string;
}

export interface X402Request {
  payment: X402Payment;
  metadata?: Record<string, any>;
}

export interface X402Response {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

// Delivery and Order Types
export interface DeliveryOrder {
  orderId: string;
  customerId: string;
  restaurantId: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  orderTimestamp: number;
  deliveryTimestamp?: number;
  status: OrderStatus;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// System Logs and Metrics
export interface SystemLog {
  orderId: string;
  timestamp: number;
  eventType: LogEventType;
  latency?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export enum LogEventType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_PREPARED = 'ORDER_PREPARED',
  DELIVERY_STARTED = 'DELIVERY_STARTED',
  DELIVERY_DELAYED = 'DELIVERY_DELAYED',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  TEMPERATURE_VIOLATION = 'TEMPERATURE_VIOLATION'
}

// Refund Types
export interface RefundRequest {
  orderId: string;
  customerId: string;
  reason: RefundReason;
  amount: number;
  isPartial: boolean;
  timestamp: number;
}

export enum RefundReason {
  COLD_FOOD = 'COLD_FOOD',
  LATE_DELIVERY = 'LATE_DELIVERY',
  WRONG_ORDER = 'WRONG_ORDER',
  MISSING_ITEMS = 'MISSING_ITEMS',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  OTHER = 'OTHER'
}

export interface RefundResponse {
  refundId: string;
  orderId: string;
  amount: number;
  status: RefundStatus;
  transactionHash?: string;
  timestamp: number;
}

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// RAG Policy Types
export interface RefundPolicy {
  id: string;
  title: string;
  description: string;
  conditions: PolicyCondition[];
  refundPercentage: number;
  embedding?: number[];
}

export interface PolicyCondition {
  type: ConditionType;
  threshold: number;
  operator: ComparisonOperator;
}

export enum ConditionType {
  DELIVERY_LATENCY = 'DELIVERY_LATENCY',
  TEMPERATURE = 'TEMPERATURE',
  ERROR_COUNT = 'ERROR_COUNT',
  CUSTOMER_COMPLAINTS = 'CUSTOMER_COMPLAINTS'
}

export enum ComparisonOperator {
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  EQUAL_TO = 'EQUAL_TO'
}

// RAG Evaluation Types
export interface RAGEvaluationRequest {
  orderId: string;
  systemLogs: SystemLog[];
  deliveryOrder: DeliveryOrder;
}

export interface RAGEvaluationResponse {
  shouldRefund: boolean;
  refundPercentage: number;
  matchedPolicies: RefundPolicy[];
  reasoning: string;
  confidence: number;
}

// CDP Transfer Types
export interface TransferRequest {
  recipientAddress: string;
  amount: string;
  currency: string;
  orderId: string;
}

export interface TransferResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalOrders: number;
  totalRefunds: number;
  totalRefundAmount: number;
  averageRefundPercentage: number;
  pendingRefunds: number;
}

export interface SimulationConfig {
  enableLatency: boolean;
  latencyMs?: number;
}

// Agentic Commerce Types
export enum ToolCategory {
  LOGISTICS = 'Logistics',
  FOOD = 'Food',
  RESOLUTION = 'Resolution'
}

export enum AgentSessionStatus {
  PLANNING = 'Planning',
  PAYING = 'Paying',
  MONITORING = 'Monitoring',
  RESOLVING = 'Resolving'
}

export enum ThoughtLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  DEBUG = 'debug'
}

// X402Tool Interface
export interface X402Tool {
  name: string;
  version: string;
  endpoint: string;
  priceUsdc: number;
  category: ToolCategory;
  reliabilityScore: number;
}

// AgentSession Interface
export interface AgentSession {
  session_id: string;
  status: AgentSessionStatus;
  totalSpent: number;
  thoughtLog: ThoughtLogEntry[];
}

export interface ThoughtLogEntry {
  timestamp: number;
  level: ThoughtLevel;
  message: string;
}

// ReputationIndex for tracking incidents
export interface ReputationIncident {
  toolId: string;
  incidentType: 'Cold' | 'Late' | 'Missing' | 'Wrong';
  orderId: string;
  timestamp: number;
  severity: number; // 0-1 scale
}

// Zod Schemas for X402Tool
export const X402ToolSchema = z.object({
  name: z.string().min(1, 'Tool name is required'),
  version: z.string().min(1, 'Version is required'),
  endpoint: z.string().url('Valid endpoint URL is required'),
  priceUsdc: z.number().nonnegative('Price must be non-negative'),
  category: z.nativeEnum(ToolCategory),
  reliabilityScore: z.number().min(0).max(1, 'Reliability score must be between 0 and 1')
});

// Zod Schema for ThoughtLogEntry
export const ThoughtLogEntrySchema = z.object({
  timestamp: z.number().int().positive('Timestamp must be positive'),
  level: z.nativeEnum(ThoughtLevel),
  message: z.string().min(1, 'Message is required')
});

// Zod Schema for AgentSession
export const AgentSessionSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required'),
  status: z.nativeEnum(AgentSessionStatus),
  totalSpent: z.number().nonnegative('Total spent must be non-negative'),
  thoughtLog: z.array(ThoughtLogEntrySchema)
});

// Type exports for use in other modules
export type X402ToolType = z.infer<typeof X402ToolSchema>;
export type AgentSessionType = z.infer<typeof AgentSessionSchema>;
export type ThoughtLogEntryType = z.infer<typeof ThoughtLogEntrySchema>;
