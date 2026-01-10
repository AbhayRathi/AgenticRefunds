import { useState, useRef, useEffect } from 'react';
import { DemoOrder, ChatMessage, BroadcastEvent } from '../../types/demo';
import { agentService } from '../../services';
import { ChatMessageBubble } from '../components/ChatMessage';
import { SuggestionChip } from '../components/SuggestionChip';
import { ProposalCard } from '../components/ProposalCard';
import { TransactionComplete } from '../components/TransactionComplete';

interface ChatViewProps {
  order: DemoOrder;
  onBroadcast: (event: BroadcastEvent) => void;
}

export function ChatView({ order: _order, onBroadcast }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingState, setThinkingState] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial agent message
  useEffect(() => {
    const initChat = async () => {
      setIsTyping(true);
      const response = await agentService.sendMessage('', 0);
      setMessages([response]);
      setIsTyping(false);
      onBroadcast({ type: 'CHAT_MESSAGE', payload: response });
    };
    initChat();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSuggestionClick = async (suggestion: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      agent: 'refund',
      content: suggestion,
      timestamp: Date.now(),
      isUser: true,
    };
    setMessages(prev => [...prev, userMsg]);
    onBroadcast({ type: 'CHAT_MESSAGE', payload: userMsg });

    // Handle photo upload step
    if (suggestion === 'Upload photo') {
      // Simulate photo upload
      await new Promise(r => setTimeout(r, 500));
      onBroadcast({ type: 'PHOTO_UPLOADED', payload: { url: '/mock-photo.jpg' } });

      // Simulate photo analysis
      const analysis = await agentService.analyzePhoto('/mock-photo.jpg');
      onBroadcast({ type: 'PHOTO_ANALYZED', payload: analysis });
    }

    // Get agent response
    const nextStep = step + 1;
    setStep(nextStep);
    setIsTyping(true);

    const response = await agentService.sendMessage(suggestion, nextStep);

    if (response.thinkingState) {
      setThinkingState(response.thinkingState);
      await new Promise(r => setTimeout(r, 2000));
      setThinkingState(null);
    }

    setMessages(prev => [...prev, response]);
    setIsTyping(false);
    onBroadcast({ type: 'CHAT_MESSAGE', payload: response });
  };

  const handleAcceptProposal = async (proposal: ChatMessage['proposalCard']) => {
    if (!proposal) return;

    // Add acceptance message
    const acceptMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      agent: 'refund',
      content: 'I accept this offer',
      timestamp: Date.now(),
      isUser: true,
    };
    setMessages(prev => [...prev, acceptMsg]);

    // Show processing
    setThinkingState('Processing instant refund via Coinbase x402...');

    const result = await agentService.processRefund(proposal);

    setThinkingState(null);

    // Add completion message
    const completeMsg: ChatMessage = {
      id: `complete-${Date.now()}`,
      agent: 'refund',
      content: 'Your refund has been processed!',
      timestamp: Date.now(),
      isUser: false,
      transactionComplete: result,
    };
    setMessages(prev => [...prev, completeMsg]);
    onBroadcast({ type: 'TRANSACTION_COMPLETE', payload: result });
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-doordash-red rounded-full flex items-center justify-center text-white text-sm">
            🤖
          </div>
          <div>
            <div className="font-semibold text-sm">DoorDash Refund Agent</div>
            <div className="text-xs text-gray-500">AI-Powered Support</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id}>
            <ChatMessageBubble message={msg} />

            {/* Proposal Card */}
            {msg.proposalCard && (
              <ProposalCard
                proposal={msg.proposalCard}
                onAccept={() => handleAcceptProposal(msg.proposalCard)}
              />
            )}

            {/* Transaction Complete */}
            {msg.transactionComplete && (
              <TransactionComplete result={msg.transactionComplete} />
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              🤖
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        {/* Thinking State */}
        {thinkingState && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            ⏳ {thinkingState}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {lastMessage?.suggestions && !isTyping && !thinkingState && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {lastMessage.suggestions.map((suggestion, i) => (
              <SuggestionChip
                key={i}
                text={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
