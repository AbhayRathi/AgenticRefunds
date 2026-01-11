# DoorDash Clone Demo - Backend Integration Guide

This document describes the integration points between the frontend demo and the backend services. The frontend currently uses mock implementations that can be swapped for real backend calls.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend Demo                                 │
│  ┌─────────────────────┐         ┌─────────────────────────────┐   │
│  │   Mobile App        │◄───────►│   Agent Dashboard           │   │
│  │   (Customer View)   │         │   (Judges View)             │   │
│  └──────────┬──────────┘         └──────────────┬──────────────┘   │
│             │      BroadcastChannel API         │                   │
│             └───────────────┬───────────────────┘                   │
│                             │                                        │
│                    ┌────────▼────────┐                              │
│                    │  Service Layer  │                              │
│                    │  (mock.ts)      │                              │
│                    └────────┬────────┘                              │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              │ SWAP POINT: mock.ts → real.ts
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Backend Services                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ Trust Agent │  │ Refund Agent│  │ Photo ML    │  │ x402      │  │
│  │ (Gemini)    │  │ (RAG+Gemini)│  │ (Vision AI) │  │ (CDP SDK) │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                                   │                                  │
│                          ┌────────▼────────┐                        │
│                          │  MongoDB Atlas  │                        │
│                          │  (Vector Search)│                        │
│                          └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Trust Score System

### Frontend Implementation (Mock)

**File**: `packages/frontend/src/hooks/useTrustScore.ts`

The frontend detects user frustration signals and calculates a trust score locally.

#### Signal Types & Impacts

| Signal Type | Impact | Detection Logic |
|-------------|--------|-----------------|
| `RAGE_TAP` | -15 | 3+ clicks on same element within 1.5 seconds |
| `FAST_NAVIGATION` | -10 | 2+ view switches within 10 seconds |
| `RECEIPT_SCRUB` | -8 | Toggling receipt details 2+ times |
| `NEGATIVE_CHIP` | -20 | Clicking "This is unacceptable" button |
| `ABANDONED_DRAFT` | -12 | Starting but not completing a message |

#### Trust Score Calculation (Mock)

```typescript
// packages/frontend/src/services/mock.ts
async evaluateTrust(signals: TrustSignal[]): Promise<TrustState> {
  const baseScore = 100;
  const totalImpact = signals.reduce((sum, s) => sum + s.scoreImpact, 0);
  const score = Math.max(0, Math.min(100, baseScore - totalImpact));

  return {
    score,
    signals,
    creditGranted: score < 40,
    creditAmount: score < 40 ? 25 : undefined,
  };
}
```

### Backend Integration Point

**Endpoint**: `POST /api/trust/evaluate`

**Request**:
```json
{
  "customerId": "customer-123",
  "orderId": "order-1234",
  "signals": [
    {
      "type": "RAGE_TAP",
      "timestamp": 1704900000000,
      "details": "5 taps on order-1234",
      "scoreImpact": 15
    },
    {
      "type": "NEGATIVE_CHIP",
      "timestamp": 1704900005000,
      "details": "Clicked 'This is unacceptable'",
      "scoreImpact": 20
    }
  ]
}
```

**Response**:
```json
{
  "score": 65,
  "signals": [...],
  "creditGranted": false,
  "creditAmount": null,
  "reasoning": "Customer showing moderate frustration. 2 signals detected within 5 seconds.",
  "recommendation": "MONITOR"
}
```

#### Backend Trust Score Algorithm (Recommended)

```python
def calculate_trust_score(signals: List[TrustSignal], customer_history: CustomerHistory) -> TrustState:
    base_score = 100

    # Apply signal impacts with decay
    total_impact = 0
    for signal in signals:
        age_seconds = (now() - signal.timestamp) / 1000
        decay_factor = max(0.5, 1 - (age_seconds / 300))  # Decay over 5 minutes
        total_impact += signal.score_impact * decay_factor

    # Adjust for customer history
    if customer_history.previous_refunds > 3:
        total_impact *= 0.8  # Reduce impact for repeat customers

    score = max(0, min(100, base_score - total_impact))

    # Proactive credit threshold
    credit_granted = score < 40
    credit_amount = 25 if credit_granted else None

    return TrustState(
        score=score,
        signals=signals,
        credit_granted=credit_granted,
        credit_amount=credit_amount
    )
```

