import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { TransferRequest, TransferResponse } from '@delivery-shield/shared';

export class CDPService {
  private coinbase: Coinbase;
  private wallet: Wallet | null = null;

  constructor(apiKeyName: string, privateKey: string) {
    this.coinbase = new Coinbase({
      apiKeyName,
      privateKey
    });
  }

  async initializeWallet(walletId?: string): Promise<void> {
    try {
      if (walletId) {
        // Load existing wallet
        this.wallet = await Wallet.fetch(walletId);
        console.log('CDP Wallet loaded:', walletId);
      } else {
        // Create new wallet
        this.wallet = await Wallet.create({ networkId: 'base-sepolia' });
        console.log('CDP Wallet created:', await this.wallet.getId());
        console.log('Wallet address:', await this.wallet.getDefaultAddress());
      }
    } catch (error) {
      console.error('Failed to initialize CDP wallet:', error);
      throw error;
    }
  }

  async transfer(request: TransferRequest): Promise<TransferResponse> {
    if (!this.wallet) {
      return {
        success: false,
        error: 'Wallet not initialized'
      };
    }

    try {
      console.log(`Initiating transfer of ${request.amount} ${request.currency} to ${request.recipientAddress}`);
      
      // Get the default address from the wallet
      const address = await this.wallet.getDefaultAddress();
      
      // Create and execute the transfer
      const transfer = await address.createTransfer({
        amount: parseFloat(request.amount),
        assetId: request.currency.toLowerCase(), // 'usdc' for Base USDC
        destination: request.recipientAddress
      });

      // Wait for the transfer to complete
      await transfer.wait();

      console.log('Transfer completed:', transfer.getTransactionHash());

      return {
        success: true,
        transactionHash: transfer.getTransactionHash()
      };
    } catch (error) {
      console.error('Transfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed'
      };
    }
  }

  async getBalance(assetId: string = 'usdc'): Promise<string> {
    if (!this.wallet) {
      return '0';
    }

    try {
      const address = await this.wallet.getDefaultAddress();
      const balance = await address.getBalance(assetId);
      return balance.toString();
    } catch (error) {
      console.error('Balance check error:', error);
      return '0';
    }
  }

  getWalletAddress(): string | null {
    return this.wallet ? this.wallet.getDefaultAddress().toString() : null;
  }
}
