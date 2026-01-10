import { logger } from '../config/logger';

export class LedgerService {
  // In-memory store for demo (faster than MongoDB writes)
  private ledgers = new Map<string, { balance: number; wallet: string }>();

  constructor() {
    // Seed with mock user
    this.ledgers.set('user-123', {
      balance: 5.0,
      wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'  // Fixed: Added trailing 0 for 40 chars
    });
    logger.info('LedgerService initialized with mock user', { userId: 'user-123', balance: 5.0 });
  }

  getBalance(userId: string): number {
    const ledger = this.ledgers.get(userId);
    if (!ledger) {
      logger.warn('User ledger not found, returning 0', { userId });
      return 0;
    }
    return ledger.balance;
  }

  addCredit(userId: string, amount: number): number {
    const current = this.getBalance(userId);
    const newBalance = current + amount;
    
    const existingLedger = this.ledgers.get(userId);
    this.ledgers.set(userId, {
      balance: newBalance,
      wallet: existingLedger?.wallet || ''
    });
    
    logger.info('Credit added to user ledger', { userId, amount, newBalance });
    return newBalance;
  }

  deductCredit(userId: string, amount: number): number {
    const current = this.getBalance(userId);
    if (current < amount) {
      throw new Error(`Insufficient credit. Available: ${current}, Required: ${amount}`);
    }
    
    const newBalance = current - amount;
    const existingLedger = this.ledgers.get(userId);
    this.ledgers.set(userId, {
      balance: newBalance,
      wallet: existingLedger?.wallet || ''
    });
    
    logger.info('Credit deducted from user ledger', { userId, amount, newBalance });
    return newBalance;
  }

  getWalletAddress(userId: string): string | undefined {
    return this.ledgers.get(userId)?.wallet;
  }
}

export const ledgerService = new LedgerService();