---

## 2. Refund Agent Chat System

### Frontend Implementation (Mock)

**File**: `packages/frontend/src/services/mock.ts`

The frontend uses a scripted conversation flow with predefined responses at each step.

#### Conversation Steps

| Step | Agent Message | User Options |
|------|---------------|--------------|
| 0 | "Hi! I see your order just arrived. Is something wrong?" | Wrong items, Food cold, Never arrived |
| 1 | "What did you receive instead?" | Specific items, Wrong order, Missing items |
| 2 | "Can you upload a photo?" | Upload photo |
| 3 | "Did you consume any incorrect items?" | 80% eaten, Untouched, Ate everything |
| 4 | Proposal card with refund breakdown | Accept, Decline |

### Backend Integration Point

**Endpoint**: `POST /api/chat/message`

**Request**:
```json
{
  "orderId": "order-1234",
  "customerId": "customer-123",
  "sessionId": "chat-session-456",
  "message": "I got 2 Burritos and the Salad. Missing Taco & Fajita.",
  "step": 2,
  "context": {
    "trustScore": 65,
    "photoAnalysis": null
  }
}
```

**Response**:
```json
{
  "id": "msg-789",
  "agent": "refund",
  "content": "I see. You ordered a Taco ($8), Fajita ($14), and Salad ($10) but received 2 Burritos ($12 each) and the Salad. Can you upload a photo?",
  "timestamp": 1704900010000,
  "isUser": false,
  "thinkingState": "Checking Inventory & Receipt (MongoDB)...",
  "suggestions": ["Upload photo"],
  "ragContext": {
    "policiesRetrieved": ["wrong-item-policy", "partial-refund-policy"],
    "inventoryChecked": true,
    "receiptVerified": true
  }
}
```

#### Backend RAG Integration

The Refund Agent should use MongoDB Atlas Vector Search to retrieve relevant policies:

```javascript
// Backend: RAG policy retrieval
async function getRelevantPolicies(issue: string, orderDetails: Order) {
  const embedding = await gemini.embed(issue);

  const policies = await mongodb.collection('refund_policies').aggregate([
    {
      $vectorSearch: {
        index: "policy_embeddings",
        path: "embedding",
        queryVector: embedding,
        numCandidates: 100,
        limit: 5
      }
    }
  ]).toArray();

  return policies;
}
```

---

## 3. Photo Analysis System

### Frontend Implementation (Mock)

**File**: `packages/frontend/src/services/mock.ts`

```typescript
async analyzePhoto(photoUrl: string): Promise<PhotoAnalysis> {
  return {
    detected: ['Burrito (x2)', 'Salad Bowl', 'Napkins', 'Utensils'],
    matches: [
      { item: 'Burrito', confidence: 0.94 },
      { item: 'Burrito', confidence: 0.91 },
      { item: 'Salad', confidence: 0.88 },
    ],
    reasoning: "Detected 2 burritos and 1 salad. Order was for 1 Taco, 1 Fajita, 1 Salad. Confirms wrong items delivered. One burrito appears partially consumed (~80%).",
  };
}
```

### Backend Integration Point

**Endpoint**: `POST /api/chat/analyze-photo`

**Request**:
```json
{
  "orderId": "order-1234",
  "photoUrl": "https://storage.example.com/photos/claim-789.jpg",
  "expectedItems": [
    { "name": "Chicken Taco", "quantity": 1 },
    { "name": "Steak Fajita", "quantity": 1 },
    { "name": "Side Salad", "quantity": 1 }
  ]
}
```

