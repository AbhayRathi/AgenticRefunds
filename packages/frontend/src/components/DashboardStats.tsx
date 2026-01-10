import React from 'react';

interface DashboardStatsProps {
  totalOrders: number;
  totalRefunds: number;
  totalRefundAmount: number;
  avgRefundPercentage: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalOrders,
  totalRefunds,
  totalRefundAmount,
  avgRefundPercentage
}) => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '20px',
      marginBottom: '30px'
    }}>
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>Total Orders</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{totalOrders}</div>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>Total Refunds</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{totalRefunds}</div>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>Refund Amount</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>${totalRefundAmount.toFixed(2)}</div>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>Avg Refund %</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>{avgRefundPercentage.toFixed(1)}%</div>
      </div>
    </div>
  );
};
