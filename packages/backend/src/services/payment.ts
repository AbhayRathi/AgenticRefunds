import { ledgerService } from './ledger';
import { CDPService } from './cdp';
import { logger } from '../config/logger';

interface PaymentResult {
  method: 'credit' | 'cash' | 'hybrid';
  creditUsed: number;
  usdcPaid: number;
  txHash?: string;
  newCreditBalance: number;
}

export class PaymentService {
  constructor(private cdpService: CDPService) {}

  async processRefund(
    userId: string,
    refundAmount: number,
    walletAddress: string,
    preferredMethod: 'cash' | 'credit'
  ): Promise<PaymentResult> {
    logger.info('Processing refund', { userId, refundAmount, preferredMethod });

    // CREDIT REFUND (with 50% bonus)
    if (preferredMethod === 'credit') {
      const bonusAmount = refundAmount * 1.5; // 50% bonus
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
        orderId: `refund-${Date.now()}`
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
      orderId: `refund-${Date.now()}`
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
