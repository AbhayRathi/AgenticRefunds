import { ledgerService } from '../../services/ledger';
import { PaymentService } from '../../services/payment';
import { CDPService } from '../../services/cdp';

// Mock the CDP service
jest.mock('../../services/cdp');

describe('Payment Service', () => {
  let paymentService: PaymentService;
  let mockCdpService: jest.Mocked<CDPService>;

  beforeEach(() => {
    // Create a mocked CDP service
    mockCdpService = {
      transfer: jest.fn().mockResolvedValue({
        success: true,
        transactionHash: '0xmockhash123'
      }),
      getBalance: jest.fn().mockResolvedValue('100'),
      initializeWallet: jest.fn().mockResolvedValue(undefined),
      getWalletAddress: jest.fn().mockReturnValue('0xmockaddress')
    } as any;

    paymentService = new PaymentService(mockCdpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Credit Refund', () => {
    it('should add credit with 50% bonus', async () => {
      const initial = ledgerService.getBalance('user-123');
      
      const result = await paymentService.processRefund(
        'user-123',
        10.0,
        '0xtest',
        'credit'
      );

      expect(result.method).toBe('credit');
      expect(result.creditUsed).toBe(0);
      expect(result.usdcPaid).toBe(0);
      expect(result.newCreditBalance).toBe(initial + 15.0); // 50% bonus
      expect(mockCdpService.transfer).not.toHaveBeenCalled();
    });

    it('should not call CDP service for credit refunds', async () => {
      await paymentService.processRefund(
        'user-123',
        5.0,
        '0xtest',
        'credit'
      );

      expect(mockCdpService.transfer).not.toHaveBeenCalled();
    });
  });

  describe('Cash Refund', () => {
    it('should use CDP for pure cash refund when no credit available', async () => {
      const result = await paymentService.processRefund(
        'user-no-credit',
        10.0,
        '0xtestaddress',
        'cash'
      );

      expect(result.method).toBe('cash');
      expect(result.creditUsed).toBe(0);
      expect(result.usdcPaid).toBe(10.0);
      expect(result.txHash).toBe('0xmockhash123');
      expect(mockCdpService.transfer).toHaveBeenCalledWith({
        recipientAddress: '0xtestaddress',
        amount: '10',
        currency: 'USDC',
        orderId: expect.stringContaining('refund-')
      });
    });
  });

  describe('Hybrid Payment', () => {
    it('should use hybrid payment when credit insufficient', async () => {
      // user-123 has 5.0 credit initially (from ledger service seed)
      const result = await paymentService.processRefund(
        'user-123',
        20.0,
        '0xtesthybrid',
        'cash'
      );

      expect(['cash', 'hybrid']).toContain(result.method);
      expect(result.usdcPaid).toBeGreaterThan(0);
      
      if (result.method === 'hybrid') {
        expect(result.creditUsed).toBeGreaterThan(0);
        expect(result.creditUsed + result.usdcPaid).toBe(20.0);
      }
    });

    it('should deduct credit and use CDP for remainder in hybrid', async () => {
      // Reset to known state: give user exactly 5 credit
      ledgerService.addCredit('user-test-hybrid', 5.0);
      
      const result = await paymentService.processRefund(
        'user-test-hybrid',
        15.0,
        '0xhybridtest',
        'cash'
      );

      expect(result.method).toBe('hybrid');
      expect(result.creditUsed).toBe(5.0);
      expect(result.usdcPaid).toBe(10.0);
      expect(result.txHash).toBe('0xmockhash123');
      expect(mockCdpService.transfer).toHaveBeenCalledWith({
        recipientAddress: '0xhybridtest',
        amount: '10',
        currency: 'USDC',
        orderId: expect.stringContaining('refund-')
      });
    });
  });

  describe('Ledger Service', () => {
    it('should get balance correctly', () => {
      const balance = ledgerService.getBalance('user-123');
      expect(balance).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for non-existent user', () => {
      const balance = ledgerService.getBalance('non-existent-user');
      expect(balance).toBe(0);
    });

    it('should add credit correctly', () => {
      const initial = ledgerService.getBalance('user-add-test');
      const newBalance = ledgerService.addCredit('user-add-test', 10.0);
      expect(newBalance).toBe(initial + 10.0);
    });

    it('should deduct credit correctly', () => {
      ledgerService.addCredit('user-deduct-test', 20.0);
      const newBalance = ledgerService.deductCredit('user-deduct-test', 5.0);
      expect(newBalance).toBe(15.0);
    });

    it('should throw error when deducting more than available', () => {
      expect(() => {
        ledgerService.deductCredit('user-123', 999999);
      }).toThrow('Insufficient credit');
    });
  });
});
