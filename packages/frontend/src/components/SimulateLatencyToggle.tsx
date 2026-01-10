import React from 'react';

interface SimulateLatencyToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export const SimulateLatencyToggle: React.FC<SimulateLatencyToggleProps> = ({ enabled, onChange }) => {
  return (
    <div style={{ 
      padding: '15px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px', 
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div>
        <h4 style={{ margin: '0 0 5px 0' }}>🧪 Simulate Delivery Issues</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
          Enable to simulate late delivery scenario for testing refund logic
        </p>
      </div>
      
      <label style={{ 
        position: 'relative', 
        display: 'inline-block', 
        width: '60px', 
        height: '34px',
        cursor: 'pointer'
      }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span
          style={{
            position: 'absolute',
            cursor: 'pointer',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: enabled ? '#28a745' : '#ccc',
            transition: '0.4s',
            borderRadius: '34px'
          }}
        >
          <span
            style={{
              position: 'absolute',
              content: '',
              height: '26px',
              width: '26px',
              left: enabled ? '30px' : '4px',
              bottom: '4px',
              backgroundColor: 'white',
              transition: '0.4s',
              borderRadius: '50%'
            }}
          />
        </span>
      </label>
    </div>
  );
};
