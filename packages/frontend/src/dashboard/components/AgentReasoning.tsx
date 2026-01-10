import { ChatMessage } from '../../types/demo';

interface AgentReasoningProps {
  messages: ChatMessage[];
}

export function AgentReasoning({ messages }: AgentReasoningProps) {
  const agentMessages = messages.filter(m => !m.isUser);

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4">AGENT REASONING</h3>

      {agentMessages.length === 0 ? (
        <p className="text-gray-500 text-sm">Chat not started</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {agentMessages.slice().reverse().map((msg, i) => (
            <div key={i} className="p-3 bg-gray-700/50 rounded-lg">
              {msg.thinkingState && (
                <div className="text-blue-400 text-xs mb-1">
                  ⏳ {msg.thinkingState}
                </div>
              )}
              <p className="text-sm">{msg.content}</p>
              {msg.proposalCard && (
                <div className="mt-2 text-xs text-green-400">
                  💰 Proposed refund: ${msg.proposalCard.totalRefund.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