**Response**:
```json
{
  "detected": ["Burrito (x2)", "Salad Bowl", "Napkins", "Utensils"],
  "matches": [
    { "item": "Burrito", "confidence": 0.94, "boundingBox": [100, 50, 300, 250] },
    { "item": "Burrito", "confidence": 0.91, "boundingBox": [320, 50, 520, 250] },
    { "item": "Salad", "confidence": 0.88, "boundingBox": [150, 280, 350, 480] }
  ],
  "discrepancies": [
    { "expected": "Chicken Taco", "found": null, "status": "MISSING" },
    { "expected": "Steak Fajita", "found": null, "status": "MISSING" },
    { "expected": null, "found": "Burrito", "status": "UNEXPECTED", "count": 2 }
  ],
  "consumptionAnalysis": {
    "item": "Burrito",
    "estimatedConsumed": 0.8,
    "confidence": 0.85
  },
  "reasoning": "Detected 2 burritos and 1 salad. Order was for 1 Taco, 1 Fajita, 1 Salad. Confirms wrong items delivered. One burrito appears partially consumed (~80%).",
  "fraudRisk": "LOW"
}
```

#### Backend Vision AI Integration

```python
# Backend: Photo analysis with Gemini Vision
async def analyze_photo(photo_url: str, expected_items: List[Item]) -> PhotoAnalysis:
    image = await fetch_image(photo_url)

    prompt = f"""
    Analyze this food delivery photo. Expected items: {expected_items}

    1. Identify all food items visible
    2. Compare to expected items and note discrepancies
    3. Estimate consumption level of each item (0-100%)
    4. Provide reasoning for refund eligibility

    Return structured JSON response.
    """

    response = await gemini_vision.generate(
        model="gemini-pro-vision",
        contents=[image, prompt]
    )

    return parse_analysis(response)
```

---

## 4. Refund Processing (x402)

### Frontend Implementation (Mock)

**File**: `packages/frontend/src/services/mock.ts`

```typescript
async processRefund(proposal: RefundProposal): Promise<TransactionResult> {
  await delay(2500);  // Simulate processing time

  return {
    success: true,
    amount: proposal.totalRefund,
    transactionHash: `0x${randomHex(64)}`,
    timestamp: Date.now(),
  };
}
```

### Backend Integration Point

**Endpoint**: `POST /api/refunds/process`

**Request**:
```json
{
  "orderId": "order-1234",
  "customerId": "customer-123",
  "customerWalletAddress": "0x1234567890123456789012345678901234567890",
  "proposal": {
    "items": [
      {
        "name": "Burrito (Intact)",
        "status": "full",
        "originalPrice": 12.00,
        "refundAmount": 12.00,
        "reason": "Wrong item - untouched"
      },
      {
        "name": "Burrito (80% Eaten)",
        "status": "partial",
        "originalPrice": 12.00,
        "refundAmount": 5.00,
        "reason": "Wrong item - partially consumed"
      }
    ],
    "totalRefund": 17.00
  },
  "trustScore": 20,
  "photoAnalysisId": "analysis-456"
}
```

**Response**:
```json
{
  "success": true,
  "amount": 17.00,
  "currency": "USDC",
  "transactionHash": "0x24130373f07d6e791319ea7faa9af6c883af34fd9dfb6b4d013a3fd98c28c63c",
  "timestamp": 1704900030000,
  "blockNumber": 12345678,
  "networkId": "base-mainnet",
  "settlementTime": 2.3,
  "fees": {
    "network": 0.001,
    "service": 0.00
  }
}
```

#### Backend x402 Integration (CDP SDK)

