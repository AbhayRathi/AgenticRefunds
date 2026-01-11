---
date: 2026-01-10T16:45:00-08:00
researcher: mklgrw
git_commit: f525cae6643da7420380ede0295f5b8c3c63504d
branch: main
repository: AgenticRefunds
topic: "Demo Integration Readiness Assessment"
tags: [research, integration, demo, backend, frontend]
status: complete
last_updated: 2026-01-10
last_updated_by: mklgrw
---

# Research: Demo Integration Readiness Assessment

**Date**: 2026-01-10T16:45:00-08:00
**Researcher**: mklgrw
**Git Commit**: f525cae6643da7420380ede0295f5b8c3c63504d
**Branch**: main
**Repository**: AgenticRefunds

## Research Question
Which integrations documented in `docs/demo_integration.md` are ready for demo based on recent commits and current implementation status?

## Summary

The AgenticRefunds demo has a **hybrid implementation state**: the backend has real production-grade integrations (CDP blockchain payments, Gemini AI reasoning, MongoDB vector search), while the frontend chat experience remains entirely mock-based. The two layers are not currently connected for the chat flow.

### Integration Readiness Matrix

| Integration | Backend Status | Frontend Status | Demo Ready |
|------------|----------------|-----------------|------------|
| **Refund Processing (CDP)** | REAL | Mock | Backend only |
| **RAG Evaluation (Gemini)** | REAL | Not connected | Backend only |
| **MongoDB Vector Search** | REAL | Not connected | Backend only |
| **Trust Score System** | Not implemented | Mock (working) | Frontend only |
| **Chat/Agent System** | No chat endpoint | Mock (working) | Frontend only |
| **Photo Analysis (Vision AI)** | Not implemented | Mock (working) | Frontend only |
| **BroadcastChannel Events** | N/A | REAL | YES |

---

## Detailed Findings

### 1. Refund Processing (x402/CDP)

**Status: PRODUCTION-READY (Backend)**

The backend payment system uses real Coinbase Developer Platform (CDP) SDK integration:

**Implementation:**
- `packages/backend/src/services/cdp.ts` - Real CDP SDK integration
- `packages/backend/src/services/payment.ts` - Three payment methods (cash, credit, hybrid)
- `packages/backend/src/services/ledger.ts` - In-memory credit tracking

**Recent Fix (commit 742a50b):**
- Critical rollback bug fixed - transfers now execute BEFORE deducting credit
- Invalid wallet address validation corrected (39 chars → 40 chars)
- Environment variable validation added

**Endpoints:**
- `POST /api/refunds/process` - Full refund with blockchain transfer
- `POST /api/refunds/negotiate` - Cash vs credit choice flow
- `GET /api/refunds/ledger/:userId` - Credit balance retrieval

**Blockchain:** Base Sepolia testnet (USDC transfers)

**Frontend Status:** Mock only (`packages/frontend/src/services/mock.ts:processRefund`)

---

### 2. RAG Evaluation System (Gemini)

**Status: PRODUCTION-READY (Backend)**

**Implementation:** `packages/backend/src/services/rag.ts`

**Capabilities:**
- Real Gemini API integration (`gemini-pro` model)
- MongoDB vector search for policy retrieval
- Policy condition matching against system metrics
- AI-generated customer-friendly reasoning

**Current Limitations:**
- Embeddings are mock (random 768-dim vectors)
- Production would need real embedding model

**Endpoints:**
- `POST /api/refunds/evaluate` - Policy evaluation only
- `POST /api/refunds/simulate` - Generate test system logs

**Frontend Status:** Not connected - frontend uses hardcoded chat scripts

---

### 3. Trust Score System

**Status: FRONTEND-ONLY (Mock)**

**Implementation (commit df8f6da):**
- `packages/frontend/src/hooks/useTrustScore.ts` - Signal detection
- `packages/frontend/src/dashboard/components/TrustScoreGauge.tsx` - Visual gauge
- `packages/frontend/src/mobile/components/TrustSignalsPanel.tsx` - Mobile panel

**Detected Signals (Implemented):**
| Signal | Impact | Status |
|--------|--------|--------|
| RAGE_TAP | -15 | Working |
| FAST_NAVIGATION | -10 | Working |
| RECEIPT_SCRUB | -8 | Defined only |
| NEGATIVE_CHIP | -20 | Defined only |
| ABANDONED_DRAFT | -12 | Defined only |

**Backend Status:** No `/api/trust` endpoint exists

---

### 4. Chat/Agent System

**Status: DUAL IMPLEMENTATION (Not Connected)**

**Frontend (Mock):**
- `packages/frontend/src/mobile/views/ChatView.tsx` - Chat interface
- `packages/frontend/src/services/mock.ts` - Scripted 5-step conversation

**Conversation Steps:**
1. Greeting + issue type selection
2. Item description
3. Photo upload request
4. Consumption status
5. Refund proposal

**Backend (Real but disconnected):**
- RAG service can evaluate refunds with Gemini reasoning
- No `/api/chat` endpoint exists
- Backend processes refund requests, not conversational chat

**Integration Gap:** Frontend chat is hardcoded scripts; backend has AI reasoning but no chat API

