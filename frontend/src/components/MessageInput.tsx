import React, { useState, useEffect } from 'react';
import { getSocket } from '../socket/socket';

type MediaType = 'image' | 'video' | 'link';

interface OutgoingMessagePayload {
  content?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
}

interface MessageInputProps {
  chatId: string;
  onSendMessage: (payload: OutgoingMessagePayload) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  chatId,
  onSendMessage,
}) => {
  const [message, setMessage] = useState('');
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('link');
  const [mediaError, setMediaError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const detectMediaTypeFromUrl = (url: string): MediaType => {
    const value = url.toLowerCase();
    if (/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)(\?|$)/.test(value)) return 'image';
    if (/(\.mp4|\.webm|\.mov|\.m4v|\.avi)(\?|$)/.test(value) || value.includes('youtube.com') || value.includes('youtu.be') || value.includes('vimeo.com')) return 'video';
    return 'link';
  };

  const isValidHttpUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      const socket = getSocket();
      socket?.emit('typing', { chatId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const socket = getSocket();
      socket?.emit('stop typing', { chatId });
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    const trimmedMediaUrl = mediaUrl.trim();

    if (!trimmedMessage && !trimmedMediaUrl) {
      return;
    }

    if (trimmedMediaUrl && !isValidHttpUrl(trimmedMediaUrl)) {
      setMediaError('Please enter a valid http/https URL.');
      return;
    }

    onSendMessage({
      content: trimmedMessage || undefined,
      mediaUrl: trimmedMediaUrl || undefined,
      mediaType: trimmedMediaUrl ? mediaType : undefined,
    });

    if (trimmedMessage) {
      setMessage('');
    }

    if (trimmedMediaUrl) {
      setMediaUrl('');
      setShowAttachmentPanel(false);
      setMediaType('link');
      setMediaError('');
    }

    setIsTyping(false);
    const socket = getSocket();
    socket?.emit('stop typing', { chatId });
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#d1d7db] bg-[#f0f2f5] p-2.5 sm:p-3">
      {showAttachmentPanel && (
        <div className="mb-2.5 rounded-lg border border-[#d7dde2] bg-white px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#54656f]">Send Media or Link</p>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-semibold text-[#667781] hover:bg-[#f0f2f5]"
              onClick={() => {
                setShowAttachmentPanel(false);
                setMediaUrl('');
                setMediaError('');
                setMediaType('link');
              }}
            >
              Close
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => {
                const nextUrl = e.target.value;
                setMediaUrl(nextUrl);
                setMediaError('');
                if (nextUrl.trim()) {
                  setMediaType(detectMediaTypeFromUrl(nextUrl));
                }
              }}
              placeholder="Paste image/video/link URL"
              className="w-full rounded-lg border border-[#d1d7db] bg-white px-3 py-2 text-sm text-[#111b21] placeholder:text-[#8696a0] focus:border-[#00a884] focus:outline-none"
            />

            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as MediaType)}
              className="rounded-lg border border-[#d1d7db] bg-white px-3 py-2 text-sm text-[#111b21] focus:border-[#00a884] focus:outline-none"
            >
              <option value="image">Photo</option>
              <option value="video">Video</option>
              <option value="link">Link</option>
            </select>
          </div>

          {mediaError && <p className="mt-2 text-xs font-medium text-[#c24141]">{mediaError}</p>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="shrink-0 rounded-full p-2 text-[#54656f] transition hover:bg-[#e4e6e9]"
          title="Attach file"
          onClick={() => setShowAttachmentPanel((prev) => !prev)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>

        <div className="flex flex-1 items-center gap-2 rounded-lg bg-white px-3 py-2.5">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Type a message"
            className="flex-1 bg-transparent text-sm text-[#111b21] placeholder:text-[#8696a0] focus:outline-none"
          />
          <button type="button" className="rounded-full p-1 text-[#54656f] transition hover:bg-[#f0f2f5]" title="Emoji">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </button>
        </div>

        <button
          type="submit"
          disabled={(!message.trim() && !mediaUrl.trim()) || !chatId}
          className="shrink-0 rounded-full bg-[#00a884] p-2.5 text-white transition hover:bg-[#029778] disabled:cursor-not-allowed disabled:bg-[#9db8c4]"
          title="Send message"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </form>
  );
};
