import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserAvatar } from './UserAvatar';
import { formatTime } from '../utils/avatarUtils';

interface Chat {
  _id: string;
  chatName?: string;
  name?: string;
  isGroupChat?: boolean;
  latestMessage?: {
    _id?: string;
    content: string;
    mediaType?: 'image' | 'video' | 'link';
    mediaUrl?: string;
    createdAt?: string;
    sender?: string | { _id?: string; toString?: () => string };
    status?: 'sent' | 'delivered' | 'seen';
  };
  users?: Array<{ _id: string; name: string }>;
}

interface SidebarProps {
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  onChatCreated?: (chat: Chat) => void;
  onDeleteChat?: (chatId: string) => void;
  selectedChatId?: string;
  onlineUsers?: string[];
  currentUserId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ chats, onSelectChat, onChatCreated, onDeleteChat, selectedChatId, onlineUsers = [], currentUserId }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chats' | 'people'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<Array<{_id: string, name: string, phoneNumber: string}>>([]);
  const [searchResults, setSearchResults] = useState<Array<{_id: string, name: string, phoneNumber: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load all users on mount
  useEffect(() => {
    const loadAllUsers = async () => {
      if (!user?._id) return;
      setLoadingUsers(true);
      try {
        const { data } = await api.get(`/users?userId=${user._id}`);
        setAllUsers(data);
      } catch (error) {
        console.error('Failed to load users', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadAllUsers();
  }, [user]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const fetchUsers = async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get(`/users?search=${encodeURIComponent(searchQuery)}&userId=${user?._id}`);
        setSearchResults(data);
      } catch (error) {
        console.error('Failed to search users', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const initiateChat = async (userId: string) => {
    setStartingChat(userId);
    try {
      const { data } = await api.post('/chats', { userId });
      setSearchQuery('');
      setSearchResults([]);
      if (onChatCreated) onChatCreated(data);
      onSelectChat(data._id);
      setActiveTab('chats');
    } catch (error) {
      console.error('Error creating chat', error);
    } finally {
      setStartingChat(null);
    }
  };

  const getChatDisplayName = (chat: Chat) => {
    if (!chat.isGroupChat && chat.users && chat.users.length > 0) {
      const otherUser = chat.users.find((u) => u._id !== user?._id);
      return otherUser?.name || 'Chat';
    }
    if (chat.chatName && chat.chatName !== 'sender') return chat.chatName;
    if (chat.name) return chat.name;
    return 'Chat';
  };

  const getOtherUser = (chat: Chat) => {
    if (chat.users && chat.users.length > 0) {
      return chat.users.find((u) => u._id !== user?._id);
    }
    return null;
  };

  const isUserOnline = (chat: Chat) => {
    const otherUser = getOtherUser(chat);
    return otherUser ? onlineUsers.includes(otherUser._id) : false;
  };

  const filteredChats = chats.filter((chat) =>
    getChatDisplayName(chat).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLatestMessagePreview = (chat: Chat) => {
    if (!chat.latestMessage) return 'No messages yet';
    if (chat.latestMessage.content?.trim()) return chat.latestMessage.content;
    if (chat.latestMessage.mediaType === 'image') return 'Photo';
    if (chat.latestMessage.mediaType === 'video') return 'Video';
    if (chat.latestMessage.mediaType === 'link') return chat.latestMessage.mediaUrl || 'Link';
    return 'No messages yet';
  };

  const getSenderId = (sender: Chat['latestMessage'] extends infer T
    ? T extends { sender?: infer S }
      ? S
      : never
    : never) => {
    if (!sender) return '';

    if (typeof sender === 'string') {
      return sender;
    }

    if (typeof sender === 'object' && sender._id && typeof sender._id === 'string') {
      return sender._id;
    }

    const maybeId = String(sender);
    return maybeId === '[object Object]' ? '' : maybeId;
  };

  const hasUnreadMessages = (chat: Chat) => {
    const latest = chat.latestMessage;
    if (!latest?.sender) return false;
    const senderId = getSenderId(latest.sender);
    if (!senderId) return false;
    return senderId !== currentUserId && latest.status !== 'seen';
  };

  // Which users to show in people tab
  const peopleToShow = searchQuery ? searchResults : allUsers;

  const UserRow = ({ u, onClick }: { u: { _id: string; name: string; phoneNumber: string }; onClick: () => void }) => {
    const online = onlineUsers.includes(u._id);
    const isLoading = startingChat === u._id;
    return (
      <button
        key={u._id}
        onClick={onClick}
        disabled={isLoading}
        className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all border border-transparent hover:bg-white/5 hover:border-white/10 disabled:opacity-60"
      >
        <UserAvatar name={u.name} isOnline={online} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-slate-200 group-hover:text-white">
            {u.name}
          </h3>
          <p className="truncate text-sm text-slate-500 group-hover:text-slate-400">
            {u.phoneNumber}
          </p>
        </div>
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition text-indigo-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </button>
    );
  };

  return (
    <>
    <aside className="flex h-full w-full flex-col glass-panel rounded-2xl overflow-hidden bg-black/10">
      <div className="border-b border-white/10 bg-white/5 p-4 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar name={user?.name || 'User'} size="md" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">{user?.name}</h1>
              <p className="text-xs text-green-400 font-medium">Online</p>
            </div>
          </div>
          <div className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-xs font-bold border border-indigo-500/30">
            {chats.length} chats
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <svg className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search people or chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none transition backdrop-blur-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-black/20 p-1">
          <button
            onClick={() => setActiveTab('chats')}
            className={`rounded-md py-1.5 text-xs font-semibold transition ${activeTab === 'chats' ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'}`}
          >
            💬 Chats {chats.length > 0 && `(${chats.length})`}
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`rounded-md py-1.5 text-xs font-semibold transition ${activeTab === 'people' ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'}`}
          >
            👥 People {allUsers.length > 0 && `(${allUsers.length})`}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {activeTab === 'chats' ? (
          <>
            {searchQuery && (
              <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
              </div>
            )}
            {filteredChats.length === 0 ? (
              <div className="flex flex-col h-full items-center justify-center text-center px-4 gap-3">
                <div className="text-slate-500">
                  <svg className="mx-auto h-10 w-10 opacity-40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">{searchQuery ? 'No chats match your search.' : 'No conversations yet.'}</p>
                  {!searchQuery && (
                    <button
                      onClick={() => setActiveTab('people')}
                      className="mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                    >
                      Browse People to start chatting →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {filteredChats.map((chat) => {
                  const displayName = getChatDisplayName(chat);
                  const isOnline = isUserOnline(chat);
                  const lastMessageTime = chat.latestMessage?.createdAt ? formatTime(chat.latestMessage.createdAt) : '';
                  const isDeleting = deletingId === chat._id;
                  const hasUnread = hasUnreadMessages(chat);
                  return (
                    <div key={chat._id} className="relative group/row">
                      <button
                        type="button"
                        onClick={() => onSelectChat(chat._id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 pr-10 text-left transition-all relative overflow-hidden ${
                          selectedChatId === chat._id
                            ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30'
                            : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                        }`}
                      >
                        {selectedChatId === chat._id && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/4 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                        )}
                        <UserAvatar name={displayName} isOnline={isOnline} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="min-w-0 flex items-center gap-2">
                              <h3 className={`truncate text-[15px] font-semibold transition-colors ${selectedChatId === chat._id ? 'text-white' : 'text-slate-200'}`}>
                                {displayName}
                              </h3>
                              {hasUnread && selectedChatId !== chat._id && (
                                <span
                                  className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] shrink-0"
                                  aria-label="Unread messages"
                                  title="Unread messages"
                                />
                              )}
                            </div>
                            {lastMessageTime && <span className={`text-[11px] font-medium ${selectedChatId === chat._id ? 'text-indigo-300' : 'text-slate-500'}`}>{lastMessageTime}</span>}
                          </div>
                          <p className={`truncate text-sm ${selectedChatId === chat._id ? 'text-slate-300' : 'text-slate-500'}`}>
                            {getLatestMessagePreview(chat)}
                          </p>
                        </div>
                      </button>
                      {/* Delete button - appears on row hover */}
                      {onDeleteChat && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(chat._id); }}
                          disabled={isDeleting}
                          title="Delete chat"
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-all rounded-lg p-1.5 text-slate-500 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {searchQuery
                ? isSearching ? 'Searching...' : `Results for "${searchQuery}"`
                : loadingUsers ? 'Loading people...' : `All People (${allUsers.length})`}
            </div>
            {loadingUsers && !searchQuery ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : peopleToShow.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                {searchQuery ? 'No users found.' : 'No other users registered yet.'}
              </div>
            ) : (
              <div>
                {peopleToShow.map((u) => (
                  <UserRow key={u._id} u={u} onClick={() => initiateChat(u._id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>

    {/* Delete Confirmation Modal */}
    {confirmDeleteId && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setConfirmDeleteId(null)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Delete Chat</h3>
          <p className="text-sm text-slate-400 mb-6">This will permanently delete the conversation for you. This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!confirmDeleteId) return;
                setDeletingId(confirmDeleteId);
                setConfirmDeleteId(null);
                await onDeleteChat?.(confirmDeleteId);
                setDeletingId(null);
              }}
              className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
