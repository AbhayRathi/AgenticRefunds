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
