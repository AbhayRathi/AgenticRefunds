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
