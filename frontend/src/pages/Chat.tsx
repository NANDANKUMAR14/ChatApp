import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getSocket } from '../socket/socket';
import { Sidebar } from '../components/Sidebar';
import { ChatWindow } from '../components/ChatWindow';
import { MessageInput } from '../components/MessageInput';
import { UserAvatar } from '../components/UserAvatar';
import { useNavigate } from 'react-router-dom';

type MediaType = 'image' | 'video' | 'link';

interface OutgoingMessagePayload {
  content?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
}

interface Message {
  _id: string;
  content: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  isDeleted?: boolean;
  deletedAt?: string;
  chat?: string | { _id: string };
  sender: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  createdAt: string;
  updatedAt?: string;
  status?: 'sent' | 'delivered' | 'seen';
}

interface Chat {
  _id: string;
  isGroupChat?: boolean;
  chatName?: string;
  name?: string;
  latestMessage?: {
    _id?: string;
    content: string;
    mediaType?: MediaType;
    mediaUrl?: string;
    createdAt?: string;
    sender?: string | { _id?: string; toString?: () => string };
    status?: 'sent' | 'delivered' | 'seen';
  };
  users?: Array<{ _id: string; name: string }>;
}

export const Chat: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [messageError, setMessageError] = useState<string>('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const getMessagePreview = (message: Pick<Message, 'content' | 'mediaType' | 'mediaUrl' | 'isDeleted'>) => {
    if (message.isDeleted) return 'This message was deleted';
    if (message.content?.trim()) return message.content;
    if (message.mediaType === 'image') return 'Photo';
    if (message.mediaType === 'video') return 'Video';
    if (message.mediaType === 'link') return message.mediaUrl || 'Link';
    return 'Message';
  };

  const getMessageChatId = (message: Message) =>
    typeof message.chat === 'string' ? message.chat : message.chat?._id;

  const getLatestMessageSenderId = (chat: Chat) => {
    const sender = chat.latestMessage?.sender;
    if (!sender) return null;

    if (typeof sender === 'string') {
      return sender;
    }

    if (typeof sender === 'object' && sender._id && typeof sender._id === 'string') {
      return sender._id;
    }

    const maybeId = String(sender);
    return maybeId === '[object Object]' ? null : maybeId;
  };

  const syncLatestMessagePreview = useCallback((chatId: string, nextMessages: Message[]) => {
    const latest = [...nextMessages].reverse().find((message) => getMessageChatId(message) === chatId);

    setChats((prev) => {
      const chatIndex = prev.findIndex((chat) => chat._id === chatId);
      if (chatIndex === -1) return prev;

      const updatedChat = {
        ...prev[chatIndex],
        latestMessage: latest
          ? {
              _id: latest._id,
              content: getMessagePreview(latest),
              mediaType: latest.mediaType,
              mediaUrl: latest.mediaUrl,
              createdAt: latest.createdAt,
              sender: latest.sender,
              status: latest.status,
            }
          : undefined,
      };

      return [updatedChat, ...prev.filter((chat) => chat._id !== chatId)];
    });
  }, []);

  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const response = await api.get<Chat[]>('/chats');
      const formattedChats = response.data.map((chat) => ({
        ...chat,
        name: !chat.isGroupChat
          ? (chat.users?.find((u) => u._id !== user?._id)?.name || 'Chat')
          : (chat.chatName || 'Group Chat'),
      }));
      setChats(formattedChats);
      if (formattedChats.length > 0 && !selectedChatId) {
        setSelectedChatId(formattedChats[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setMessageError('Failed to load chats');
    } finally {
      setLoadingChats(false);
    }
  }, [selectedChatId, user?._id]);

  const fetchMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const response = await api.get<Message[]>(`/messages/${chatId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessageError('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const markChatAsSeen = useCallback(async (chatId: string) => {
    try {
      await api.patch('/messages/seen', { chatId });
    } catch (error) {
      // Seen receipts are best-effort and should not interrupt chat usage.
      console.error('Failed to mark messages as seen:', error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    void Promise.resolve().then(() => {
      void fetchChats();
    });
    
    const socket = getSocket();

    socket?.on('online users', (users: string[]) => {
      setOnlineUsers(users);
    });

    socket?.on('typing', ({ userId }: { userId: string }) => {
      if (userId !== user._id) {
        setIsTyping(true);
      }
    });

    socket?.on('stop typing', ({ userId }: { userId: string }) => {
      if (userId !== user._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket?.off('online users');
      socket?.off('typing');
      socket?.off('stop typing');
    };
  }, [user, navigate, fetchChats]);

  useEffect(() => {
    if (selectedChatId) {
      void Promise.resolve().then(() => {
        void fetchMessages(selectedChatId);
      });
      const socket = getSocket();
      socket?.emit('join chat', selectedChatId);

      socket?.on('message received', (message: Message) => {
        const messageChatId = getMessageChatId(message);

        setChats((prev) => {
          const chatIndex = prev.findIndex((chat) => chat._id === messageChatId);
          if (chatIndex === -1) return prev;

          const updatedChat = {
            ...prev[chatIndex],
            latestMessage: {
              _id: message._id,
              content: getMessagePreview(message),
              mediaType: message.mediaType,
              mediaUrl: message.mediaUrl,
              createdAt: message.createdAt,
              sender: message.sender,
              status: message.status,
            },
          };

          return [updatedChat, ...prev.filter((chat) => chat._id !== messageChatId)];
        });

        if (messageChatId !== selectedChatId) {
          return;
        }

        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        setMessageError('');

        if (message.sender._id !== user?._id) {
          void markChatAsSeen(selectedChatId);
        }
      });

      socket?.on('messages seen', ({ chatId, messageIds, seenBy }: { chatId: string; messageIds: string[]; seenBy?: string }) => {
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
          return;
        }

        if (seenBy === user?._id) {
          setChats((prev) =>
            prev.map((chat) => {
              if (chat._id !== chatId || !chat.latestMessage) {
                return chat;
              }

              const latestSenderId = getLatestMessageSenderId(chat);
              if (!latestSenderId || latestSenderId === user?._id) {
                return chat;
              }

              return {
                ...chat,
                latestMessage: {
                  ...chat.latestMessage,
                  status: 'seen',
                },
              };
            })
          );
        }

        if (chatId !== selectedChatId) {
          return;
        }

        const seenIds = new Set(messageIds);

        setMessages((prev) =>
          prev.map((message) =>
            seenIds.has(message._id) ? { ...message, status: 'seen' } : message
          )
        );
      });

      socket?.on('message updated', (updatedMessage: Message) => {
        const messageChatId = getMessageChatId(updatedMessage);

        setMessages((prev) => {
          const nextMessages = prev.map((message) =>
            message._id === updatedMessage._id ? { ...message, ...updatedMessage } : message
          );

          if (messageChatId) {
            syncLatestMessagePreview(messageChatId, nextMessages);
          }

          return nextMessages;
        });
      });

      socket?.on('message deleted', ({ chatId, message }: { chatId: string; message: Message }) => {
        setMessages((prev) => {
          const nextMessages = prev.map((existing) =>
            existing._id === message._id ? { ...existing, ...message } : existing
          );
          syncLatestMessagePreview(chatId, nextMessages);
          return nextMessages;
        });
      });

      void markChatAsSeen(selectedChatId);

      return () => {
        socket?.off('message received');
        socket?.off('messages seen');
        socket?.off('message updated');
        socket?.off('message deleted');
      };
    }
  }, [selectedChatId, user?._id, fetchMessages, markChatAsSeen, syncLatestMessagePreview]);

  const handleSendMessage = async (payload: OutgoingMessagePayload) => {
    setMessageError('');
    try {
      const response = await api.post('/messages', {
        content: payload.content,
        mediaUrl: payload.mediaUrl,
        mediaType: payload.mediaType,
        chatId: selectedChatId,
      });
      setMessages((prev) => {
        if (prev.some((m) => m._id === response.data._id)) return prev;
        return [...prev, response.data];
      });

      setChats((prev) => {
        const chatIndex = prev.findIndex((chat) => chat._id === selectedChatId);
        if (chatIndex === -1) return prev;

        const sentMessage = response.data as Message;
        const updatedChat = {
          ...prev[chatIndex],
          latestMessage: {
            _id: sentMessage._id,
            content: getMessagePreview(sentMessage),
            mediaType: sentMessage.mediaType,
            mediaUrl: sentMessage.mediaUrl,
            createdAt: sentMessage.createdAt,
            sender: sentMessage.sender,
            status: sentMessage.status,
          },
        };

        return [updatedChat, ...prev.filter((chat) => chat._id !== selectedChatId)];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageError('Failed to send message. Please try again.');
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      const response = await api.patch(`/messages/${messageId}`, { content });
      const updatedMessage = response.data as Message;
      const messageChatId = getMessageChatId(updatedMessage) || selectedChatId;

      setMessages((prev) => {
        const nextMessages = prev.map((message) =>
          message._id === updatedMessage._id ? { ...message, ...updatedMessage } : message
        );

        if (messageChatId) {
          syncLatestMessagePreview(messageChatId, nextMessages);
        }

        return nextMessages;
      });
    } catch (error) {
      console.error('Failed to edit message:', error);
      setMessageError('Failed to edit message. Please try again.');
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      const deletedMessage = response.data as Message;

      setMessages((prev) => {
        const nextMessages = prev.map((message) =>
          message._id === messageId ? { ...message, ...deletedMessage } : message
        );
        syncLatestMessagePreview(selectedChatId, nextMessages);
        return nextMessages;
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
      setMessageError('Failed to delete message. Please try again.');
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getChatDisplayName = (chat: Chat) => {
    if (!chat.isGroupChat && chat.users && chat.users.length > 0) {
      return chat.users.find((u) => u._id !== user?._id)?.name || 'Chat';
    }
    if (chat.chatName && chat.chatName !== 'sender') return chat.chatName;
    if (chat.name && chat.name !== 'sender') return chat.name;
    return 'Chat';
  };

  const getOtherUser = (chat: Chat) => {
    if (chat.users && chat.users.length > 0) {
      return chat.users.find((u) => u._id !== user?._id);
    }
    return null;
  };

  const isOtherUserOnline = (chat: Chat) => {
    const otherUser = getOtherUser(chat);
    return otherUser ? onlineUsers.includes(otherUser._id) : false;
  };

  const selectedChat = chats.find((c) => c._id === selectedChatId);
  const selectedChatName = selectedChat ? getChatDisplayName(selectedChat) : '';

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setShowSidebar(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await api.delete(`/chats/${chatId}`);
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId('');
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      setMessageError('Failed to delete chat. Please try again.');
    }
  };

  const handleChatCreated = (chat: Chat) => {
    setChats(prev => {
      // Map to ensure chat has a name field just like fetchChats does
      const formattedChat = {
        ...chat,
        name: !chat.isGroupChat
          ? (chat.users?.find((u) => u._id !== user?._id)?.name || 'Chat')
          : (chat.chatName || 'Group Chat'),
      };
      if (prev.some(c => c._id === formattedChat._id)) return prev;
      return [formattedChat, ...prev];
    });
  };

  return (
    <div className="flex h-screen py-4 px-4 sm:py-8 sm:px-8 relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[-5%] w-72 h-72 rounded-full bg-blue-600/10 blur-3xl animate-float"></div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] gap-6">
        <div className={`${showSidebar ? 'flex' : 'hidden'} w-full lg:flex lg:w-[320px] xl:w-[380px] shrink-0 animate-rise-in`}>
          <Sidebar
            chats={chats}
            onSelectChat={handleSelectChat}
            onChatCreated={handleChatCreated}
            onDeleteChat={handleDeleteChat}
            selectedChatId={selectedChatId}
            onlineUsers={onlineUsers}
            currentUserId={user?._id || ''}
          />
        </div>

        <div className={`${showSidebar ? 'hidden lg:flex' : 'flex'} min-w-0 flex-1 flex-col glass-panel rounded-2xl overflow-hidden animate-rise-in`} style={{ animationDelay: '100ms' }}>
          <header className="flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 sm:px-6">
            {selectedChat ? (
              <div className="flex min-w-0 items-center gap-4">
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-300 hover:bg-white/10 lg:hidden transition"
                  onClick={() => setShowSidebar(true)}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <UserAvatar name={selectedChatName} isOnline={isOtherUserOnline(selectedChat)} size="md" />

                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-white sm:text-[17px]">{selectedChatName}</h2>
                  <p className="text-xs text-indigo-300 font-medium tracking-wide">
                    {isOtherUserOnline(selectedChat) ? 'Online now' : 'Last active earlier'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-400 hover:bg-white/10 lg:hidden transition"
                  onClick={() => setShowSidebar(true)}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <p className="text-sm font-medium text-slate-400">{loadingChats ? 'Loading...' : 'Select conversation'}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button type="button" className="rounded-full p-2.5 text-slate-400 hover:bg-white/10 hover:text-white transition" title="Search">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              <div className="hidden rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-200 sm:block shadow-inner">
                {user?.name}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/30 ml-2"
              >
                Logout
              </button>
            </div>
          </header>

          {selectedChat ? (
            <div className="flex-1 flex flex-col min-h-0 bg-transparent">
              <ChatWindow
                messages={messages}
                isTyping={isTyping}
                currentUserId={user?._id || ''}
                isLoading={loadingMessages}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
              />

              {messageError && (
                <div className="mx-4 my-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 shadow-lg backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>{messageError}</span>
                    </div>
                    <button onClick={() => setMessageError('')} className="font-bold text-red-400 hover:text-red-300">
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 bg-transparent border-t border-white/5 mt-auto">
                <MessageInput chatId={selectedChatId} onSendMessage={handleSendMessage} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center bg-black/20">
              <div className="animate-float">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{loadingChats ? 'Loading chats...' : 'Welcome to Stunning Chat'}</h3>
                <p className="text-sm text-slate-400 max-w-[250px] mx-auto">{loadingChats ? 'Preparing your inbox' : 'Select an existing conversation or start a new one to begin.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
