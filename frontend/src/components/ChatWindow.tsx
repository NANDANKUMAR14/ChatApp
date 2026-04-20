import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface Message {
  _id: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'link';
  sender: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  createdAt: string;
  status?: 'sent' | 'delivered' | 'seen';
}

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  currentUserId: string;
  isLoading?: boolean;
  onEditMessage?: (messageId: string, content: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isTyping,
  currentUserId,
  isLoading = false,
  onEditMessage,
  onDeleteMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden wa-chat-bg">
      <div
        ref={messagesContainerRef}
        className="relative flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-8"
        style={{ scrollBehavior: 'smooth' }}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#d5dadf] border-t-[#00a884] animate-spin" />
              <p className="mt-3 text-sm font-medium text-[#667781]">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-lg border border-[#e9edef] bg-[#ffffffde] px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e9edef] text-[#00a884]">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#111b21]">No messages yet</p>
              <p className="mt-1 text-xs text-[#667781]">Say hello to start this conversation.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.sender._id === currentUserId;
              // Show name/avatar on the first message of each sender group
              const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;

              return (
                <div key={message._id} className="animate-rise-in">
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    onEditMessage={onEditMessage}
                    onDeleteMessage={onDeleteMessage}
                  />
                </div>
              );
            })}
          </div>
        )}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 shrink-0" />
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
};
