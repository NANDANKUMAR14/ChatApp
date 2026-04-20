import React from 'react';
import { formatTimeShort } from '../utils/avatarUtils';
import { UserAvatar } from './UserAvatar';
import { MessageStatus } from './MessageStatus';

interface Message {
  _id: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'link';
  isDeleted?: boolean;
  deletedAt?: string;
  sender: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  createdAt: string;
  status?: 'sent' | 'delivered' | 'seen';
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onEditMessage?: (messageId: string, content: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  onEditMessage,
  onDeleteMessage,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftContent, setDraftContent] = React.useState(message.content || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const time = formatTimeShort(message.createdAt);

  const renderMedia = () => {
    if (message.isDeleted || !message.mediaUrl || !message.mediaType) return null;

    if (message.mediaType === 'image') {
      return (
        <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-white/15">
          <img src={message.mediaUrl} alt="Shared media" className="max-h-72 w-full object-cover" loading="lazy" />
        </a>
      );
    }

    if (message.mediaType === 'video') {
      return (
        <div className="overflow-hidden rounded-xl border border-white/15 bg-black/30">
          <video controls className="max-h-72 w-full">
            <source src={message.mediaUrl} />
          </video>
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="block border-t border-white/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:text-cyan-100"
          >
            Open video link
          </a>
        </div>
      );
    }

    return (
      <a
        href={message.mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="block rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 hover:bg-black/30"
      >
        <p className="text-[11px] uppercase tracking-wide text-cyan-200">Shared Link</p>
        <p className="mt-1 break-all text-sm font-semibold text-cyan-100">{message.mediaUrl}</p>
      </a>
    );
  };

  React.useEffect(() => {
    if (!isEditing) {
      setDraftContent(message.content || '');
    }
  }, [message.content, isEditing]);

  const handleSaveEdit = async () => {
    const trimmed = draftContent.trim();
    if (!trimmed || !onEditMessage) return;

    try {
      setIsSaving(true);
      await onEditMessage(message._id, trimmed);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteMessage) return;
    const confirmed = window.confirm('Delete this message?');
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await onDeleteMessage(message._id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`group mb-1 flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar placeholder to keep alignment when avatar is hidden */}
      <div className="mt-auto mb-1 w-7 shrink-0">
        {showAvatar && !isOwn && (
          <UserAvatar name={message.sender.name} size="sm" />
        )}
      </div>

      <div className={`flex max-w-[78%] flex-col sm:max-w-[68%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name — shown on the first message of each group */}
        {showAvatar && (
          <span className={`mb-1 px-1 text-[11px] font-semibold tracking-wide ${
            isOwn ? 'text-indigo-300/80' : 'text-slate-300/80'
          }`}>
            {isOwn ? 'You' : message.sender.name}
          </span>
        )}

        {isOwn && !isEditing && !message.isDeleted && (
          <div className="mb-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-100 hover:bg-white/20"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-60"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}

        <div className={`relative rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur-md break-words ${
          isOwn
            ? 'rounded-br-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white border border-indigo-400/30 shadow-indigo-500/20'
            : 'rounded-bl-sm bg-white/10 text-slate-100 border border-white/5'
        }`}>
          {message.mediaUrl && !message.isDeleted && (
            <div className="mb-2">{renderMedia()}</div>
          )}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-white/25 bg-black/20 px-2.5 py-2 text-sm text-white placeholder:text-slate-300 focus:border-cyan-300 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/25"
                  onClick={() => {
                    setIsEditing(false);
                    setDraftContent(message.content || '');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-emerald-500/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !draftContent.trim()}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : message.content && !message.isDeleted ? (
            <p className="text-[15px] leading-relaxed tracking-wide">{message.content}</p>
          ) : null}
          {message.isDeleted && (
            <p className="text-[14px] italic leading-relaxed text-slate-200/80">This message was deleted</p>
          )}
        </div>

        <div className={`flex items-center gap-1.5 px-1 pt-0.5 text-[11px] font-medium opacity-0 transition-all transform translate-y-[-5px] group-hover:translate-y-0 group-hover:opacity-100 ${
          isOwn ? 'text-indigo-300' : 'text-slate-500'
        }`}>
          <span>{time}</span>
          {isOwn && message.status && (
            <MessageStatus status={message.status} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
};