```typescript
// Backend: x402 refund processing with CDP SDK
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";

async function processRefund(
  customerWallet: string,
  amount: number,
  orderId: string
): Promise<TransactionResult> {
  // Initialize CDP
  const coinbase = new Coinbase({
    apiKeyName: process.env.CDP_API_KEY_NAME,
    privateKey: process.env.CDP_PRIVATE_KEY,
  });

  // Get or create merchant wallet
  const wallet = await Wallet.fetch(process.env.MERCHANT_WALLET_ID);

  // Create USDC transfer
  const transfer = await wallet.createTransfer({
    amount: amount,
    assetId: Coinbase.assets.Usdc,
    destination: customerWallet,
    gasless: true,  // Sponsored gas for better UX
  });

  // Wait for confirmation
  await transfer.wait();

  // Log to MongoDB for audit
  await mongodb.collection('refund_transactions').insertOne({
    orderId,
    customerWallet,
    amount,
    transactionHash: transfer.getTransactionHash(),
    timestamp: new Date(),
    status: 'COMPLETED'
  });

  return {
    success: true,
    amount,
    transactionHash: transfer.getTransactionHash(),
    timestamp: Date.now(),
  };
}
```

---

## 5. BroadcastChannel Events

The frontend uses BroadcastChannel API to sync state between the Mobile App and Agent Dashboard panels.

### Event Types

| Event Type | Payload | Direction |
|------------|---------|-----------|
| `TRUST_UPDATE` | `TrustState` | Mobile → Dashboard |
| `TRUST_SIGNAL` | `TrustSignal` | Mobile → Dashboard |
| `CHAT_MESSAGE` | `ChatMessage` | Mobile → Dashboard |
| `PHOTO_UPLOADED` | `{ url: string }` | Mobile → Dashboard |
| `PHOTO_ANALYZED` | `PhotoAnalysis` | Mobile → Dashboard |
| `TRANSACTION_COMPLETE` | `TransactionResult` | Mobile → Dashboard |

### Usage

```typescript
// Broadcasting from Mobile App
const { broadcast } = useBroadcast();
broadcast({ type: 'TRUST_UPDATE', payload: trustState });

// Receiving in Dashboard
useBroadcast((event) => {
  switch (event.type) {
    case 'TRUST_UPDATE':
      setTrustState(event.payload);
      break;
    // ...
  }
});
```

---

## 6. Swapping Mock for Real Services

### Step 1: Create Real Service Implementation

**File**: `packages/frontend/src/services/real.ts`

```typescript
import axios from 'axios';
import { AgentService } from './mock';

const API_BASE = '/api';

export const realService: AgentService = {
  async evaluateTrust(signals) {
    const res = await axios.post(`${API_BASE}/trust/evaluate`, { signals });
    return res.data;
  },

  async sendMessage(userMessage, conversationStep) {
    const res = await axios.post(`${API_BASE}/chat/message`, {
      message: userMessage,
      step: conversationStep
    });
    return res.data;
  },

  async analyzePhoto(photoUrl) {
    const res = await axios.post(`${API_BASE}/chat/analyze-photo`, { photoUrl });
    return res.data;
  },

  async processRefund(proposal) {
    const res = await axios.post(`${API_BASE}/refunds/process`, { proposal });
    return res.data;
  },
};
```

### Step 2: Update Service Export

**File**: `packages/frontend/src/services/index.ts`

```typescript
// import { mockService } from './mock';
import { realService } from './real';

// SWAP POINT: Change this to realService when backend is ready
export const agentService = realService;
```

---

## 7. Data Types Reference

### TrustSignal

```typescript
interface TrustSignal {
  type: 'RAGE_TAP' | 'FAST_NAVIGATION' | 'RECEIPT_SCRUB' | 'NEGATIVE_CHIP' | 'ABANDONED_DRAFT';
  timestamp: number;
  details?: string;
  scoreImpact: number;
}
```

### TrustState

```typescript
interface TrustState {
  score: number;           // 0-100
  signals: TrustSignal[];
  creditGranted: boolean;
  creditAmount?: number;   // Set when creditGranted is true
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  agent: 'trust' | 'refund' | 'system';
  content: string;
  timestamp: number;
  isUser: boolean;
  suggestions?: string[];
  proposalCard?: RefundProposal;
  thinkingState?: string;
  transactionComplete?: TransactionResult;
}
```

### RefundProposal

