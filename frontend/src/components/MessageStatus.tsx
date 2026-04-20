import React from 'react';

interface MessageStatusProps {
  status: 'sent' | 'delivered' | 'seen';
  size?: 'sm' | 'md';
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ status, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  if (status === 'sent') {
    return (
      <svg className={`${sizeClass} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  if (status === 'delivered') {
    return (
      <svg className={`${sizeClass} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 19l4 4L19 13" />
      </svg>
    );
  }

  return (
    <svg className={`${sizeClass} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 19l4 4L19 13" />
    </svg>
  );
};
