# DoorDash Clone Frontend Demo - Implementation Plan

## Overview

Build a high-fidelity DoorDash mobile app clone with a split-screen demo setup: Screen 1 shows the customer-facing mobile app, Screen 2 shows the live Trust Score calculation and Agent reasoning dashboard. The two screens communicate via BroadcastChannel API for real-time sync.

## Current State Analysis

**What Exists:**
- React + Vite frontend in `packages/frontend/`
- Shared types in `packages/shared/src/types.ts`
- Desktop dashboard UI with inline styles
- Backend with x402, MongoDB, RAG, CDP integration (being updated by another engineer)

**What's Missing:**
- Mobile-first UI styling
- DoorDash-style order history and detail views
- Trust Score event detection system
- Chat interface with suggestion chips
- Split-screen demo layout
- Agent dashboard for judges

### Key Discoveries:
- Existing frontend uses inline styles - will add Tailwind for speed
- Shared types already have `DeliveryOrder`, `OrderItem`, `RefundResponse` - will extend for chat/trust
- Vite config at `packages/frontend/vite.config.ts` - easy Tailwind integration

## Desired End State

A split-screen demo application where:

1. **Left Panel (Mobile App - ~375px width)**: Pixel-perfect DoorDash clone with order history, order detail, and chat views. User interactions (rage taps, navigation) emit events.

2. **Right Panel (Agent Dashboard)**: Real-time Trust Score visualization, detected signals log, agent reasoning display, photo analysis results, and transaction status.

3. **Communication**: BroadcastChannel syncs events between panels. When user rage-taps on left, right panel shows score dropping live.

4. **Pluggable Backend**: All backend calls go through a service interface. Mock implementation works now; swap to real when backend is ready.

### Verification:
- Rage-tap 5x on order card → Trust Score drops to ~60
- Rage-tap 8x → Trust Score drops to ~30, proactive credit banner appears
- Click "Issue with my order" → Chat opens with Refund Agent
- Complete chat flow → See "Transaction Complete" card
- Right panel shows all signals, reasoning, and analysis in real-time

## What We're NOT Doing

- React Router (state-based navigation is faster for hackathon)
- localStorage persistence (fresh state each demo is cleaner)
- Real payment processing (mock until backend ready)
- Actual photo ML analysis (mock the analysis results)
- Perfect DoorDash pixel matching (close enough to be recognizable)
- Dark mode support
- Accessibility (a11y) - hackathon tradeoff

## Implementation Approach

**Tech Stack Additions:**
- Tailwind CSS (mobile-first utilities)
- BroadcastChannel API (cross-panel communication)
- No additional dependencies

**Architecture:**
```
packages/frontend/src/
├── App.tsx                    # Split-screen layout controller
├── main.tsx                   # Entry point
├── index.css                  # Tailwind imports + global styles
├── types/                     # Extended types for demo
│   └── demo.ts
├── services/
│   ├── mock.ts               # Mock implementations (build now)
│   ├── real.ts               # Real API calls (plug in later)
│   └── index.ts              # Export active service
├── hooks/
│   ├── useTrustScore.ts      # Trust score state + event detection
│   └── useBroadcast.ts       # BroadcastChannel wrapper
├── mobile/                    # Screen 1: Mobile App
│   ├── MobileApp.tsx         # Mobile shell + view switching
│   ├── views/
│   │   ├── OrderHistory.tsx  # List of past orders
│   │   ├── OrderDetail.tsx   # Single order + "Issue" button
│   │   └── ChatView.tsx      # Refund agent chat
│   └── components/
│       ├── OrderCard.tsx
│       ├── TrustSignalsPanel.tsx
│       ├── ProactiveCreditBanner.tsx
│       ├── ChatMessage.tsx
│       ├── SuggestionChip.tsx
│       ├── ProposalCard.tsx
│       └── TransactionComplete.tsx
└── dashboard/                 # Screen 2: Agent Dashboard
    ├── AgentDashboard.tsx    # Dashboard shell
    └── components/
        ├── TrustScoreGauge.tsx
        ├── SignalsLog.tsx
        ├── AgentReasoning.tsx
        ├── PhotoAnalysis.tsx
        └── TransactionStatus.tsx
```

---

## Phase 1: Project Setup & Tailwind

### Overview
Add Tailwind CSS, create directory structure, define extended types for the demo.

### Changes Required:

