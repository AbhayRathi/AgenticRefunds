// Trust Score System
export type TrustSignalType =
  | 'RAGE_TAP'
  | 'FAST_NAVIGATION'
  | 'RECEIPT_SCRUB'
  | 'NEGATIVE_CHIP'
  | 'ABANDONED_DRAFT';

export interface TrustSignal {
  type: TrustSignalType;
  timestamp: number;
  details?: string;
  scoreImpact: number;
}

export interface TrustState {
  score: number;
  signals: TrustSignal[];
  creditGranted: boolean;
  creditAmount?: number;
}

// Chat System
export type AgentType = 'trust' | 'refund' | 'system';

export interface ChatMessage {
  id: string;
  agent: AgentType;
  content: string;
  timestamp: number;
  isUser: boolean;
  suggestions?: string[];
  proposalCard?: RefundProposal;
  thinkingState?: string;
  transactionComplete?: TransactionResult;
}

export interface RefundProposal {
  items: ProposalItem[];
  totalRefund: number;
}

export interface ProposalItem {
  name: string;
  status: 'full' | 'partial' | 'none';
  originalPrice: number;
  refundAmount: number;
  reason: string;
}

export interface TransactionResult {
  success: boolean;
  amount: number;
  transactionHash: string;
  timestamp: number;
}

// Demo Order Data
export interface DemoOrder {
  id: string;
  restaurant: {
    name: string;
    image: string;
    rating: number;
  };
  items: DemoOrderItem[];
  total: number;
  deliveryTime: string;
  status: 'delivered' | 'in_progress';
  date: string;
}

export interface DemoOrderItem {
  name: string;
  quantity: number;
  price: number;
  customizations?: string[];
}

// View Navigation
export type MobileView = 'history' | 'detail' | 'chat';

// Broadcast Events (cross-panel communication)
export type BroadcastEvent =
  | { type: 'TRUST_SIGNAL'; payload: TrustSignal }
  | { type: 'TRUST_UPDATE'; payload: TrustState }
  | { type: 'CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'PHOTO_UPLOADED'; payload: { url: string } }
  | { type: 'PHOTO_ANALYZED'; payload: PhotoAnalysis }
  | { type: 'TRANSACTION_COMPLETE'; payload: TransactionResult };

export interface PhotoAnalysis {
  detected: string[];
  matches: { item: string; confidence: number }[];
  reasoning: string;
}
