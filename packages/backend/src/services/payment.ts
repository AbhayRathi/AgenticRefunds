import { ledgerService } from './ledger';
import { CDPService } from './cdp';
import { logger } from '../config/logger';

// Constants
const CREDIT_BONUS_MULTIPLIER = 1.5; // 50% bonus for credit refunds

interface PaymentResult {
  method: 'credit' | 'cash' | 'hybrid';
  creditUsed: number;
  usdcPaid: number;
  txHash?: string;
  newCreditBalance: number;
}

export class PaymentService {
  constructor(private cdpService: CDPService) {}

  private generateOrderId(): string {
    return `refund-${Date.now()}`;
  }

  async processRefund(
    userId: string,
    refundAmount: number,
    walletAddress: string,
    preferredMethod: 'cash' | 'credit'
  ): Promise<PaymentResult> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId: must be a non-empty string');
    }
    if (typeof refundAmount !== 'number' || refundAmount <= 0 || !isFinite(refundAmount)) {
      throw new Error('Invalid refundAmount: must be a positive number');
    }
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new Error('Invalid walletAddress: must be a valid Ethereum address');
    }
    if (!['cash', 'credit'].includes(preferredMethod)) {
      throw new Error('Invalid preferredMethod: must be "cash" or "credit"');
    }

    logger.info('Processing refund', { userId, refundAmount, preferredMethod });

    // CREDIT REFUND (with 50% bonus)
    if (preferredMethod === 'credit') {
      const bonusAmount = refundAmount * CREDIT_BONUS_MULTIPLIER;
      const newBalance = ledgerService.addCredit(userId, bonusAmount);
      
      logger.info('Credit refund processed with bonus', {
        userId,
        baseAmount: refundAmount,
        bonusAmount,
        newBalance
      });

      return {
        method: 'credit',
        creditUsed: 0,
        usdcPaid: 0,
        newCreditBalance: newBalance
      };
    }

    // CASH REFUND (via CDP on-chain)
    const currentCredit = ledgerService.getBalance(userId);

    // Check if we need hybrid payment
    if (currentCredit > 0 && currentCredit < refundAmount) {
      const remainder = refundAmount - currentCredit;
      
      try {
        // Transfer FIRST, THEN deduct credit if successful
        const transferResult = await this.cdpService.transfer({
          recipientAddress: walletAddress,
          amount: remainder.toString(),
          currency: 'USDC',
          orderId: this.generateOrderId()
        });
        
        // Only deduct after successful transfer
        ledgerService.deductCredit(userId, currentCredit);
        const newBalance = ledgerService.getBalance(userId);
        
        logger.info('Hybrid refund processed', {
          userId,
          creditUsed: currentCredit,
          usdcPaid: remainder,
          txHash: transferResult.transactionHash
        });

        return {
          method: 'hybrid',
          creditUsed: currentCredit,
          usdcPaid: remainder,
          txHash: transferResult.transactionHash,
          newCreditBalance: newBalance
        };
      } catch (error) {
        logger.error('Hybrid payment CDP transfer failed, credit preserved', { error, userId });
        throw new Error('On-chain transfer failed. Your credit balance is safe.');
      }
    }

    // Pure cash refund via CDP
    const transferResult = await this.cdpService.transfer({
      recipientAddress: walletAddress,
      amount: refundAmount.toString(),
      currency: 'USDC',
      orderId: this.generateOrderId()
    });
    
    const newBalance = ledgerService.getBalance(userId);

    logger.info('Cash refund processed via CDP', {
      userId,
      amount: refundAmount,
      txHash: transferResult.transactionHash
    });

    return {
      method: 'cash',
      creditUsed: 0,
      usdcPaid: refundAmount,
      txHash: transferResult.transactionHash,
      newCreditBalance: newBalance
    };
  }
}
