import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="w-fit rounded-lg rounded-bl-sm bg-white px-3 py-2">
      <div className="flex items-center gap-1.5">
      <div
        className="h-2.5 w-2.5 animate-soft-pulse rounded-full bg-[#8696a0]"
        style={{ animationDelay: '0ms' }}
      />
      <div
        className="h-2.5 w-2.5 animate-soft-pulse rounded-full bg-[#8696a0]"
        style={{ animationDelay: '150ms' }}
      />
      <div
        className="h-2.5 w-2.5 animate-soft-pulse rounded-full bg-[#8696a0]"
        style={{ animationDelay: '300ms' }}
      />
      </div>
    </div>
  );
};
