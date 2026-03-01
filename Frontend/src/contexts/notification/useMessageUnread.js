import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../utils/api";

export function useMessageUnread({ isAuthentication, userId, socket }) {
  const [unreadByConversation, setUnreadByConversation] = useState({});
  const [conversationMeta, setConversationMeta] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isLoadingUnread, setIsLoadingUnread] = useState(false);

  const refreshUnreadCounts = useCallback(async () => {
    if (!isAuthentication) {
      setUnreadByConversation({});
      setConversationMeta({});
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
      setActiveConversationId(null);
      return;
    }
    refreshUnreadCounts();
  }, [isAuthentication, refreshUnreadCounts]);

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

      if (shouldRefresh) refreshUnreadCounts();
    };

    socket.on("receiveMessage", onReceiveMessage);
    return () => socket.off("receiveMessage", onReceiveMessage);
  }, [activeConversationId, refreshUnreadCounts, socket, userId]);

  const totalUnreadCount = useMemo(
    () => Object.values(unreadByConversation).reduce((sum, count) => sum + (count || 0), 0),
    [unreadByConversation],
  );

  const notificationItems = useMemo(
    () =>
      Object.values(conversationMeta)
        .filter((item) => (item.unread || 0) > 0)
        .sort(
          (a, b) =>
            new Date(b.lastMessageTimestamp || 0).getTime() -
            new Date(a.lastMessageTimestamp || 0).getTime(),
        ),
    [conversationMeta],
  );

  return {
    unreadByConversation,
    totalUnreadCount,
    notificationItems,
    isLoadingUnread,
    refreshUnreadCounts,
    markConversationRead,
    activeConversationId,
    setActiveConversationId,
  };
}

