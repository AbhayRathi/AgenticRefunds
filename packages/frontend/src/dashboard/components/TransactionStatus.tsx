import { TransactionResult } from '../../types/demo';

interface TransactionStatusProps {
  result: TransactionResult;
}

export function TransactionStatus({ result }: TransactionStatusProps) {
  return (
    <div className="bg-green-900/30 border border-green-500 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-green-400 mb-4">
        ✓ TRANSACTION COMPLETE
      </h3>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500">Amount</div>
          <div className="text-2xl font-bold text-green-400">
            ${result.amount.toFixed(2)} USDC
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Transaction Hash</div>
          <div className="text-xs font-mono text-gray-400 break-all">
            {result.transactionHash}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-700 text-xs text-gray-500">
          Settled via Coinbase x402 Protocol
        </div>
      </div>
    </div>
  );
}
