import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { useAppNotifications } from "./notification/useAppNotifications";
import { useMessageUnread } from "./notification/useMessageUnread";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthentication, userId } = useAuth();
  const { socket } = useSocket();

  const {
    unreadByConversation,
    totalUnreadCount,
    notificationItems,
    isLoadingUnread,
    refreshUnreadCounts,
    markConversationRead,
    activeConversationId,
    setActiveConversationId,
  } = useMessageUnread({ isAuthentication, userId, socket });

  const {
    unreadAppCount,
    appNotificationItems,
    isLoadingAppNotifications,
    fetchAppNotifications,
    addNotification,
    addJobNotification,
    addSystemNotification,
    markAppNotificationRead,
    markAllAppNotificationsRead,
  } = useAppNotifications({ isAuthentication, socket });

  const totalNotificationCount = totalUnreadCount + unreadAppCount;

  const refreshNotifications = useCallback(
    async () => Promise.all([refreshUnreadCounts(), fetchAppNotifications()]),
    [fetchAppNotifications, refreshUnreadCounts],
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
      refreshNotifications,
      markConversationRead,
      addNotification,
      addJobNotification,
      addSystemNotification,
      // Backward-compatible alias
      pushAppNotification: addNotification,
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
      refreshNotifications,
      markConversationRead,
      addNotification,
      addJobNotification,
      addSystemNotification,
      markAppNotificationRead,
      markAllAppNotificationsRead,
      activeConversationId,
      setActiveConversationId,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return context;
}

// Backward-compatible aliases
export const ChatProvider = NotificationProvider;
export const useChat = useNotifications;
