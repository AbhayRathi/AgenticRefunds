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
      // Use available credit + CDP for remainder
      ledgerService.deductCredit(userId, currentCredit);
      const remainder = refundAmount - currentCredit;
      
      const transferResult = await this.cdpService.transfer({
        recipientAddress: walletAddress,
        amount: remainder.toString(),
        currency: 'USDC',
        orderId: this.generateOrderId()
      });
      
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
