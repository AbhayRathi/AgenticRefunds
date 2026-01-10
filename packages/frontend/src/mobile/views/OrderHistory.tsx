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
