import { useState, useEffect } from 'react';
import { X402Button } from './components/X402Button';
import { SimulateLatencyToggle } from './components/SimulateLatencyToggle';
import { DashboardStats } from './components/DashboardStats';
import { refundService } from './services/api';

function App() {
  const [simulateLatency, setSimulateLatency] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRefunds: 0,
    totalRefundAmount: 0,
    avgRefundPercentage: 0
  });

  // Sample order data
  const sampleOrder = {
    orderId: `order-${Date.now()}`,
    customerId: 'customer-123',
    customerWalletAddress: '0x1234567890123456789012345678901234567890',
    orderAmount: 24.98
  };

  useEffect(() => {
    // Check backend health on mount
    refundService.healthCheck()
      .then(data => setHealthStatus(data))
      .catch(err => console.error('Health check failed:', err));
  }, []);

  const handleRefundComplete = (result: any) => {
    // Update stats when a refund is completed
    if (result.status === 'COMPLETED') {
      setStats(prev => ({
        totalOrders: prev.totalOrders + 1,
        totalRefunds: prev.totalRefunds + 1,
        totalRefundAmount: prev.totalRefundAmount + (result.amount || 0),
        avgRefundPercentage: result.amount 
          ? ((prev.avgRefundPercentage * prev.totalRefunds + (result.amount / sampleOrder.orderAmount * 100)) / (prev.totalRefunds + 1))
          : prev.avgRefundPercentage
      }));
    } else {
      setStats(prev => ({
        ...prev,
        totalOrders: prev.totalOrders + 1
      }));
    }
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        marginBottom: '30px', 
        borderBottom: '2px solid #007bff',
        paddingBottom: '20px'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0',
          color: '#007bff',
          fontSize: '36px'
        }}>
          🛡️ Delivery Shield
        </h1>
        <p style={{ 
          margin: 0,
          color: '#6c757d',
          fontSize: '18px'
        }}>
          x402 Automated Refund System
        </p>
        {healthStatus && (
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <span style={{ 
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: healthStatus.status === 'ok' ? '#28a745' : '#dc3545',
              marginRight: '8px'
            }} />
            Backend: {healthStatus.status === 'ok' ? 'Online' : 'Offline'}
            {healthStatus.services && (
              <span style={{ marginLeft: '15px', color: '#6c757d' }}>
                (MongoDB: {healthStatus.services.mongodb ? '✓' : '✗'}, 
                 RAG: {healthStatus.services.rag ? '✓' : '✗'}, 
                 CDP: {healthStatus.services.cdp ? '✓' : '✗'})
              </span>
            )}
          </div>
        )}
      </header>

      {/* Stats Dashboard */}
      <DashboardStats
        totalOrders={stats.totalOrders}
        totalRefunds={stats.totalRefunds}
        totalRefundAmount={stats.totalRefundAmount}
        avgRefundPercentage={stats.avgRefundPercentage}
      />

      {/* Simulation Toggle */}
      <SimulateLatencyToggle
        enabled={simulateLatency}
        onChange={setSimulateLatency}
      />

      {/* x402 Refund Button */}
      <X402Button
        orderId={sampleOrder.orderId}
        customerId={sampleOrder.customerId}
        customerWalletAddress={sampleOrder.customerWalletAddress}
        orderAmount={sampleOrder.orderAmount}
        simulateLatency={simulateLatency}
        onRefundComplete={handleRefundComplete}
      />

      {/* Info Section */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#e7f3ff',
        borderRadius: '8px',
        border: '1px solid #007bff'
      }}>
        <h3 style={{ marginTop: 0, color: '#007bff' }}>ℹ️ How It Works</h3>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li><strong>RAG Policy Retrieval:</strong> Gemini-powered system retrieves relevant refund policies from MongoDB Atlas Vector Search</li>
          <li><strong>Log Analysis:</strong> System evaluates delivery logs for latency, errors, and quality issues</li>
          <li><strong>Smart Decision:</strong> AI determines if refund is warranted and calculates percentage</li>
          <li><strong>Instant Transfer:</strong> Automated USDC transfer via CDP SDK to customer wallet</li>
          <li><strong>Transparency:</strong> Complete transaction history and reasoning provided</li>
        </ol>
        <p style={{ 
          marginBottom: 0,
          padding: '10px',
          backgroundColor: '#fff',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>💡 Tip:</strong> Enable "Simulate Delivery Issues" to test the refund logic with late delivery scenarios.
          Disable it to simulate normal deliveries that don't trigger refunds.
        </p>
      </div>

      {/* Footer */}
      <footer style={{ 
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center',
        color: '#6c757d',
        fontSize: '14px'
      }}>
        <p>Delivery Shield x402 Refund System | Built with React, Express, MongoDB Atlas, Gemini AI, and Coinbase CDP</p>
      </footer>
    </div>
  );
}

export default App;