#### 1. Install Tailwind CSS
**Command:**
```bash
cd packages/frontend && npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

#### 2. Configure Tailwind
**File**: `packages/frontend/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        doordash: {
          red: '#FF3008',
          darkRed: '#C41200',
          gray: '#767676',
          lightGray: '#F5F5F5',
          green: '#00A651',
        }
      },
      fontFamily: {
        sans: ['TTNorms', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
```

#### 3. Update CSS Entry Point
**File**: `packages/frontend/src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* DoorDash-style base resets */
* {
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  font-family: 'TTNorms', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Mobile viewport simulation */
.mobile-frame {
  width: 375px;
  height: 812px;
  overflow: hidden;
  border-radius: 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

#### 4. Create Demo Types
**File**: `packages/frontend/src/types/demo.ts`
```typescript
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
```

#### 5. Create Directory Structure
**Command:**
```bash
mkdir -p packages/frontend/src/{types,services,hooks,mobile/views,mobile/components,dashboard/components}
```

### Success Criteria:

#### Automated Verification:
- [x] Tailwind installed: `cd packages/frontend && npm ls tailwindcss`
- [x] Build succeeds: `cd packages/frontend && npm run build`
- [x] Types compile: `cd packages/frontend && npx tsc --noEmit`

#### Manual Verification:
- [ ] Tailwind classes work in a test component

---

## Phase 2: Service Layer & Hooks

### Overview
Create the pluggable service interface with mock implementations, and shared hooks for trust score and broadcast communication.

### Changes Required:

#### 1. Mock Service Implementation
**File**: `packages/frontend/src/services/mock.ts`
```typescript
import {
  TrustState,
  TrustSignal,
  ChatMessage,
  RefundProposal,
  TransactionResult,
  PhotoAnalysis
} from '../types/demo';

// Simulated delays for realistic feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockService = {
  // Trust Agent
  async evaluateTrust(signals: TrustSignal[]): Promise<TrustState> {
    await delay(500);

    const baseScore = 100;
    const totalImpact = signals.reduce((sum, s) => sum + s.scoreImpact, 0);
    const score = Math.max(0, Math.min(100, baseScore - totalImpact));

    return {
      score,
      signals,
      creditGranted: score < 40,
      creditAmount: score < 40 ? 25 : undefined,
    };
  },

  // Refund Agent - scripted conversation
  async sendMessage(
    userMessage: string,
    conversationStep: number
  ): Promise<ChatMessage> {
    await delay(1000 + Math.random() * 500);

    const responses: Record<number, Partial<ChatMessage>> = {
      0: {
        content: "Hi! I see your order from Chipotle Mexican Grill just arrived. Is something wrong?",
        suggestions: ["Wrong items delivered", "Food was cold", "Order never arrived"],
      },
      1: {
        content: "Thanks for letting me know. What did you receive instead?",
        suggestions: [
          "I got 2 Burritos and the Salad. Missing Taco & Fajita.",
          "Completely wrong order",
          "Some items missing"
        ],
      },
      2: {
        thinkingState: "Checking Inventory & Receipt (MongoDB)...",
        content: "I see. You ordered a Taco ($8), Fajita ($14), and Salad ($10) but received 2 Burritos ($12 each) and the Salad. Can you upload a photo of what you received?",
        suggestions: ["Upload photo"],
      },
      3: {
        thinkingState: "Analyzing photo with AI...",
        content: "I can see the items. Did you consume any of the incorrect items?",
        suggestions: [
          "I ate 80% of one burrito. The other is untouched.",
          "I haven't touched anything",
          "I ate everything already"
        ],
      },
      4: {
        content: "Okay. Since one burrito was mostly consumed, I cannot fully refund it. However, I can offer a negotiated partial refund.",
        proposalCard: {
          items: [
            { name: 'Burrito (Intact)', status: 'full', originalPrice: 12, refundAmount: 12, reason: 'Wrong item - untouched' },
            { name: 'Burrito (80% Eaten)', status: 'partial', originalPrice: 12, refundAmount: 5, reason: 'Wrong item - partially consumed' },
          ],
          totalRefund: 17,
        },
      },
    };

    const response = responses[conversationStep] || {
      content: "Is there anything else I can help you with?",
    };

    return {
      id: `msg-${Date.now()}`,
      agent: 'refund',
      content: response.content || '',
      timestamp: Date.now(),
      isUser: false,
      ...response,
    };
  },

  // Photo Analysis (mock)
  async analyzePhoto(photoUrl: string): Promise<PhotoAnalysis> {
    await delay(2000);

    return {
      detected: ['Burrito (x2)', 'Salad Bowl', 'Napkins', 'Utensils'],
      matches: [
        { item: 'Burrito', confidence: 0.94 },
        { item: 'Burrito', confidence: 0.91 },
        { item: 'Salad', confidence: 0.88 },
      ],
      reasoning: "Detected 2 burritos and 1 salad. Order was for 1 Taco, 1 Fajita, 1 Salad. Confirms wrong items delivered. One burrito appears partially consumed (~80%).",
    };
  },

  // Process Refund (mock x402)
  async processRefund(proposal: RefundProposal): Promise<TransactionResult> {
    await delay(2500);

    return {
      success: true,
      amount: proposal.totalRefund,
      transactionHash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: Date.now(),
    };
  },
};

export type AgentService = typeof mockService;
```

#### 2. Service Index (Swap Point)
**File**: `packages/frontend/src/services/index.ts`
```typescript
import { mockService } from './mock';
// import { realService } from './real'; // Uncomment when backend ready

// SWAP POINT: Change this to realService when backend is ready
export const agentService = mockService;

export * from './mock';
```

#### 3. Trust Score Hook
**File**: `packages/frontend/src/hooks/useTrustScore.ts`
```typescript
import { useState, useCallback, useRef } from 'react';
import { TrustState, TrustSignal, TrustSignalType } from '../types/demo';
import { agentService } from '../services';

const SIGNAL_IMPACTS: Record<TrustSignalType, number> = {
  RAGE_TAP: 15,
  FAST_NAVIGATION: 10,
  RECEIPT_SCRUB: 8,
  NEGATIVE_CHIP: 20,
  ABANDONED_DRAFT: 12,
};

export function useTrustScore(onUpdate?: (state: TrustState) => void) {
  const [state, setState] = useState<TrustState>({
    score: 100,
    signals: [],
    creditGranted: false,
  });

  // Rage tap detection
  const tapTimestamps = useRef<number[]>([]);
  const navigationTimestamps = useRef<{ view: string; time: number }[]>([]);

  const addSignal = useCallback(async (type: TrustSignalType, details?: string) => {
    const signal: TrustSignal = {
      type,
      timestamp: Date.now(),
      details,
      scoreImpact: SIGNAL_IMPACTS[type],
    };

    const newSignals = [...state.signals, signal];
    const newState = await agentService.evaluateTrust(newSignals);

    setState(newState);
    onUpdate?.(newState);

    return newState;
  }, [state.signals, onUpdate]);

  const detectRageTap = useCallback((elementId: string) => {
    const now = Date.now();
    tapTimestamps.current.push(now);

    // Keep only taps within last 1.5 seconds
    tapTimestamps.current = tapTimestamps.current.filter(t => now - t < 1500);

    if (tapTimestamps.current.length >= 3) {
      addSignal('RAGE_TAP', `${tapTimestamps.current.length} taps on ${elementId}`);
      tapTimestamps.current = []; // Reset after detection
    }
  }, [addSignal]);

  const detectFastNavigation = useCallback((currentView: string) => {
    const now = Date.now();
    navigationTimestamps.current.push({ view: currentView, time: now });

    // Keep only navigations within last 10 seconds
    navigationTimestamps.current = navigationTimestamps.current.filter(n => now - n.time < 10000);

    // Check for back-and-forth pattern (2+ switches)
    if (navigationTimestamps.current.length >= 4) {
      const views = navigationTimestamps.current.map(n => n.view);
      const switches = views.filter((v, i) => i > 0 && v !== views[i - 1]).length;

      if (switches >= 2) {
        addSignal('FAST_NAVIGATION', `${switches} view switches in 10s`);
        navigationTimestamps.current = [];
      }
    }
  }, [addSignal]);

  const reset = useCallback(() => {
    setState({ score: 100, signals: [], creditGranted: false });
    tapTimestamps.current = [];
    navigationTimestamps.current = [];
  }, []);

  return {
    state,
    addSignal,
    detectRageTap,
    detectFastNavigation,
    reset,
  };
}
```

#### 4. Broadcast Channel Hook
**File**: `packages/frontend/src/hooks/useBroadcast.ts`
```typescript
import { useEffect, useRef, useCallback } from 'react';
import { BroadcastEvent } from '../types/demo';

const CHANNEL_NAME = 'doordash-demo';

export function useBroadcast(onMessage?: (event: BroadcastEvent) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);

    if (onMessage) {
      channelRef.current.onmessage = (e) => onMessage(e.data);
    }

    return () => {
      channelRef.current?.close();
    };
  }, [onMessage]);

  const broadcast = useCallback((event: BroadcastEvent) => {
    channelRef.current?.postMessage(event);
  }, []);

  return { broadcast };
}
```

### Success Criteria:

#### Automated Verification:
- [x] Types compile: `cd packages/frontend && npx tsc --noEmit`
- [x] No lint errors: `cd packages/frontend && npm run lint` (lint config missing but types compile)

#### Manual Verification:
- [ ] Import services in a component without errors

---

## Phase 3: Mobile App Shell & Order History

### Overview
Build the mobile app container with DoorDash styling, view switching, and the Order History list view.

### Changes Required:

#### 1. Mobile App Container
**File**: `packages/frontend/src/mobile/MobileApp.tsx`
```typescript
import { useState, useCallback } from 'react';
import { MobileView, DemoOrder, TrustState } from '../types/demo';
import { useTrustScore } from '../hooks/useTrustScore';
import { useBroadcast } from '../hooks/useBroadcast';
import { OrderHistory } from './views/OrderHistory';
import { OrderDetail } from './views/OrderDetail';
import { ChatView } from './views/ChatView';
import { TrustSignalsPanel } from './components/TrustSignalsPanel';
import { ProactiveCreditBanner } from './components/ProactiveCreditBanner';

// Demo data
const DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'order-1234',
    restaurant: {
      name: 'Chipotle Mexican Grill',
      image: '🌯',
      rating: 4.7,
    },
    items: [
      { name: 'Chicken Taco', quantity: 1, price: 8.00 },
      { name: 'Steak Fajita', quantity: 1, price: 14.00 },
      { name: 'Side Salad', quantity: 1, price: 10.00 },
    ],
    total: 32.00,
    deliveryTime: '35 min',
    status: 'delivered',
    date: 'Today, 12:34 PM',
  },
  {
    id: 'order-5678',
    restaurant: {
      name: 'Sweetgreen',
      image: '🥗',
      rating: 4.5,
    },
    items: [
      { name: 'Harvest Bowl', quantity: 1, price: 13.95 },
    ],
    total: 13.95,
    deliveryTime: '28 min',
    status: 'delivered',
    date: 'Yesterday',
  },
];

export function MobileApp() {
  const [currentView, setCurrentView] = useState<MobileView>('history');
  const [selectedOrder, setSelectedOrder] = useState<DemoOrder | null>(null);
  const [showTrustPanel, setShowTrustPanel] = useState(false);

  const { broadcast } = useBroadcast();

  const handleTrustUpdate = useCallback((state: TrustState) => {
    broadcast({ type: 'TRUST_UPDATE', payload: state });
  }, [broadcast]);

  const { state: trustState, detectRageTap, detectFastNavigation, addSignal } = useTrustScore(handleTrustUpdate);

  const navigateTo = useCallback((view: MobileView, order?: DemoOrder) => {
    detectFastNavigation(view);
    setCurrentView(view);
    if (order) setSelectedOrder(order);
  }, [detectFastNavigation]);

  const handleOrderClick = useCallback((order: DemoOrder) => {
    detectRageTap(`order-${order.id}`);
    navigateTo('detail', order);
  }, [detectRageTap, navigateTo]);

  return (
    <div className="mobile-frame bg-white relative overflow-hidden flex flex-col">
      {/* Status Bar */}
      <div className="h-11 bg-white flex items-center justify-between px-6 text-sm font-medium">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        {currentView !== 'history' && (
          <button
            onClick={() => navigateTo('history')}
            className="p-2 -ml-2 text-doordash-red"
          >
            ← Back
          </button>
        )}
        <h1 className="text-lg font-bold flex-1 text-center">
          {currentView === 'history' && 'Orders'}
          {currentView === 'detail' && selectedOrder?.restaurant.name}
          {currentView === 'chat' && 'Support'}
        </h1>
        <button
          onClick={() => setShowTrustPanel(!showTrustPanel)}
          className="p-2 -mr-2 text-gray-500"
        >
          🛡️
        </button>
      </header>

      {/* Trust Signals Panel (collapsible) */}
      {showTrustPanel && (
        <TrustSignalsPanel
          trustState={trustState}
          onClose={() => setShowTrustPanel(false)}
        />
      )}

      {/* Proactive Credit Banner */}
      {trustState.creditGranted && currentView !== 'chat' && (
        <ProactiveCreditBanner amount={trustState.creditAmount || 25} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {currentView === 'history' && (
          <OrderHistory
            orders={DEMO_ORDERS}
            onOrderClick={handleOrderClick}
          />
        )}
        {currentView === 'detail' && selectedOrder && (
          <OrderDetail
            order={selectedOrder}
            onIssueClick={() => navigateTo('chat')}
            onReceiptScrub={() => addSignal('RECEIPT_SCRUB', 'Expanded receipt details')}
            onNegativeChip={() => addSignal('NEGATIVE_CHIP', 'Clicked "This is unacceptable"')}
            detectRageTap={detectRageTap}
          />
        )}
        {currentView === 'chat' && selectedOrder && (
          <ChatView
            order={selectedOrder}
            onBroadcast={broadcast}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="h-16 border-t border-gray-200 flex items-center justify-around bg-white">
        <NavItem icon="🏠" label="Home" />
        <NavItem icon="🔍" label="Search" />
        <NavItem icon="📋" label="Orders" active />
        <NavItem icon="👤" label="Account" />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${active ? 'text-doordash-red' : 'text-gray-500'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
```

#### 2. Order History View
**File**: `packages/frontend/src/mobile/views/OrderHistory.tsx`
```typescript
import { DemoOrder } from '../../types/demo';
import { OrderCard } from '../components/OrderCard';

interface OrderHistoryProps {
  orders: DemoOrder[];
  onOrderClick: (order: DemoOrder) => void;
}

export function OrderHistory({ orders, onOrderClick }: OrderHistoryProps) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Past Orders</h2>

      {orders.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          onClick={() => onOrderClick(order)}
        />
      ))}
    </div>
  );
}
```

#### 3. Order Card Component
**File**: `packages/frontend/src/mobile/components/OrderCard.tsx`
```typescript
import { DemoOrder } from '../../types/demo';

interface OrderCardProps {
  order: DemoOrder;
  onClick: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer active:bg-gray-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Restaurant Image */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
          {order.restaurant.image}
        </div>

        {/* Order Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 truncate">
              {order.restaurant.name}
            </h3>
            <span className="text-sm text-gray-500">{order.date}</span>
          </div>

          <p className="text-sm text-gray-600 mt-1">
            {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium">${order.total.toFixed(2)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              order.status === 'delivered'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {order.status === 'delivered' ? 'Delivered' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <span className="text-gray-400">›</span>
      </div>
    </div>
  );
}
```

#### 4. Trust Signals Panel
**File**: `packages/frontend/src/mobile/components/TrustSignalsPanel.tsx`
```typescript
import { TrustState } from '../../types/demo';

interface TrustSignalsPanelProps {
  trustState: TrustState;
  onClose: () => void;
}

export function TrustSignalsPanel({ trustState, onClose }: TrustSignalsPanelProps) {
  const scoreColor = trustState.score >= 70 ? 'text-green-600' :
                     trustState.score >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-gray-900 text-white p-4 animate-slide-down">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          🛡️ Trust Signals
        </h3>
        <button onClick={onClose} className="text-gray-400">✕</button>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className={`text-3xl font-bold ${scoreColor}`}>
          {trustState.score}
        </div>
        <div className="text-sm text-gray-400">/ 100</div>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              trustState.score >= 70 ? 'bg-green-500' :
              trustState.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${trustState.score}%` }}
          />
        </div>
      </div>

      {trustState.signals.length > 0 ? (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {trustState.signals.slice(-5).reverse().map((signal, i) => (
            <div key={i} className="text-sm flex items-center gap-2 text-gray-300">
              <span className="text-red-400">−{signal.scoreImpact}</span>
              <span>{signal.type.replace('_', ' ')}</span>
              {signal.details && (
                <span className="text-gray-500">({signal.details})</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No frustration signals detected</p>
      )}
    </div>
  );
}
```

#### 5. Proactive Credit Banner
**File**: `packages/frontend/src/mobile/components/ProactiveCreditBanner.tsx`
```typescript
interface ProactiveCreditBannerProps {
  amount: number;
}

export function ProactiveCreditBanner({ amount }: ProactiveCreditBannerProps) {
  return (
    <div className="mx-4 my-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg animate-slide-down">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
          🎁
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">Instant Credit Granted</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              Proactive Trust Repair
            </span>
          </div>
          <div className="text-2xl font-bold mt-1">${amount} DoorDash Credit</div>
          <p className="text-sm text-white/80 mt-1">
            Applied automatically to your next order
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build succeeds: `cd packages/frontend && npm run build`
- [x] No TypeScript errors: `cd packages/frontend && npx tsc --noEmit`

#### Manual Verification:
- [ ] Mobile app shell renders with DoorDash-style header and nav
- [ ] Order history shows order cards
- [ ] Trust signals panel opens/closes
- [ ] Clicking order multiple times rapidly triggers rage tap signal

---

## Phase 4: Order Detail & Chat Views

### Overview
Build the Order Detail view with receipt, "Issue with order" button, and the Chat view with message bubbles, suggestion chips, and proposal cards.

### Changes Required:

#### 1. Order Detail View
**File**: `packages/frontend/src/mobile/views/OrderDetail.tsx`
```typescript
import { useState } from 'react';
import { DemoOrder } from '../../types/demo';

interface OrderDetailProps {
  order: DemoOrder;
  onIssueClick: () => void;
  onReceiptScrub: () => void;
  onNegativeChip: () => void;
  detectRageTap: (elementId: string) => void;
}

export function OrderDetail({
  order,
  onIssueClick,
  onReceiptScrub,
  onNegativeChip,
  detectRageTap
}: OrderDetailProps) {
  const [receiptExpanded, setReceiptExpanded] = useState(false);
  const [expandCount, setExpandCount] = useState(0);

  const handleReceiptToggle = () => {
    const newCount = expandCount + 1;
    setExpandCount(newCount);
    setReceiptExpanded(!receiptExpanded);

    if (newCount >= 2) {
      onReceiptScrub();
      setExpandCount(0);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Restaurant Header */}
      <div
        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
        onClick={() => detectRageTap('restaurant-header')}
      >
        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-4xl shadow-sm">
          {order.restaurant.image}
        </div>
        <div>
          <h2 className="text-xl font-bold">{order.restaurant.name}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>⭐ {order.restaurant.rating}</span>
            <span>•</span>
            <span>{order.date}</span>
          </div>
        </div>
      </div>

      {/* Order Status */}
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
        <span className="font-medium text-green-700">✓ Delivered</span>
        <span className="text-sm text-green-600">{order.deliveryTime}</span>
      </div>

      {/* Receipt Section */}
      <div className="border rounded-xl overflow-hidden">
        <button
          onClick={handleReceiptToggle}
          className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50"
        >
          <span className="font-semibold">Order Details</span>
          <span className={`transition-transform ${receiptExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {receiptExpanded && (
          <div className="p-4 border-t bg-gray-50 space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-medium">${item.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t flex justify-between font-semibold">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Negative Chip */}
      <button
        onClick={onNegativeChip}
        className="w-full p-3 border-2 border-red-200 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors"
      >
        😤 This is unacceptable
      </button>

      {/* Issue Button */}
      <button
        onClick={onIssueClick}
        className="w-full p-4 bg-doordash-red text-white rounded-xl font-semibold hover:bg-doordash-darkRed transition-colors"
      >
        Issue with my order
      </button>

      {/* Reorder Button */}
      <button className="w-full p-4 border-2 border-doordash-red text-doordash-red rounded-xl font-semibold hover:bg-red-50 transition-colors">
        Reorder
      </button>
    </div>
  );
}
```

#### 2. Chat View
**File**: `packages/frontend/src/mobile/views/ChatView.tsx`
```typescript
import { useState, useRef, useEffect } from 'react';
import { DemoOrder, ChatMessage, BroadcastEvent } from '../../types/demo';
import { agentService } from '../../services';
import { ChatMessageBubble } from '../components/ChatMessage';
import { SuggestionChip } from '../components/SuggestionChip';
import { ProposalCard } from '../components/ProposalCard';
import { TransactionComplete } from '../components/TransactionComplete';

interface ChatViewProps {
  order: DemoOrder;
  onBroadcast: (event: BroadcastEvent) => void;
}

export function ChatView({ order, onBroadcast }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingState, setThinkingState] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial agent message
  useEffect(() => {
    const initChat = async () => {
      setIsTyping(true);
      const response = await agentService.sendMessage('', 0);
      setMessages([response]);
      setIsTyping(false);
      onBroadcast({ type: 'CHAT_MESSAGE', payload: response });
    };
    initChat();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSuggestionClick = async (suggestion: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      agent: 'refund',
      content: suggestion,
      timestamp: Date.now(),
      isUser: true,
    };
    setMessages(prev => [...prev, userMsg]);
    onBroadcast({ type: 'CHAT_MESSAGE', payload: userMsg });

    // Handle photo upload step
    if (suggestion === 'Upload photo') {
      // Simulate photo upload
      await new Promise(r => setTimeout(r, 500));
      onBroadcast({ type: 'PHOTO_UPLOADED', payload: { url: '/mock-photo.jpg' } });

      // Simulate photo analysis
      const analysis = await agentService.analyzePhoto('/mock-photo.jpg');
      onBroadcast({ type: 'PHOTO_ANALYZED', payload: analysis });
    }

    // Get agent response
    const nextStep = step + 1;
    setStep(nextStep);
    setIsTyping(true);

    const response = await agentService.sendMessage(suggestion, nextStep);

    if (response.thinkingState) {
      setThinkingState(response.thinkingState);
      await new Promise(r => setTimeout(r, 2000));
      setThinkingState(null);
    }

    setMessages(prev => [...prev, response]);
    setIsTyping(false);
    onBroadcast({ type: 'CHAT_MESSAGE', payload: response });
  };

  const handleAcceptProposal = async (proposal: ChatMessage['proposalCard']) => {
    if (!proposal) return;

    // Add acceptance message
    const acceptMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      agent: 'refund',
      content: 'I accept this offer',
      timestamp: Date.now(),
      isUser: true,
    };
    setMessages(prev => [...prev, acceptMsg]);

    // Show processing
    setThinkingState('Processing instant refund via Coinbase x402...');

    const result = await agentService.processRefund(proposal);

    setThinkingState(null);

    // Add completion message
    const completeMsg: ChatMessage = {
      id: `complete-${Date.now()}`,
      agent: 'refund',
      content: 'Your refund has been processed!',
      timestamp: Date.now(),
      isUser: false,
      transactionComplete: result,
    };
    setMessages(prev => [...prev, completeMsg]);
    onBroadcast({ type: 'TRANSACTION_COMPLETE', payload: result });
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-doordash-red rounded-full flex items-center justify-center text-white text-sm">
            🤖
          </div>
          <div>
            <div className="font-semibold text-sm">DoorDash Refund Agent</div>
            <div className="text-xs text-gray-500">AI-Powered Support</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id}>
            <ChatMessageBubble message={msg} />

            {/* Proposal Card */}
            {msg.proposalCard && (
              <ProposalCard
                proposal={msg.proposalCard}
                onAccept={() => handleAcceptProposal(msg.proposalCard)}
              />
            )}

            {/* Transaction Complete */}
            {msg.transactionComplete && (
              <TransactionComplete result={msg.transactionComplete} />
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              🤖
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        {/* Thinking State */}
        {thinkingState && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            ⏳ {thinkingState}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {lastMessage?.suggestions && !isTyping && !thinkingState && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {lastMessage.suggestions.map((suggestion, i) => (
              <SuggestionChip
                key={i}
                text={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 3. Chat Message Bubble
**File**: `packages/frontend/src/mobile/components/ChatMessage.tsx`
```typescript
import { ChatMessage } from '../../types/demo';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  if (message.isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-doordash-red text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
        🤖
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
        {message.content}
      </div>
    </div>
  );
}
```

#### 4. Suggestion Chip
**File**: `packages/frontend/src/mobile/components/SuggestionChip.tsx`
```typescript
interface SuggestionChipProps {
  text: string;
  onClick: () => void;
}

export function SuggestionChip({ text, onClick }: SuggestionChipProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-white border-2 border-doordash-red text-doordash-red rounded-full text-sm font-medium hover:bg-red-50 active:bg-red-100 transition-colors"
    >
      {text}
    </button>
  );
}
```

#### 5. Proposal Card
**File**: `packages/frontend/src/mobile/components/ProposalCard.tsx`
```typescript
import { RefundProposal } from '../../types/demo';

interface ProposalCardProps {
  proposal: RefundProposal;
  onAccept: () => void;
}

export function ProposalCard({ proposal, onAccept }: ProposalCardProps) {
  return (
    <div className="mt-3 bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h4 className="font-bold text-gray-900">Refund Proposal</h4>
      </div>

      <div className="p-4 space-y-3">
        {proposal.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">{item.reason}</div>
            </div>
            <div className="text-right">
              <div className={`font-bold ${
                item.status === 'full' ? 'text-green-600' :
                item.status === 'partial' ? 'text-yellow-600' : 'text-gray-400'
              }`}>
                ${item.refundAmount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                {item.status === 'full' ? 'Full Refund' :
                 item.status === 'partial' ? 'Partial Credit' : 'No Refund'}
              </div>
            </div>
          </div>
        ))}

        <div className="pt-3 mt-3 border-t flex items-center justify-between">
          <span className="font-bold text-lg">Total Refund</span>
          <span className="font-bold text-xl text-green-600">
            ${proposal.totalRefund.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
        >
          Accept Offer
        </button>
        <button className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-100">
          Decline
        </button>
      </div>
    </div>
  );
}
```

#### 6. Transaction Complete Card
**File**: `packages/frontend/src/mobile/components/TransactionComplete.tsx`
```typescript
import { TransactionResult } from '../../types/demo';

interface TransactionCompleteProps {
  result: TransactionResult;
}

export function TransactionComplete({ result }: TransactionCompleteProps) {
  return (
    <div className="mt-3 bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-3xl text-white mx-auto mb-4">
        ✓
      </div>

      <h3 className="text-xl font-bold text-green-800">Transaction Complete</h3>

      <div className="mt-4 space-y-2">
        <div className="text-3xl font-bold text-green-600">
          ${result.amount.toFixed(2)}
        </div>
        <div className="text-sm text-green-600">Funds Settled</div>
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg text-xs text-gray-500 font-mono break-all">
        {result.transactionHash}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
        <span>⚡</span>
        <span>Powered by Coinbase x402</span>
      </div>
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build succeeds: `cd packages/frontend && npm run build`
- [x] No TypeScript errors: `cd packages/frontend && npx tsc --noEmit`

#### Manual Verification:
- [ ] Order detail view shows receipt expansion
- [ ] "This is unacceptable" chip triggers trust signal
- [ ] Chat loads with initial agent message
- [ ] Suggestion chips appear and are clickable
- [ ] Proposal card renders with Accept/Decline buttons
- [ ] Transaction complete card shows after accepting

---

## Phase 5: Agent Dashboard (Screen 2)

### Overview
Build the Agent Dashboard that shows live Trust Score, detected signals, agent reasoning, photo analysis, and transaction status.

### Changes Required:

#### 1. Agent Dashboard Shell
**File**: `packages/frontend/src/dashboard/AgentDashboard.tsx`
```typescript
import { useState, useCallback } from 'react';
import { useBroadcast } from '../hooks/useBroadcast';
import {
  TrustState,
  ChatMessage,
  PhotoAnalysis,
  TransactionResult,
  BroadcastEvent
} from '../types/demo';
import { TrustScoreGauge } from './components/TrustScoreGauge';
import { SignalsLog } from './components/SignalsLog';
import { AgentReasoning } from './components/AgentReasoning';
import { PhotoAnalysisPanel } from './components/PhotoAnalysis';
import { TransactionStatus } from './components/TransactionStatus';

export function AgentDashboard() {
  const [trustState, setTrustState] = useState<TrustState>({
    score: 100,
    signals: [],
    creditGranted: false,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [transaction, setTransaction] = useState<TransactionResult | null>(null);

  const handleBroadcast = useCallback((event: BroadcastEvent) => {
    switch (event.type) {
      case 'TRUST_UPDATE':
        setTrustState(event.payload);
        break;
      case 'CHAT_MESSAGE':
        setMessages(prev => [...prev, event.payload]);
        break;
      case 'PHOTO_ANALYZED':
        setPhotoAnalysis(event.payload);
        break;
      case 'TRANSACTION_COMPLETE':
        setTransaction(event.payload);
        break;
    }
  }, []);

  useBroadcast(handleBroadcast);

  return (
    <div className="h-full bg-gray-900 text-white p-6 overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🎛️</span>
          Agent Dashboard
        </h1>
        <p className="text-gray-400 text-sm">Real-time system visibility</p>
      </header>

      <div className="grid grid-cols-2 gap-6">
        {/* Trust Score Section */}
        <div className="space-y-4">
          <TrustScoreGauge score={trustState.score} />
          <SignalsLog signals={trustState.signals} />

          {trustState.creditGranted && (
            <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <span>🎁</span>
                <span>Proactive Credit Issued</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                ${trustState.creditAmount?.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Agent Activity Section */}
        <div className="space-y-4">
          <AgentReasoning messages={messages} />

          {photoAnalysis && (
            <PhotoAnalysisPanel analysis={photoAnalysis} />
          )}

          {transaction && (
            <TransactionStatus result={transaction} />
          )}
        </div>
      </div>
    </div>
  );
}
```

#### 2. Trust Score Gauge
**File**: `packages/frontend/src/dashboard/components/TrustScoreGauge.tsx`
```typescript
interface TrustScoreGaugeProps {
  score: number;
}

export function TrustScoreGauge({ score }: TrustScoreGaugeProps) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4">TRUST SCORE</h3>

      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="#374151"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-400">
        {score >= 70 ? 'Healthy' : score >= 40 ? 'Warning' : 'Critical'}
      </div>
    </div>
  );
}
```

#### 3. Signals Log
**File**: `packages/frontend/src/dashboard/components/SignalsLog.tsx`
```typescript
import { TrustSignal } from '../../types/demo';

interface SignalsLogProps {
  signals: TrustSignal[];
}

export function SignalsLog({ signals }: SignalsLogProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4">DETECTED SIGNALS</h3>

      {signals.length === 0 ? (
        <p className="text-gray-500 text-sm">No signals detected yet</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {signals.slice().reverse().map((signal, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg text-sm"
            >
              <span className="text-red-400 font-mono">-{signal.scoreImpact}</span>
              <span className="text-yellow-400">{signal.type}</span>
              {signal.details && (
                <span className="text-gray-400 truncate">{signal.details}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 4. Agent Reasoning Panel
**File**: `packages/frontend/src/dashboard/components/AgentReasoning.tsx`
```typescript
import { ChatMessage } from '../../types/demo';

interface AgentReasoningProps {
  messages: ChatMessage[];
}

export function AgentReasoning({ messages }: AgentReasoningProps) {
  const agentMessages = messages.filter(m => !m.isUser);

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4">AGENT REASONING</h3>

      {agentMessages.length === 0 ? (
        <p className="text-gray-500 text-sm">Chat not started</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {agentMessages.slice().reverse().map((msg, i) => (
            <div key={i} className="p-3 bg-gray-700/50 rounded-lg">
              {msg.thinkingState && (
                <div className="text-blue-400 text-xs mb-1">
                  ⏳ {msg.thinkingState}
                </div>
              )}
              <p className="text-sm">{msg.content}</p>
              {msg.proposalCard && (
                <div className="mt-2 text-xs text-green-400">
                  💰 Proposed refund: ${msg.proposalCard.totalRefund.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 5. Photo Analysis Panel
**File**: `packages/frontend/src/dashboard/components/PhotoAnalysis.tsx`
```typescript
import { PhotoAnalysis } from '../../types/demo';

interface PhotoAnalysisPanelProps {
  analysis: PhotoAnalysis;
}

export function PhotoAnalysisPanel({ analysis }: PhotoAnalysisPanelProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4">📸 PHOTO ANALYSIS</h3>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-gray-500 mb-2">Detected Items</div>
          <div className="flex flex-wrap gap-2">
            {analysis.detected.map((item, i) => (
              <span key={i} className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">Confidence Scores</div>
          {analysis.matches.map((match, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="text-sm flex-1">{match.item}</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${match.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-12">
                {(match.confidence * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">AI Reasoning</div>
          <p className="text-sm text-gray-300">{analysis.reasoning}</p>
        </div>
      </div>
    </div>
  );
}
```

#### 6. Transaction Status
**File**: `packages/frontend/src/dashboard/components/TransactionStatus.tsx`
```typescript
import { TransactionResult } from '../../types/demo';

interface TransactionStatusProps {
  result: TransactionResult;
}

export function TransactionStatus({ result }: TransactionStatusProps) {
  return (
    <div className="bg-green-900/30 border border-green-500 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-green-400 mb-4">
        ✓ TRANSACTION COMPLETE
      </h3>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500">Amount</div>
          <div className="text-2xl font-bold text-green-400">
            ${result.amount.toFixed(2)} USDC
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Transaction Hash</div>
          <div className="text-xs font-mono text-gray-400 break-all">
            {result.transactionHash}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-700 text-xs text-gray-500">
          Settled via Coinbase x402 Protocol
        </div>
      </div>
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build succeeds: `cd packages/frontend && npm run build`
- [x] No TypeScript errors: `cd packages/frontend && npx tsc --noEmit`

#### Manual Verification:
- [ ] Trust score gauge animates when score changes
- [ ] Signals log shows detected signals in real-time
- [ ] Agent reasoning updates as chat progresses
- [ ] Photo analysis panel shows after photo upload step
- [ ] Transaction status shows after refund completion

---

## Phase 6: Split-Screen Layout & Integration

### Overview
Update App.tsx to render both screens side-by-side, wire up all components, and add final polish.

### Changes Required:

#### 1. Update App.tsx
**File**: `packages/frontend/src/App.tsx`
```typescript
import { MobileApp } from './mobile/MobileApp';
import { AgentDashboard } from './dashboard/AgentDashboard';

function App() {
  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center gap-8 p-8">
      {/* Left: Mobile App */}
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold text-gray-600 mb-4">
          Customer View
        </h2>
        <MobileApp />
      </div>

      {/* Right: Agent Dashboard */}
      <div className="flex flex-col h-[812px] w-[600px]">
        <h2 className="text-lg font-semibold text-gray-600 mb-4">
          Agent Dashboard (Judges View)
        </h2>
        <div className="flex-1 rounded-xl overflow-hidden shadow-2xl">
          <AgentDashboard />
        </div>
      </div>
    </div>
  );
}

export default App;
```

#### 2. Add Tailwind Animations
**File**: `packages/frontend/src/index.css` (append)
```css
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}

/* Custom delay utilities for bounce animation */
.delay-100 {
  animation-delay: 0.1s;
}
.delay-200 {
  animation-delay: 0.2s;
}
```

#### 3. Update main.tsx (ensure clean entry)
**File**: `packages/frontend/src/main.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Success Criteria:

#### Automated Verification:
- [x] Build succeeds: `cd packages/frontend && npm run build`
- [x] Dev server starts: `cd packages/frontend && npm run dev`
- [ ] No console errors in browser

#### Manual Verification:
- [ ] Split-screen layout renders correctly
- [ ] Mobile app on left, dashboard on right
- [ ] Rage-tap on mobile triggers signal on dashboard
- [ ] Complete chat flow shows all states
- [ ] Transaction completes and shows on both screens

---

## Testing Strategy

### Manual Testing Steps:
1. **Trust Score Flow:**
   - Click order card 5x rapidly → See score drop to ~60
   - Click 8x → See proactive credit banner
   - Dashboard shows all signals

2. **Chat Flow:**
   - Click "Issue with my order"
   - Follow suggestion chips through full conversation
   - See proposal card, accept refund
   - Verify transaction complete

3. **Cross-Screen Sync:**
   - Actions on mobile reflect immediately on dashboard
   - No lag or missed events

### Integration Tests (when backend ready):
- Swap `mockService` → `realService`
- Verify RAG evaluation returns expected format
- Verify photo analysis endpoint works
- Verify x402 payment processing

---

## Backend Integration Points

When backend engineer pushes updates, create `packages/frontend/src/services/real.ts`:

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

Then update `services/index.ts`:
```typescript
// import { mockService } from './mock';
import { realService } from './real';

export const agentService = realService;
```

---

## References

- Original spec: `FrontendDemo.md`
- Existing frontend: `packages/frontend/src/`
- Shared types: `packages/shared/src/types.ts`
- Backend API: `packages/backend/src/routes/refund.ts`
