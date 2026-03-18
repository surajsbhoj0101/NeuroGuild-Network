import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import socket from "../sockets/socketHandler";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthentication, role, userId, isPending } = useAuth();
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [connectionError, setConnectionError] = useState(null);

  // Handle connection events
  useEffect(() => {
    const onConnect = () => {
      setIsSocketConnected(true);
      setConnectionError(null);
      console.log("Socket connected");
    };

    const onDisconnect = () => {
      setIsSocketConnected(false);
      console.log("Socket disconnected");
    };

    const onError = (error) => {
      setConnectionError(error?.message || "Connection error");
      console.error("Socket error:", error);
    };

    const onConnectError = (error) => {
      setConnectionError(error?.message || "Failed to connect");
      console.error("Socket connection error:", error);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onError);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onError);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  // Manage socket connection based on auth state
  useEffect(() => {
    if (!isAuthentication) {
      // Disconnect pending users from messaging features
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    // Only fully registered users can use real-time features
    if (isPending) {
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    // Fully authenticated user - connect socket
    socket.auth = {
      userId,
      role,
    };

    if (!socket.connected) {
      socket.connect();
    }
  }, [isAuthentication, isPending, role, userId]);

  const value = useMemo(
    () => ({
      socket,
      isSocketConnected,
      connectionError,
    }),
    [isSocketConnected, connectionError]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }
  return context;
}
