import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Send, Search, MoreVertical, Phone, Video, Plus, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import api from "../utils/api";
import NoticeToast from "../components/NoticeToast";

/**
 * Messages page responsibilities:
 * 1) Load all conversations for the signed-in user.
 * 2) Resolve selected chat from route (/messages/:recipientId).
 * 3) Fetch message history for selected conversation.
 * 4) Listen for socket events and keep UI in sync in real time.
 * 5) Send messages through socket with optimistic input clear.
 */

// Format a message timestamp for chat bubbles.
const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format a conversation timestamp for the sidebar list.
const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days`;

  return date.toLocaleDateString();
};

// Compact wallet view for UI labels.
const shortWallet = (wallet = "") =>
  wallet.length > 12
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : wallet || "Unknown user";

// Fallback avatar text when profile image is missing.
const getInitial = (value = "") => {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toUpperCase() : "?";
};

function Messages() {
  const navigate = useNavigate();
  const { recipientId } = useParams();
  const { socket, isSocketConnected } = useSocket();
  const { userId } = useAuth();
  const { markConversationRead, setActiveConversationId } = useNotifications();

  
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);

  // Keep timeout id for cleanup when redirect timer is set.
  const timeoutRef = useRef();

  // Active chat card from selected conversation id.
  const selectedChat = useMemo(
    () =>
      conversations.find((conversation) => conversation._id === selectedConversationId) ||
      null,
    [conversations, selectedConversationId],
  );

  // Resolve conversation id from route participant id (/messages/:recipientId).
  const recipientConversationId = useMemo(
    () =>
      conversations.find((conversation) => conversation.participant?._id === recipientId)?._id ||
      null,
    [conversations, recipientId],
  );

  // Normalize API conversation to UI shape.
  const hydrateConversation = useCallback((conversation) => {
    const participant = conversation?.participant || {};
    const wallet = participant.wallets || "";

    return {
      ...conversation,
      name: participant.displayName || shortWallet(wallet),
      walletLabel: shortWallet(wallet),
      avatar: participant.profileUrl || "",
      timestamp: formatRelativeTime(conversation.lastMessageTimestamp),
      isOnline: false,
      unread: conversation.unread || 0,
    };
  }, []);

  // Fetch the conversation list and keep newest first.
  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const res = await api.get("/api/conversations/get-conversations");
      const list = (res.data?.conversations || [])
        .map(hydrateConversation)
        .sort(
          (a, b) =>
            new Date(b.lastMessageTimestamp || 0).getTime() -
            new Date(a.lastMessageTimestamp || 0).getTime(),
        );
      // Use backend unread values as source of truth.
      setConversations(list);
    } catch (error) {
      setRedNotice(true);
      setNotice(error.response?.data?.message || "Failed to load conversations");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [hydrateConversation]);

  // Fetch message history for the selected conversation.
  const fetchChat = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setIsLoadingMessages(true);
    try {
      const res = await api.get(`/api/conversations/${conversationId}/messages`);
      const mappedMessages = (res.data?.messages || []).map((msg) => ({
        ...msg,
        id: msg._id,
        // Mark messages from the authenticated user for right-aligned bubble styling.
        isOwn: msg.sender === userId,
      }));
      setMessages(mappedMessages);

      // Reset unread once the user opens this conversation.
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === conversationId
            ? { ...conversation, unread: 0 }
            : conversation,
        ),
      );
      markConversationRead(conversationId);
    } catch (error) {
      setRedNotice(true);
      setNotice(error.response?.data?.message || "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [markConversationRead, userId]);

  // Create a conversation when route has user id but no conversation exists yet.
  const createConversationIfNeeded = useCallback(async (targetUserId) => {
    if (!targetUserId) return null;

    const existing = conversations.find(
      (conversation) => conversation.participant?._id === targetUserId,
    );
    if (existing) return existing._id;

    try {
      const res = await api.post("/api/conversations/create", {
        participantId: targetUserId,
      });

      const createdConversation = hydrateConversation(res.data?.conversation);
      setConversations((prev) => {
        // Avoid duplicate insertion when effect reruns quickly.
        const isExists = prev.some(
          (conversation) => conversation._id === createdConversation._id,
        );
        if (isExists) return prev;
        return [createdConversation, ...prev];
      });

      return createdConversation._id;
    } catch (error) {
      setRedNotice(true);
      setNotice(error.response?.data?.message || "Could not start conversation");
      return null;
    }
  }, [conversations, hydrateConversation]);

  // Initial socket guard and first sidebar load.
  useEffect(() => {
    // Messages depends on live socket. If unavailable, redirect to safe landing.
    if (!isSocketConnected) {
      setRedNotice(true);
      setNotice("Socket not connected - redirecting to home...");
      timeoutRef.current = setTimeout(() => navigate("/"), 1600);
      return () => clearTimeout(timeoutRef.current);
    }

    setNotice(null);
    fetchConversations();

    return () => clearTimeout(timeoutRef.current);
  }, [fetchConversations, isSocketConnected, navigate]);

  // If route is /messages (no participant id), keep right panel empty.
  useEffect(() => {
    if (recipientId) return;
    setSelectedConversationId(null);
    setMessages([]);
  }, [recipientId]);

  // If route is /messages/:id, select or create that conversation.
  useEffect(() => {
    let active = true;

    const bootstrapConversation = async () => {
      if (!recipientId) return;
      if (recipientConversationId) {
        // Existing chat found for this route participant.
        setSelectedConversationId(recipientConversationId);
        return;
      }

      // No chat yet with this user -> create one before opening.
      const conversationId = await createConversationIfNeeded(recipientId);
      if (!active || !conversationId) return;
      setSelectedConversationId(conversationId);
    };

    bootstrapConversation();

    return () => {
      active = false;
    };
  }, [createConversationIfNeeded, recipientConversationId, recipientId]);

  // Load messages whenever active conversation changes.
  useEffect(() => {
    if (!selectedConversationId) return;
    fetchChat(selectedConversationId);
  }, [fetchChat, selectedConversationId]);

  // Tell global chat context which thread is currently open.
  useEffect(() => {
    setActiveConversationId(selectedConversationId || null);
    return () => setActiveConversationId(null);
  }, [selectedConversationId, setActiveConversationId]);

  // Real-time message listener for sidebar + active chat updates.
  useEffect(() => {
    if (!socket) return;

    const onReceiveMessage = (incomingMessage) => {
      // Normalize socket payload to match existing message shape used in render.
      const normalized = {
        ...incomingMessage,
        id: incomingMessage._id,
        isOwn: incomingMessage.sender === userId,
      };

      let didFindConversation = false;
      let incomingSenderName = "New message";
      setConversations((prev) => {
        didFindConversation = prev.some(
          (conversation) => conversation._id === incomingMessage.conversationId,
        );

        // Update matched conversation preview, unread count, and recency ordering.
        return prev
          .map((conversation) => {
            if (conversation._id !== incomingMessage.conversationId) {
              return conversation;
            }

            incomingSenderName = conversation.name || incomingSenderName;

            const unread =
              selectedConversationId === incomingMessage.conversationId
                ? 0
                // Increment unread when incoming conversation is not currently open.
                : (conversation.unread || 0) + 1;

            return {
              ...conversation,
              lastMessage: incomingMessage.content,
              lastMessageTimestamp: incomingMessage.timestamp,
              timestamp: formatRelativeTime(incomingMessage.timestamp),
              unread,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.lastMessageTimestamp || 0).getTime() -
              new Date(a.lastMessageTimestamp || 0).getTime(),
          );
      });

      if (!didFindConversation) {
        // If socket event is for an unseen conversation, re-fetch full sidebar list.
        fetchConversations();
      }

      // Show toast notification for new incoming messages from other users.
      if (!normalized.isOwn) {
        setRedNotice(false);
        setNotice(`New message from ${incomingSenderName}`);
      }

      if (incomingMessage.conversationId === selectedConversationId) {
        // Append to open thread immediately for live conversation feel.
        setMessages((prev) => [...prev, normalized]);
      }
    };

    socket.on("receiveMessage", onReceiveMessage);

    return () => {
      socket.off("receiveMessage", onReceiveMessage);
    };
  }, [fetchConversations, socket, selectedConversationId, userId]);

  // Emit message through socket.
  const handleSendMessage = async () => {
    if (!messageInput.trim()) {
      return;
    }

    if (!socket?.connected) {
      setRedNotice(true);
      setNotice("Socket is disconnected. Reconnect and try again.");
      return;
    }

    if (!selectedChat?.participant?._id) {
      setRedNotice(true);
      setNotice("Select a valid conversation first.");
      return;
    }

    const trimmedMessage = messageInput.trim();
    // Clear input immediately to keep composer responsive.
    setMessageInput("");

    socket.emit(
      "sendMessage",
      {
        receiverId: selectedChat.participant._id,
        message: trimmedMessage,
      },
      (ack) => {
        // Backend can reject send operation (validation, permission, etc.).
        if (!ack?.ok) {
          setRedNotice(true);
          setNotice(ack?.message || "Failed to send message");
        }
      },
    );
  };

  // De-duplicate sidebar chats by participant so same person is shown once.
  const uniqueChats = useMemo(() => {
    const seen = new Set();
    return conversations.filter((chat) => {
      const key = chat.participant?._id || chat._id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [conversations]);

  // Search filter on de-duplicated chat list.
  const filteredChats = uniqueChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  // Header badge count across deduplicated conversations.
  const totalUnreadCount = useMemo(
    () => uniqueChats.reduce((acc, chat) => acc + (chat.unread || 0), 0),
    [uniqueChats],
  );

  // Select conversation and sync route with participant id.
  const handleSelectConversation = (chat) => {
    setSelectedConversationId(chat._id);
    if (chat.participant?._id) {
      navigate(`/messages/${chat.participant._id}`);
    }
  };

  const handleViewProfile = () => {
    if (!selectedChat?.participant?._id) {
      setRedNotice(true);
      setNotice("Profile is not available for this conversation.");
      return;
    }

    navigate(`/profile/${selectedChat.participant._id}`);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
    setMessages([]);
    navigate("/messages");
  };

  return (
    // Layout: sidebar + conversation panel.
    <div className="dark:bg-[#0f111d] bg-[#161c32] w-full h-screen flex overflow-hidden">
      {/* Top notification toast */}
      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

      {/* Left sidebar: conversation list */}
      <div
        className={`${selectedChat ? "hidden md:flex" : "flex"} top-0 md:sticky overflow-y-auto md:overflow-scroll w-full md:w-80 left-0 border-r border-[#14a19f]/20 bg-[#0d1224]/50 flex-col`}
      >
        {/* Sidebar header + search */}
        <div className="p-4 border-b border-[#14a19f]/20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            {totalUnreadCount > 0 && (
              <div className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#14a19f] text-white">
                {totalUnreadCount} new
              </div>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#161c32] border border-[#14a19f]/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#14a19f]/50 transition-colors"
            />
          </div>
        </div>

        {/* Sidebar conversation items */}
        <div className="relative left-0">
          <div className="flex-1 sticky">
            {isLoadingConversations ? (
              <div className="px-4 py-6 text-gray-400 text-sm">Loading conversations...</div>
            ) : filteredChats.length === 0 ? (
              <div className="px-4 py-6 text-gray-400 text-sm">No conversations found.</div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => handleSelectConversation(chat)}
                  className={`px-4 py-3 border-b border-[#14a19f]/10 cursor-pointer transition-all ${
                    selectedChat?._id === chat._id
                      ? "bg-[#14a19f]/20 border-l-2 border-l-[#14a19f]"
                      : "hover:bg-[#14a19f]/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {chat.avatar ? (
                        <img
                          src={chat.avatar}
                          alt={chat.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#14a19f]/20 text-[#14a19f] font-semibold flex items-center justify-center">
                          {getInitial(chat.name)}
                        </div>
                      )}
                      {chat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d1224]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {chat.name}
                        </h3>
                        <span className="text-xs text-gray-500 shrink-0">
                          {chat.timestamp}
                        </span>
                      </div>
                      {chat.unread > 0 ? (
                        <p className="text-xs text-[#14a19f] font-medium truncate">
                          New message received
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 truncate">{chat.lastMessage}</p>
                      )}
                      <p className="text-[11px] text-gray-500 truncate">{chat.walletLabel}</p>
                    </div>

                    {chat.unread > 0 && (
                      <div className="bg-[#14a19f] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right panel: selected conversation */}
      <div
        className={`${selectedChat ? "flex" : "hidden md:flex"} relative flex-1 flex-col bg-[#0d1224]/50`}
      >
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between gap-2 p-3 md:p-4 border-b border-[#14a19f]/20 bg-[#0d1224]/80 backdrop-blur-sm">
              <button
                type="button"
                onClick={handleBackToList}
                className="md:hidden inline-flex items-center rounded-lg border border-[#14a19f]/20 px-2 py-1 text-xs text-gray-300 hover:bg-[#14a19f]/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleViewProfile}
                className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1 text-left transition-colors hover:bg-[#14a19f]/10"
              >
                <div className="relative">
                  {selectedChat.avatar ? (
                    <img
                      src={selectedChat.avatar}
                      alt={selectedChat.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#14a19f]/20 text-[#14a19f] font-semibold flex items-center justify-center">
                      {getInitial(selectedChat.name)}
                    </div>
                  )}
                  {selectedChat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0d1224]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{selectedChat.name}</h3>
                  <p className="text-xs text-gray-400 truncate">
                    {selectedChat.participant?.role || "User"} • {selectedChat.walletLabel}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#14a19f]/20 px-2 md:px-3 py-2 text-xs md:text-sm text-gray-300 transition-colors hover:bg-[#14a19f]/20 hover:text-white"
                >
                  <UserRound className="h-4 w-4" />
                  <span className="hidden sm:inline">View Profile</span>
                </button>
                <button className="hidden md:inline-flex p-2 hover:bg-[#14a19f]/20 rounded-lg transition-colors text-gray-400 hover:text-[#14a19f]">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="hidden md:inline-flex p-2 hover:bg-[#14a19f]/20 rounded-lg transition-colors text-gray-400 hover:text-[#14a19f]">
                  <Video className="h-5 w-5" />
                </button>
                <button className="hidden md:inline-flex p-2 hover:bg-[#14a19f]/20 rounded-lg transition-colors text-gray-400 hover:text-[#14a19f]">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Message stream */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="text-gray-400 text-sm">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-400 text-sm">No messages yet. Start the conversation.</div>
              ) : (
                messages.map((msg, index) => {
                  // Show incoming avatar only at start of a sender group.
                  const previous = index > 0 ? messages[index - 1] : null;
                  const showIncomingAvatar =
                    !msg.isOwn &&
                    (!previous || previous.isOwn || previous.sender !== msg.sender);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.isOwn ? "justify-end" : "justify-start"}`}
                    >
                      {!msg.isOwn && showIncomingAvatar && (
                        selectedChat.avatar ? (
                          <img
                            src={selectedChat.avatar}
                            alt={selectedChat.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#14a19f]/20 text-[#14a19f] text-xs font-semibold flex items-center justify-center">
                            {getInitial(selectedChat.name)}
                          </div>
                        )
                      )}

                      <div
                        className={`flex flex-col gap-1 ${
                          msg.isOwn ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`px-3 md:px-4 py-2 rounded-lg max-w-[85vw] md:max-w-xs text-sm ${
                            msg.isOwn
                              ? "bg-[#14a19f] text-white"
                              : "bg-[#161c32] text-gray-100 border border-[#14a19f]/20"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message composer */}
            <div className="p-3 md:p-4 border-t border-[#14a19f]/20 bg-[#0d1224]/80 backdrop-blur-sm">
              <div className="flex gap-2 md:gap-3 items-end">
                <button className="p-2 hover:bg-[#14a19f]/20 rounded-lg transition-colors text-gray-400 hover:text-[#14a19f] shrink-0">
                  <Plus className="h-5 w-5" />
                </button>

                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter sends; Shift+Enter inserts newline for multi-line message.
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message... (Shift+Enter for new line)"
                  className="flex-1 px-3 md:px-4 py-2 bg-[#161c32] border border-[#14a19f]/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#14a19f]/50 transition-colors resize-none max-h-24"
                  rows="1"
                />

                <button
                  onClick={handleSendMessage}
                  className="p-2 hover:bg-[#14a19f] bg-[#14a19f]/80 rounded-lg transition-colors text-white shrink-0"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          // Empty state when no conversation is selected.
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">Select a conversation</div>
              <p className="text-gray-500 text-sm">
                Choose from your messages to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
