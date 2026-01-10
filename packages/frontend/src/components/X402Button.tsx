import React, { useState } from 'react';
import { refundService } from '../services/api';
import { SystemLog, LogEventType, OrderStatus } from '@delivery-shield/shared';

interface X402ButtonProps {
  orderId: string;
  customerId: string;
  customerWalletAddress: string;
  orderAmount: number;
  simulateLatency: boolean;
  onRefundComplete?: (result: any) => void;
}

export const X402Button: React.FC<X402ButtonProps> = ({
  orderId,
  customerId,
  customerWalletAddress,
  orderAmount,
  simulateLatency,
  onRefundComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefundRequest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Generate system logs based on simulation
      let systemLogs: SystemLog[] = [];
      
      if (simulateLatency) {
        // Simulate a delivery issue
        const simulationResult = await refundService.simulateIssue('LATE_DELIVERY', 2000000);
        systemLogs = simulationResult.systemLogs;
      } else {
        // Normal delivery logs
        systemLogs = [
          {
            orderId,
            timestamp: Date.now() - 3600000,
            eventType: LogEventType.ORDER_CREATED
          },
          {
            orderId,
            timestamp: Date.now() - 1800000,
            eventType: LogEventType.DELIVERY_STARTED
          },
          {
            orderId,
            timestamp: Date.now(),
            eventType: LogEventType.DELIVERY_COMPLETED,
            latency: 1800000
          }
        ];
      }

      // Create delivery order
      const deliveryOrder = {
        orderId,
        customerId,
        restaurantId: 'rest-123',
        items: [
          { name: 'Pizza', quantity: 1, price: 15.99 },
          { name: 'Salad', quantity: 1, price: 8.99 }
        ],
        totalAmount: orderAmount,
        deliveryAddress: '123 Main St',
        orderTimestamp: Date.now() - 3600000,
        deliveryTimestamp: Date.now(),
        status: OrderStatus.DELIVERED
      };

      // Process refund
      const refundResult = await refundService.processRefund({
        orderId,
        customerId,
        customerWalletAddress,
        systemLogs,
        deliveryOrder
      });

      setResult(refundResult);
      if (onRefundComplete) {
        onRefundComplete(refundResult);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Refund request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #007bff', borderRadius: '8px', marginBottom: '20px' }}>
      <h3 style={{ marginTop: 0 }}>🔒 x402 Refund Request</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <p><strong>Order ID:</strong> {orderId}</p>
        <p><strong>Customer ID:</strong> {customerId}</p>
        <p><strong>Order Amount:</strong> ${orderAmount.toFixed(2)}</p>
        <p><strong>Wallet Address:</strong> {customerWalletAddress.slice(0, 10)}...{customerWalletAddress.slice(-8)}</p>
        <p><strong>Simulate Latency:</strong> {simulateLatency ? 'Yes (Late Delivery)' : 'No (Normal Delivery)'}</p>
      </div>

      <button
        onClick={handleRefundRequest}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: loading ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {loading ? '⏳ Processing...' : '💳 Request Refund via x402'}
      </button>

      {error && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: result.status === 'COMPLETED' ? '#d4edda' : '#fff3cd', color: result.status === 'COMPLETED' ? '#155724' : '#856404', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0 }}>Refund Result</h4>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Refund Amount:</strong> ${result.amount?.toFixed(2) || '0.00'}</p>
          {result.transactionHash && (
            <p><strong>Transaction:</strong> {result.transactionHash.slice(0, 10)}...{result.transactionHash.slice(-8)}</p>
          )}
          {result.reasoning && (
            <p><strong>Reason:</strong> {result.reasoning}</p>
          )}
          {result.matchedPolicies && result.matchedPolicies.length > 0 && (
            <div>
              <strong>Matched Policies:</strong>
              <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                {result.matchedPolicies.map((policy: any, idx: number) => (
                  <li key={idx}>{policy.title} ({policy.refundPercentage}%)</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
