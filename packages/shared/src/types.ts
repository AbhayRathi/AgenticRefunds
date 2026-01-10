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
