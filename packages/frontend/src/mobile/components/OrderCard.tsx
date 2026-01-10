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