```typescript
interface RefundProposal {
  items: ProposalItem[];
  totalRefund: number;
}

interface ProposalItem {
  name: string;
  status: 'full' | 'partial' | 'none';
  originalPrice: number;
  refundAmount: number;
  reason: string;
}
```

### TransactionResult

```typescript
interface TransactionResult {
  success: boolean;
  amount: number;
  transactionHash: string;
  timestamp: number;
}
```

### PhotoAnalysis

```typescript
interface PhotoAnalysis {
  detected: string[];
  matches: { item: string; confidence: number }[];
  reasoning: string;
}
```

---

## 8. Environment Variables

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

### Backend (.env)

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=delivery_shield

# Gemini AI
GEMINI_API_KEY=...

# Coinbase CDP
CDP_API_KEY_NAME=...
CDP_PRIVATE_KEY=...
MERCHANT_WALLET_ID=...

# Server
PORT=3001
NODE_ENV=development
```

---

## 9. Testing the Integration

### Manual Testing Flow

1. **Trust Score**: Click "This is unacceptable" multiple times → Watch score drop on dashboard
2. **Proactive Credit**: Get score below 40 → See credit banner appear
3. **Chat Flow**: Click "Issue with my order" → Follow suggestion chips
4. **Photo Analysis**: Click "Upload photo" → See analysis on dashboard
5. **Refund**: Accept proposal → See transaction complete on both screens

### API Testing with cURL

```bash
# Test Trust Evaluation
curl -X POST http://localhost:3001/api/trust/evaluate \
  -H "Content-Type: application/json" \
  -d '{"signals": [{"type": "NEGATIVE_CHIP", "scoreImpact": 20, "timestamp": 1704900000000}]}'

# Test Chat Message
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Wrong items delivered", "step": 1}'

# Test Refund Processing
curl -X POST http://localhost:3001/api/refunds/process \
  -H "Content-Type: application/json" \
  -d '{"proposal": {"items": [], "totalRefund": 17.00}}'
```

---

## 10. Sequence Diagram: Full Refund Flow

```
Customer          Mobile App           Backend            Dashboard
   │                  │                   │                   │
   │  Tap order 5x    │                   │                   │
   │─────────────────>│                   │                   │
   │                  │  TRUST_UPDATE     │                   │
   │                  │───────────────────┼──────────────────>│
   │                  │                   │                   │ Score: 85
   │                  │                   │                   │
   │  Click "Issue"   │                   │                   │
   │─────────────────>│                   │                   │
   │                  │  POST /chat       │                   │
   │                  │──────────────────>│                   │
   │                  │  Agent message    │                   │
   │                  │<──────────────────│                   │
   │                  │  CHAT_MESSAGE     │                   │
   │                  │───────────────────┼──────────────────>│
   │  See suggestions │                   │                   │
   │<─────────────────│                   │                   │
   │                  │                   │                   │
   │  Upload photo    │                   │                   │
   │─────────────────>│                   │                   │
   │                  │  POST /analyze    │                   │
   │                  │──────────────────>│                   │
   │                  │  Analysis result  │                   │
   │                  │<──────────────────│                   │
   │                  │  PHOTO_ANALYZED   │                   │
   │                  │───────────────────┼──────────────────>│
   │                  │                   │                   │ Show analysis
   │                  │                   │                   │
   │  Accept proposal │                   │                   │
   │─────────────────>│                   │                   │
   │                  │  POST /refund     │                   │
   │                  │──────────────────>│                   │
   │                  │         ┌─────────┴─────────┐         │
   │                  │         │  CDP SDK Transfer │         │
   │                  │         │  USDC → Customer  │         │
   │                  │         └─────────┬─────────┘         │
   │                  │  Transaction hash │                   │
   │                  │<──────────────────│                   │
   │                  │  TRANSACTION_COMPLETE                 │
   │                  │───────────────────┼──────────────────>│
   │  See $17.00      │                   │                   │ Show tx hash
   │<─────────────────│                   │                   │
   │                  │                   │                   │
```
