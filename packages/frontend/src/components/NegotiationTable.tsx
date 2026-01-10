import { useState } from 'react';

interface NegotiationTableProps {
  refundAmount: number;
  currentCredit: number;
  onChoose: (choice: 'cash' | 'credit') => void;
  isProcessing?: boolean;
}

export function NegotiationTable({ 
  refundAmount, 
  currentCredit, 
  onChoose,
  isProcessing = false 
}: NegotiationTableProps) {
  const [selectedOption, setSelectedOption] = useState<'cash' | 'credit' | null>(null);

  const cashAmount = refundAmount;
  const creditAmount = refundAmount * 1.5; // 50% bonus
  const bonusAmount = refundAmount * 0.5;

  const handleSelect = (type: 'cash' | 'credit') => {
    setSelectedOption(type);
    setTimeout(() => onChoose(type), 300);
  };

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      marginTop: '2rem'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>
          🤝 Refund Negotiation
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
          Our AI agent recommends the best option for you
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Cash Option */}
        <div
          onClick={() => !isProcessing && handleSelect('cash')}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            transform: selectedOption === 'cash' ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.2s ease',
            border: selectedOption === 'cash' ? '3px solid #4F46E5' : '3px solid transparent',
            opacity: isProcessing ? 0.6 : 1,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            💰
          </div>

          <h3 style={{ textAlign: 'center', margin: '0 0 0.5rem 0', color: '#1F2937' }}>
            Cash Refund
          </h3>

          <div style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#4F46E5',
            margin: '0.5rem 0'
          }}>
            ${cashAmount.toFixed(2)}
          </div>

          <div style={{
            background: '#F3F4F6',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '0.75rem'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
              On-chain USDC via CDP
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              Immediate refund to your wallet via x402 protocol
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', fontSize: '0.75rem', color: '#6B7280' }}>
            <span>🔒 x402</span>
            <span>•</span>
            <span>🌐 Base</span>
            <span>•</span>
            <span>💎 CDP</span>
          </div>
        </div>

        {/* Credit Option */}
        <div
          onClick={() => !isProcessing && handleSelect('credit')}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            transform: selectedOption === 'credit' ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.2s ease',
            border: selectedOption === 'credit' ? '3px solid #10B981' : '3px solid transparent',
            opacity: isProcessing ? 0.6 : 1,
            position: 'relative',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: '#10B981',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            Recommended
          </div>

          <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            🎁
          </div>

          <h3 style={{ textAlign: 'center', margin: '0 0 0.5rem 0', color: '#1F2937' }}>
            Store Credit
          </h3>

          <div style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#10B981',
            margin: '0.5rem 0'
          }}>
            ${creditAmount.toFixed(2)}
            <span style={{ fontSize: '1rem', color: '#10B981', marginLeft: '0.5rem' }}>
              (+50%)
            </span>
          </div>

          <div style={{
            background: '#F3F4F6',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '0.75rem'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
              Store Credit (50% Bonus)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              Use on next order - better value, zero fees
            </div>
          </div>

          <div style={{
            fontSize: '0.75rem',
            color: '#10B981',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            ✨ Best value for frequent orders
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        padding: '1rem',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🧠</span>
          <strong style={{ color: '#4F46E5' }}>AI Recommendation:</strong>
        </div>
        <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: '1.5' }}>
          Based on your order history, <strong>Store Credit maximizes value</strong>. 
          You'll save ${bonusAmount.toFixed(2)} on your next order, and credit never expires.
          {currentCredit > 0 && ` Your current balance: $${currentCredit.toFixed(2)}`}
        </p>
      </div>
    </div>
  );
}
