import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import api from "../utils/api";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { isAuthentication, userId } = useAuth();
  const { socket } = useSocket();

  const [unreadByConversation, setUnreadByConversation] = useState({});
  const [conversationMeta, setConversationMeta] = useState({});
  const [appNotifications, setAppNotifications] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isLoadingUnread, setIsLoadingUnread] = useState(false);
  const [isLoadingAppNotifications, setIsLoadingAppNotifications] = useState(false);

  const fetchAppNotifications = useCallback(async () => {
    if (!isAuthentication) {
      setAppNotifications([]);
      return;
    }

    setIsLoadingAppNotifications(true);
    try {
      const res = await api.get("/api/notifications?limit=50");
      setAppNotifications(res.data?.notifications || []);
    } catch (error) {
      console.error("Failed to fetch app notifications:", error);
    } finally {
      setIsLoadingAppNotifications(false);
    }
  }, [isAuthentication]);

  const pushAppNotification = useCallback(async (payload) => {
    if (!isAuthentication) return null;
    try {
      const res = await api.post("/api/notifications", {
        type: payload?.type || "platform",
        title: payload?.title || "Notification",
        description: payload?.description || "",
        link: payload?.link || "",
        metadata:
          payload?.metadata && typeof payload.metadata === "object"
            ? payload.metadata
            : {},
      });

      const created = res.data?.notification;
      if (created?._id) {
        setAppNotifications((prev) => [created, ...prev.filter((item) => item._id !== created._id)]);
      }
      return created || null;
    } catch (error) {
      console.error("Failed to create app notification:", error);
      return null;
    }
  }, [isAuthentication]);

  const markAppNotificationRead = useCallback((id) => {
    if (!id) return;
    setAppNotifications((prev) =>
      prev.map((item) => (item._id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item)),
    );
    api
      .patch(`/api/notifications/${id}/read`)
      .catch((error) => console.error("Failed to mark app notification read:", error));
  }, []);

  const markAllAppNotificationsRead = useCallback(() => {
    setAppNotifications((prev) =>
      prev.map((item) =>
        item.isRead ? item : { ...item, isRead: true, readAt: new Date().toISOString() },
      ),
    );
    api
      .patch("/api/notifications/mark-all-read")
      .catch((error) => console.error("Failed to mark all app notifications read:", error));
  }, []);

  const refreshUnreadCounts = useCallback(async () => {
    if (!isAuthentication) {
      setUnreadByConversation({});
      return;
    }

    setIsLoadingUnread(true);
    try {
      const res = await api.get("/api/conversations/get-conversations");
      const nextUnread = {};
      const nextMeta = {};

      (res.data?.conversations || []).forEach((conversation) => {
        if (!conversation?._id) return;
        nextUnread[conversation._id] = conversation.unread || 0;
        nextMeta[conversation._id] = {
          _id: conversation._id,
          unread: conversation.unread || 0,
          name: conversation.participant?.displayName || conversation.name || "Unknown user",
          avatar: conversation.participant?.profileUrl || "",
          participantId: conversation.participant?._id || null,
          lastMessage: conversation.lastMessage || "",
          lastMessageTimestamp: conversation.lastMessageTimestamp || conversation.updatedAt,
        };
      });

      setUnreadByConversation(nextUnread);
      setConversationMeta(nextMeta);
    } catch (error) {
      console.error("Failed to refresh unread counts:", error);
    } finally {
      setIsLoadingUnread(false);
    }
  }, [isAuthentication]);

  const markConversationRead = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setUnreadByConversation((prev) => {
      if (!prev[conversationId]) return prev;
      return { ...prev, [conversationId]: 0 };
    });
    setConversationMeta((prev) => {
      if (!prev[conversationId]) return prev;
      return {
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          unread: 0,
        },
      };
    });

    if (!isAuthentication) return;
    try {
      await api.patch(`/api/conversations/${conversationId}/seen`);
    } catch (error) {
      console.error("Failed to mark conversation read in DB:", error);
    }
  }, [isAuthentication]);

  useEffect(() => {
    if (!isAuthentication) {
      setUnreadByConversation({});
      setConversationMeta({});
      setAppNotifications([]);
      setActiveConversationId(null);
      return;
    }
    refreshUnreadCounts();
    fetchAppNotifications();
  }, [fetchAppNotifications, isAuthentication, refreshUnreadCounts]);

  useEffect(() => {
    if (!socket) return;

    const onReceiveMessage = (incomingMessage) => {
      if (!incomingMessage?.conversationId) return;
      if (incomingMessage.sender === userId) return;
      let shouldRefresh = false;

      setUnreadByConversation((prev) => {
        const current = prev[incomingMessage.conversationId] || 0;
        const isActive = incomingMessage.conversationId === activeConversationId;
        if (!Object.prototype.hasOwnProperty.call(prev, incomingMessage.conversationId)) {
          shouldRefresh = true;
        }

        const next = {
          ...prev,
          [incomingMessage.conversationId]: isActive ? 0 : current + 1,
        };
        if (isActive) {
          // Keep DB unread state in sync when message arrives in currently opened chat.
          api
            .patch(`/api/conversations/${incomingMessage.conversationId}/seen`)
            .catch((error) => console.error("Failed to sync seen state:", error));
        }
        return next;
      });

      setConversationMeta((prev) => {
        const existing = prev[incomingMessage.conversationId];
        if (!existing) return prev;

        const isActive = incomingMessage.conversationId === activeConversationId;
        return {
          ...prev,
          [incomingMessage.conversationId]: {
            ...existing,
            unread: isActive ? 0 : (existing.unread || 0) + 1,
            lastMessage: incomingMessage.content || existing.lastMessage || "",
            lastMessageTimestamp:
              incomingMessage.timestamp || existing.lastMessageTimestamp || new Date().toISOString(),
          },
        };
      });

      if (shouldRefresh) {
        refreshUnreadCounts();
      }
    };

    socket.on("receiveMessage", onReceiveMessage);

    return () => {
      socket.off("receiveMessage", onReceiveMessage);
    };
  }, [activeConversationId, refreshUnreadCounts, socket, userId]);

  const totalUnreadCount = useMemo(
    () => Object.values(unreadByConversation).reduce((sum, count) => sum + (count || 0), 0),
    [unreadByConversation]
  );
  const unreadAppCount = useMemo(
    () => appNotifications.reduce((sum, item) => sum + (item.isRead ? 0 : 1), 0),
    [appNotifications]
  );
  const totalNotificationCount = totalUnreadCount + unreadAppCount;
  const notificationItems = useMemo(
    () =>
      Object.values(conversationMeta)
        .filter((item) => (item.unread || 0) > 0)
        .sort(
          (a, b) =>
            new Date(b.lastMessageTimestamp || 0).getTime() -
            new Date(a.lastMessageTimestamp || 0).getTime(),
        ),
    [conversationMeta]
  );
  const appNotificationItems = useMemo(
    () =>
      [...appNotifications].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      ),
    [appNotifications]
  );

  const value = useMemo(
    () => ({
      unreadByConversation,
      totalUnreadCount,
      unreadAppCount,
      totalNotificationCount,
      notificationItems,
      appNotificationItems,
      isLoadingUnread,
      isLoadingAppNotifications,
      refreshUnreadCounts,
      fetchAppNotifications,
      markConversationRead,
      pushAppNotification,
      markAppNotificationRead,
      markAllAppNotificationsRead,
      activeConversationId,
      setActiveConversationId,
    }),
    [
      unreadByConversation,
      totalUnreadCount,
      unreadAppCount,
      totalNotificationCount,
      notificationItems,
      appNotificationItems,
      isLoadingUnread,
      isLoadingAppNotifications,
      refreshUnreadCounts,
      fetchAppNotifications,
      markConversationRead,
      pushAppNotification,
      markAppNotificationRead,
      markAllAppNotificationsRead,
      activeConversationId,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return context;
}
