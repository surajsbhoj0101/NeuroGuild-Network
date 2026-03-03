import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../utils/api";

export function useAppNotifications({ isAuthentication, socket }) {
  const [appNotifications, setAppNotifications] = useState([]);
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

  const addNotification = useCallback(async (payload) => {
    if (!isAuthentication) return null;
    try {
      const res = await api.post("/api/notifications", {
        type: payload?.type || "platform",
        title: payload?.title || "Notification",
        description: payload?.description || "",
        link: payload?.link || "",
        onlyFreelancer: Boolean(payload?.onlyFreelancer),
        metadata:
          payload?.metadata && typeof payload.metadata === "object"
            ? payload.metadata
            : {},
      });

      const created = res.data?.notification || null;
      const createdMany = Array.isArray(res.data?.notifications)
        ? res.data.notifications
        : [];

      if (created?._id) {
        setAppNotifications((prev) => {
          if (prev.some((item) => item._id === created._id)) return prev;
          return [created, ...prev];
        });
      } else if (createdMany.length > 0) {
        setAppNotifications((prev) => {
          const existing = new Set(prev.map((item) => item._id));
          const mine = createdMany.filter((item) => item?._id && !existing.has(item._id));
          return mine.length ? [...mine, ...prev] : prev;
        });
      }

      return created || createdMany[0] || null;
    } catch (error) {
      console.error("Failed to create app notification:", error);
      return null;
    }
  }, [isAuthentication]);

  const addJobNotification = useCallback(
    async ({
      title,
      description = "",
      link = "/client/manage-jobs",
      metadata = {},
      onlyFreelancer = false,
    }) =>
      addNotification({
        type: "job",
        title: title || "Job update",
        description,
        link,
        metadata,
        onlyFreelancer,
      }),
    [addNotification],
  );

  const addSystemNotification = useCallback(
    async ({ title, description = "", link = "", metadata = {} }) =>
      addNotification({
        type: "system",
        title: title || "System update",
        description,
        link,
        metadata,
      }),
    [addNotification],
  );

  const markAppNotificationRead = useCallback((id) => {
    if (!id) return;
    setAppNotifications((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item,
      ),
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

  useEffect(() => {
    if (!isAuthentication) {
      setAppNotifications([]);
      return;
    }
    fetchAppNotifications();
  }, [fetchAppNotifications, isAuthentication]);

  useEffect(() => {
    if (!socket) return;

    const onNotificationCreated = (incomingNotification) => {
      if (!incomingNotification?._id) return;
      setAppNotifications((prev) => {
        if (prev.some((item) => item._id === incomingNotification._id)) return prev;
        return [incomingNotification, ...prev];
      });
    };

    socket.on("notificationCreated", onNotificationCreated);
    return () => socket.off("notificationCreated", onNotificationCreated);
  }, [socket]);

  const unreadAppCount = useMemo(
    () => appNotifications.reduce((sum, item) => sum + (item.isRead ? 0 : 1), 0),
    [appNotifications],
  );

  const appNotificationItems = useMemo(
    () =>
      [...appNotifications].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      ),
    [appNotifications],
  );

  return {
    appNotifications,
    unreadAppCount,
    appNotificationItems,
    isLoadingAppNotifications,
    fetchAppNotifications,
    addNotification,
    addJobNotification,
    addSystemNotification,
    markAppNotificationRead,
    markAllAppNotificationsRead,
  };
}
