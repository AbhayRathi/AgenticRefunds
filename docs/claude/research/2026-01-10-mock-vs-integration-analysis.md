---
date: 2026-01-11T00:25:17Z
researcher: Claude
git_commit: e1cfd9751819af747873002f57bd09ac8892e229
branch: main
repository: AgenticRefunds
topic: "Frontend Mock vs Real Integration Analysis"
tags: [research, codebase, frontend, backend, mocks, api-integration]
status: complete
last_updated: 2026-01-10
last_updated_by: Claude
---

# Research: Frontend Mock vs Real Integration Analysis

**Date**: 2026-01-11T00:25:17Z
**Researcher**: Claude
**Git Commit**: e1cfd9751819af747873002f57bd09ac8892e229
**Branch**: main
**Repository**: AgenticRefunds

## Research Question
Based on the latest commits, do any frontend components need to be updated from using mocks to being actually integrated with the backend?

## Summary

The frontend has a **dual-service architecture**:
1. **Real API service** (`refundService` in `api.ts`) - Used by `X402Button` for negotiation/refund flows
2. **Mock service** (`mockService` in `mock.ts`) - Used by mobile chat flow and trust score evaluation

**Components needing integration updates:**
- `ChatView.tsx` - Currently uses mocks for chat conversation, photo analysis, and refund processing
- `useTrustScore.ts` - Currently uses mocks for trust evaluation

**Backend API gaps** - The backend does NOT have endpoints for:
- Chat/conversation flow (no `sendMessage` equivalent)
- AI photo analysis (no `analyzePhoto` equivalent)
- Trust score evaluation (no `evaluateTrust` equivalent)

## Detailed Findings

### Current Integration Status Matrix

| Component | Service Used | Mock Functions Called | Backend API Available? | Status |
|-----------|--------------|----------------------|----------------------|--------|
| X402Button | Real API (`refundService`) | None | Yes | INTEGRATED |
| NegotiationDemo | Real API (via X402Button) | None | Yes | INTEGRATED |
| ChatView | Mock (`agentService`) | `sendMessage()`, `analyzePhoto()`, `processRefund()` | Partial | NEEDS WORK |
| useTrustScore | Mock (`agentService`) | `evaluateTrust()` | No | NEEDS WORK |
| MobileApp | Local hardcoded data | None | N/A | Demo data |

### Components Using Mock Services

#### 1. ChatView Component
**File:** `packages/frontend/src/mobile/views/ChatView.tsx`

**Mock calls made:**
- Line 25: `agentService.sendMessage('', 0)` - Initial greeting
- Line 57: `agentService.analyzePhoto('/mock-photo.jpg')` - Photo analysis
- Line 66: `agentService.sendMessage(suggestion, nextStep)` - Conversation flow
- Line 95: `agentService.processRefund(proposal)` - Refund processing

**Current mock behavior (`mock.ts`):**
- `sendMessage()` (lines 31-88): Scripted 5-step conversation flow with hardcoded MangoDB order
- `analyzePhoto()` (lines 91-103): Returns hardcoded detected items (Burrito x2, Salad Bowl)
- `processRefund()` (lines 106-115): Generates fake transaction hash, always succeeds

**Integration needs:**
- Backend needs conversational AI endpoint for chat flow
- Backend needs AI photo analysis endpoint
- Could potentially use existing `POST /api/refunds/process` for refund processing

#### 2. useTrustScore Hook
**File:** `packages/frontend/src/hooks/useTrustScore.ts`

**Mock calls made:**
- Line 33: `agentService.evaluateTrust(newSignals)` - Called when signals detected

**Current mock behavior (`mock.ts` lines 15-28):**
- Base score: 100
- Reduces by sum of signal impacts
- Grants $25 credit if score < 40

**Integration needs:**
- Backend needs trust evaluation endpoint that accepts signals and returns score + credit decision

### Components Using Real Backend APIs

#### X402Button Component
**File:** `packages/frontend/src/components/X402Button.tsx`

**Real API calls made:**
- Line 51: `refundService.simulateIssue('LATE_DELIVERY', 2000000)`
- Line 109: `refundService.processRefund({...})`
- Line 141: `refundService.negotiateRefund({...})`

**Status:** Fully integrated with backend

### Service Layer Configuration

**Current configuration (`services/index.ts` lines 1-7):**
```typescript
import { mockService } from './mock';
// Comment indicates: export const agentService = realService; // when backend ready
export const agentService = mockService;
```

The service export point allows swapping mock for real implementation.

### Backend API Endpoints Available

