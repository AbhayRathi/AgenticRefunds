import axios from 'axios';
import { 
  RAGEvaluationRequest, 
  RAGEvaluationResponse, 
  RefundResponse,
  SystemLog 
} from '@delivery-shield/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const refundService = {
  async evaluateRefund(data: RAGEvaluationRequest): Promise<{ evaluation: RAGEvaluationResponse }> {
    const response = await axios.post(`${API_BASE_URL}/refunds/evaluate`, data);
    return response.data;
  },

  async processRefund(data: {
    orderId: string;
    customerId: string;
    customerWalletAddress: string;
    systemLogs: SystemLog[];
    deliveryOrder: any;
  }): Promise<RefundResponse> {
    const response = await axios.post(`${API_BASE_URL}/refunds/process`, data);
    return response.data;
  },

  async getRefundStatus(refundId: string): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/refunds/status/${refundId}`);
    return response.data;
  },

  async simulateIssue(issueType: string, latencyMs?: number): Promise<{ systemLogs: SystemLog[] }> {
    const response = await axios.post(`${API_BASE_URL}/refunds/simulate`, {
      issueType,
      latencyMs
    });
    return response.data;
  },

  async healthCheck(): Promise<any> {
    const response = await axios.get('/health');
    return response.data;
  },

  async negotiateRefund(data: {
    orderId: string;
    customerId: string;
    walletAddress: string;
    choice: 'cash' | 'credit';
  }): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/refunds/negotiate`, data);
    return response.data;
  },

  async getUserLedger(userId: string): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/refunds/ledger/${userId}`);
    return response.data;
  }
};
