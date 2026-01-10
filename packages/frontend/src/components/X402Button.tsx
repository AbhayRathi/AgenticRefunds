import React, { useState } from 'react';
import { refundService } from '../services/api';
import { SystemLog, LogEventType, OrderStatus } from '@delivery-shield/shared';
import { NegotiationTable } from './NegotiationTable';
import { ThoughtStream, ThoughtLogEntry } from './ThoughtStream';

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
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [thoughtLog, setThoughtLog] = useState<ThoughtLogEntry[]>([]);
  const [currentCredit, setCurrentCredit] = useState(5.0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRefundRequest = async () => {
    setLoading(true);
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setShowNegotiation(false);

    try {
      // Generate system logs based on simulation
      let systemLogs: SystemLog[] = [];
      
      // Generate thought log
      const logs: ThoughtLogEntry[] = [
        { timestamp: new Date().toISOString(), level: 'info', message: '🔍 Analyzing delivery logs...', icon: '🔍' },
        { timestamp: new Date(Date.now() + 500).toISOString(), level: 'info', message: '📊 Calculating metrics from system data...', icon: '📊' }
      ];
      
      if (simulateLatency) {
        // Simulate a delivery issue
        const simulationResult = await refundService.simulateIssue('LATE_DELIVERY', 2000000);
        systemLogs = simulationResult.systemLogs;

        logs.push(
          { timestamp: new Date(Date.now() + 1000).toISOString(), level: 'warning', message: '❌ Violation detected: 47min late (threshold: 30min)', icon: '❌' },
          { timestamp: new Date(Date.now() + 1500).toISOString(), level: 'info', message: '💰 Calculating refund: $8.00 (100% policy match)', icon: '💰' },
          { timestamp: new Date(Date.now() + 2000).toISOString(), level: 'info', message: '🤝 Generating negotiation options...', icon: '🤝' },
          { timestamp: new Date(Date.now() + 2500).toISOString(), level: 'success', message: '✅ Option A: $8 USDC (x402 + CDP on Base)', icon: '✅' },
          { timestamp: new Date(Date.now() + 3000).toISOString(), level: 'success', message: '✅ Option B: $12 Credit (1.5x multiplier)', icon: '✅' },
          { timestamp: new Date(Date.now() + 3500).toISOString(), level: 'info', message: '🧠 Recommending Credit (Customer LTV optimization)', icon: '🧠' }
        );
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

        logs.push(
          { timestamp: new Date(Date.now() + 1000).toISOString(), level: 'success', message: '✅ Delivery completed on time', icon: '✅' },
          { timestamp: new Date(Date.now() + 1500).toISOString(), level: 'success', message: '✅ Temperature within acceptable range', icon: '✅' },
          { timestamp: new Date(Date.now() + 2000).toISOString(), level: 'info', message: '🎉 No refund needed - excellent service!', icon: '🎉' }
        );
      }

      setThoughtLog(logs);

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

      // Show negotiation if late delivery
      if (simulateLatency && refundResult.status !== 'REJECTED') {
        setShowNegotiation(true);
        setLoading(false);
        setIsProcessing(false);
      } else {
        setResult(refundResult);
        setLoading(false);
        setIsProcessing(false);
        if (onRefundComplete) {
          onRefundComplete(refundResult);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Refund request failed');
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleNegotiationChoice = async (choice: 'cash' | 'credit') => {
    setIsProcessing(true);
    
    try {
      const negotiationResult = await refundService.negotiateRefund({
        orderId,
        customerId,
        walletAddress: customerWalletAddress,
        choice
      });
      
      if (choice === 'credit') {
        setCurrentCredit(negotiationResult.newCreditBalance);
      }
      
      const completionLog: ThoughtLogEntry = {
        timestamp: new Date().toISOString(),
        level: 'success',
        message: choice === 'credit' 
          ? `🤝 Relationship maintained. Added $${negotiationResult.totalAmount?.toFixed(2)} credit. Customer retention optimized.`
          : `💸 Cash refund processed. Transaction: ${negotiationResult.txHash?.slice(0, 10)}...`,
        icon: choice === 'credit' ? '🤝' : '💸'
      };
      setThoughtLog(prev => [...prev, completionLog]);
      
      setResult(negotiationResult);
      setShowNegotiation(false);
      setIsProcessing(false);
      
      if (onRefundComplete) {
        onRefundComplete(negotiationResult);
      }
    } catch (error) {
      console.error('Negotiation failed:', error);
      setError('Negotiation failed');
      setIsProcessing(false);
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

      {/* Credit Balance */}
      <div style={{
        background: '#F3F4F6',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <strong>Your Store Credit:</strong> ${currentCredit.toFixed(2)}
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

      {/* Thought Stream */}
      {thoughtLog.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <ThoughtStream entries={thoughtLog} />
        </div>
      )}

      {/* Negotiation Table */}
      {showNegotiation && (
        <NegotiationTable
          refundAmount={8.0}
          currentCredit={currentCredit}
          onChoose={handleNegotiationChoice}
          isProcessing={isProcessing}
        />
      )}

      {result && !showNegotiation && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: result.status === 'COMPLETED' || result.approved ? '#d4edda' : '#fff3cd', color: result.status === 'COMPLETED' || result.approved ? '#155724' : '#856404', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0 }}>Refund Result</h4>
          <p><strong>Status:</strong> {result.status || (result.approved ? 'COMPLETED' : 'PENDING')}</p>
          <p><strong>Refund Amount:</strong> ${(result.amount || result.totalAmount)?.toFixed(2) || '0.00'}</p>
          {result.method && (
            <p><strong>Method:</strong> {result.method}</p>
          )}
          {result.txHash && (
            <p><strong>Transaction:</strong> {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}</p>
          )}
          {result.transactionHash && (
            <p><strong>Transaction:</strong> {result.transactionHash.slice(0, 10)}...{result.transactionHash.slice(-8)}</p>
          )}
          {result.reasoning && (
            <p><strong>Reason:</strong> {result.reasoning}</p>
          )}
          {result.bonusAmount > 0 && (
            <p><strong>Bonus:</strong> ${result.bonusAmount.toFixed(2)}</p>
          )}
          {result.newCreditBalance !== undefined && (
            <p><strong>New Credit Balance:</strong> ${result.newCreditBalance.toFixed(2)}</p>
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
