import { ChatMessage } from '../../types/demo';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  if (message.isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-doordash-red text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
        🤖
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
        {message.content}
      </div>
    </div>
  );
}
