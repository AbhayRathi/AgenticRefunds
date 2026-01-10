import { TransactionResult } from '../../types/demo';

interface TransactionCompleteProps {
  result: TransactionResult;
}

export function TransactionComplete({ result }: TransactionCompleteProps) {
  return (
    <div className="mt-3 bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-3xl text-white mx-auto mb-4">
        ✓
      </div>

      <h3 className="text-xl font-bold text-green-800">Transaction Complete</h3>

      <div className="mt-4 space-y-2">
        <div className="text-3xl font-bold text-green-600">
          ${result.amount.toFixed(2)}
        </div>
        <div className="text-sm text-green-600">Funds Settled</div>
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg text-xs text-gray-500 font-mono break-all">
        {result.transactionHash}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
        <span>⚡</span>
        <span>Powered by Coinbase x402</span>
      </div>
    </div>
  );
}
