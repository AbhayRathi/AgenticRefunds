import { RefundProposal } from '../../types/demo';

interface ProposalCardProps {
  proposal: RefundProposal;
  onAccept: () => void;
}

export function ProposalCard({ proposal, onAccept }: ProposalCardProps) {
  return (
    <div className="mt-3 bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h4 className="font-bold text-gray-900">Refund Proposal</h4>
      </div>

      <div className="p-4 space-y-3">
        {proposal.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">{item.reason}</div>
            </div>
            <div className="text-right">
              <div className={`font-bold ${
                item.status === 'full' ? 'text-green-600' :
                item.status === 'partial' ? 'text-yellow-600' : 'text-gray-400'
              }`}>
                ${item.refundAmount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                {item.status === 'full' ? 'Full Refund' :
                 item.status === 'partial' ? 'Partial Credit' : 'No Refund'}
              </div>
            </div>
          </div>
        ))}

        <div className="pt-3 mt-3 border-t flex items-center justify-between">
          <span className="font-bold text-lg">Total Refund</span>
          <span className="font-bold text-xl text-green-600">
            ${proposal.totalRefund.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
        >
          Accept Offer
        </button>
        <button className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-100">
          Decline
        </button>
      </div>
    </div>
  );
}