**File:** `packages/backend/src/routes/refund.ts`

| Endpoint | Method | Description | Used By Frontend |
|----------|--------|-------------|-----------------|
| `/api/refunds/evaluate` | POST | Evaluate refund eligibility | Not yet |
| `/api/refunds/process` | POST | Process refund (with wallet transfer) | X402Button |
| `/api/refunds/status/:refundId` | GET | Get refund status | Not yet |
| `/api/refunds/simulate` | POST | Simulate delivery issue | X402Button |
| `/api/refunds/negotiate` | POST | Negotiate cash vs credit | X402Button |
| `/api/refunds/ledger/:userId` | GET | Get user's store credit balance | Not yet |
| `/health` | GET | Health check | Not yet |

### Backend API Gaps

The following mock frontend functions have **no backend equivalent**:

1. **`sendMessage(userMessage, conversationStep)`** - Conversational AI for refund chat
   - Would need: LLM integration, conversation state management, RAG for policies

2. **`analyzePhoto(photoUrl)`** - AI photo analysis
   - Would need: Vision AI service (Gemini Vision?), image processing

3. **`evaluateTrust(signals)`** - Trust score calculation
   - Would need: Signal processing logic, credit decision rules

### Recent Commits Related to This

| Commit | Description | Relevant Changes |
|--------|-------------|------------------|
| e1cfd97 | update to MangoDB | Modified `mock.ts`, `MobileApp.tsx` |
| df8f6da | Trust Score System and Chat | Added mock.ts, ChatView, useTrustScore, mobile components |
| 4f75998 | Refactor X402Button for API | Made X402Button use real `refundService` |
| 06b9182 | Frontend negotiation UI | Added NegotiationTable, ThoughtStream |

The most recent commits (e1cfd97) only updated the mock service restaurant name to "MangoDB" but didn't add real integration.

## Code References

### Frontend Mock Service
- `packages/frontend/src/services/mock.ts:15-28` - `evaluateTrust()` mock implementation
- `packages/frontend/src/services/mock.ts:31-88` - `sendMessage()` mock implementation
- `packages/frontend/src/services/mock.ts:91-103` - `analyzePhoto()` mock implementation
- `packages/frontend/src/services/mock.ts:106-115` - `processRefund()` mock implementation

### Frontend Components Using Mocks
- `packages/frontend/src/mobile/views/ChatView.tsx:3` - Imports `agentService` (mock)
- `packages/frontend/src/mobile/views/ChatView.tsx:25,57,66,95` - Mock service calls
- `packages/frontend/src/hooks/useTrustScore.ts:3` - Imports `agentService` (mock)
- `packages/frontend/src/hooks/useTrustScore.ts:33` - Mock trust evaluation call

### Frontend Components Using Real APIs
- `packages/frontend/src/components/X402Button.tsx:2` - Imports `refundService` (real)
- `packages/frontend/src/components/X402Button.tsx:51,109,141` - Real API calls

### Backend API Routes
- `packages/backend/src/routes/refund.ts:16-48` - Route definitions
- `packages/backend/src/controllers/refund.ts:29-248` - Controller implementations

### Service Switch Point
- `packages/frontend/src/services/index.ts:5` - `export const agentService = mockService`

## Architecture Documentation

### Dual Service Architecture

```
Frontend Application
├── Mock Service Path (for demo/chat)
│   ├── agentService (index.ts exports mockService)
│   ├── evaluateTrust() → useTrustScore hook
│   ├── sendMessage() → ChatView component
│   ├── analyzePhoto() → ChatView component
│   └── processRefund() → ChatView component
│
└── Real API Path (for negotiation/refunds)
    ├── refundService (api.ts with axios)
    ├── simulateIssue() → X402Button
    ├── processRefund() → X402Button
    └── negotiateRefund() → X402Button
```

### Integration Pattern

The codebase uses two separate services:
1. `refundService` in `api.ts` - Axios-based, calls backend REST APIs
2. `agentService` in `index.ts` - Currently points to mock, designed to be swappable

## Open Questions

1. **Will the chat flow be integrated with a backend?**
   - Requires conversational AI service (LLM)
   - The mock has hardcoded 5-step flow

2. **What AI service will handle photo analysis?**
   - Backend already uses Gemini for RAG
   - Could extend to Gemini Vision for photo analysis

3. **Should trust evaluation run client-side or server-side?**
   - Currently mock runs client-side
   - Server-side would enable more sophisticated logic

4. **Should ChatView's processRefund() use existing backend endpoint?**
   - Backend has `/api/refunds/process`
   - Would need to adapt data format
