import { useState } from 'react';
import { X402Button } from '../components/X402Button';
import { SimulateLatencyToggle } from '../components/SimulateLatencyToggle';

/**
 * Standalone demo page for the negotiation system
 * This showcases the minimal negotiation implementation for hackathon judges
 */
export function NegotiationDemo() {
  const [simulateLatency, setSimulateLatency] = useState(true);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            margin: '0 0 1rem 0',
            fontSize: '2rem',
            color: '#1F2937'
          }}>
            🤝 Agentic Refunds - Negotiation System Demo
          </h1>
          <p style={{
            margin: 0,
            color: '#6B7280',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            This demo showcases an AI-powered refund negotiation system that offers customers 
            a choice between instant USDC refunds (via x402 protocol) or store credit with 50% bonus.
          </p>
        </div>

        {/* Controls */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            color: '#1F2937'
          }}>
            Demo Controls
          </h2>
          <SimulateLatencyToggle
            enabled={simulateLatency}
            onChange={setSimulateLatency}
          />
          <p style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.875rem',
            color: '#6B7280'
          }}>
            {simulateLatency 
              ? '✅ Enabled: Order will have 47min late delivery (triggers refund)'
              : '❌ Disabled: Order will be on-time (no refund needed)'}
          </p>
        </div>

        {/* X402 Refund Button Demo */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          <X402Button
            orderId="demo-order-123"
            customerId="user-123"
            customerWalletAddress="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
            orderAmount={24.98}
            simulateLatency={simulateLatency}
            onRefundComplete={(result) => {
              console.log('Refund completed:', result);
            }}
          />
        </div>

        {/* Feature List */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '2rem',
          marginTop: '2rem',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            color: '#1F2937'
          }}>
            🚀 Key Features
          </h2>
          <ul style={{
            margin: 0,
            paddingLeft: '1.5rem',
            color: '#374151',
            lineHeight: '1.8'
          }}>
            <li><strong>AI Thought Stream:</strong> Real-time visibility into agent reasoning</li>
            <li><strong>Smart Negotiation:</strong> Cash vs Credit options with 50% bonus incentive</li>
            <li><strong>x402 Protocol:</strong> Instant USDC refunds via Coinbase CDP on Base</li>
            <li><strong>In-Memory Ledger:</strong> Fast store credit tracking without MongoDB overhead</li>
            <li><strong>Visual Demo Focus:</strong> Beautiful UI for hackathon judges</li>
          </ul>
        </div>

        {/* Tech Stack */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '2rem',
          marginTop: '2rem',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            color: '#1F2937'
          }}>
            🛠️ Tech Stack
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{
              background: '#F3F4F6',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Backend</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Express + TypeScript<br/>
                In-memory Ledger<br/>
                Mock CDP Service
              </div>
            </div>
            <div style={{
              background: '#F3F4F6',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Frontend</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                React + TypeScript<br/>
                Inline Styles<br/>
                Responsive Design
              </div>
            </div>
            <div style={{
              background: '#F3F4F6',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Integration</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                x402 Protocol<br/>
                Coinbase CDP<br/>
                Base Network
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