---

### 5. Photo Analysis System

**Status: MOCK-ONLY**

**Frontend Mock:**
- `packages/frontend/src/services/mock.ts:analyzePhoto` - Returns hardcoded results
- `packages/frontend/src/dashboard/components/PhotoAnalysis.tsx` - Display component

**Hardcoded Response:**
```
detected: ['Burrito (x2)', 'Salad Bowl', 'Napkins', 'Utensils']
confidence: 0.88-0.94
```

**Backend Status:**
- No photo upload endpoint
- No Vision AI integration (`gemini-pro-vision` not configured)
- RAG service uses text-only Gemini model

---

### 6. BroadcastChannel Events

**Status: FULLY IMPLEMENTED**

**Implementation:** `packages/frontend/src/hooks/useBroadcast.ts`

**Working Events:**
| Event | Direction | Status |
|-------|-----------|--------|
| TRUST_UPDATE | Mobile → Dashboard | Working |
| TRUST_SIGNAL | Mobile → Dashboard | Working |
| CHAT_MESSAGE | Mobile → Dashboard | Working |
| PHOTO_UPLOADED | Mobile → Dashboard | Working |
| PHOTO_ANALYZED | Mobile → Dashboard | Working |
| TRANSACTION_COMPLETE | Mobile → Dashboard | Working |

Cross-panel synchronization works correctly between Mobile App and Agent Dashboard.

---

## Code References

### Backend Services (Production-Ready)
- `packages/backend/src/services/cdp.ts` - CDP SDK integration
- `packages/backend/src/services/payment.ts:34-102` - Payment processing with rollback protection
- `packages/backend/src/services/rag.ts:68-110` - Gemini reasoning generation
- `packages/backend/src/routes/refund.ts` - All refund endpoints

### Frontend Mock Services
- `packages/frontend/src/services/mock.ts:24-49` - Mock chat responses
- `packages/frontend/src/services/mock.ts:51-88` - Refund proposal generation
- `packages/frontend/src/services/mock.ts:90-103` - Mock photo analysis
- `packages/frontend/src/services/index.ts:5` - Service swap point (currently mock)

### Recent Critical Commits
- `df8f6da` - Trust Score System and Chat Functionality implementation
- `742a50b` - Payment rollback bug fix, wallet validation
- `a45e989` - Hybrid payment system with ledger service

---

## Architecture Documentation

### Current State
```
Frontend (Demo Mode)                Backend (Production-Ready)
─────────────────────               ────────────────────────
┌──────────────────┐                ┌──────────────────────┐
│  Mobile App      │                │  Refund Endpoints    │
│  ├─ ChatView     │                │  ├─ /evaluate        │
│  ├─ TrustSignals │                │  ├─ /process         │
│  └─ PhotoUpload  │                │  ├─ /negotiate       │
└────────┬─────────┘                │  └─ /simulate        │
         │                          └──────────┬───────────┘
         ▼                                     │
┌──────────────────┐                ┌──────────▼───────────┐
│  Mock Service    │                │  RAG Service         │
│  (Hardcoded)     │                │  (Gemini Pro)        │
└────────┬─────────┘                └──────────┬───────────┘
         │                                     │
         │ NOT CONNECTED                       │
         │                          ┌──────────▼───────────┐
         ▼                          │  CDP Service         │
┌──────────────────┐                │  (Base Sepolia)      │
│  BroadcastChannel│◄──────────────►└──────────────────────┘
│  (Real Sync)     │
└──────────────────┘
```

### Service Swap Point
`packages/frontend/src/services/index.ts`:
```typescript
export const agentService = mockService;  // Current
// export const agentService = realService;  // When backend connected
```

---

## Demo Recommendations

### What Works for Demo Today

1. **Frontend Chat Flow** - Complete 5-step scripted conversation
2. **Trust Score Visualization** - Real-time gauge and signal detection
3. **Photo Analysis Display** - Mock analysis shown on dashboard
4. **Cross-Panel Sync** - BroadcastChannel keeps panels in sync
5. **Backend API Testing** - Refund endpoints work via cURL/Postman

### What's Missing for Full Integration

1. **Chat Backend** - No `/api/chat` endpoint to connect frontend
2. **Photo Vision AI** - No backend image analysis
3. **Trust Backend** - No `/api/trust` endpoint
4. **Real Service Layer** - `real.ts` doesn't exist for agent services
5. **Embedding Generation** - Mock embeddings in RAG service

---

## Historical Context (from docs/)

The `docs/demo_integration.md` document describes the intended architecture:
- Section 6 "Swapping Mock for Real Services" documents the planned swap from `mock.ts` to `real.ts`
- The backend endpoints documented in sections 1-4 match the actual implementation
- BroadcastChannel events (section 5) are fully implemented
- Environment variables (section 8) are correctly configured

---

## Open Questions

1. **Is there a plan to create `/api/chat/message` endpoint?** - Would bridge frontend chat to backend RAG
2. **Will photo analysis use Gemini Vision?** - Currently no vision model configured
3. **Should trust signals be sent to backend?** - Could influence refund decisions
4. **Is `real.ts` service file planned?** - Would replace mock service for production
