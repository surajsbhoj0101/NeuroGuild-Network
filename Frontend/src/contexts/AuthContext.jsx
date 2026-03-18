import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAccount } from "wagmi";

const AuthContext = createContext(null);
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function AuthProvider({ children }) {
  const { isConnected } = useAccount();
  const [isAuthentication, setIsAuthentication] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);

  const setAuthState = ({ role: nextRole, userId: nextUserId, isPending: nextIsPending }) => {
    setIsAuthentication(!!nextUserId);
    setIsPending(nextIsPending ?? false);
    setRole(nextRole || null);
    setUserId(nextUserId || null);
  };

  const clearAuthState = () => {
    setIsAuthentication(false);
    setIsPending(false);
    setRole(null);
    setUserId(null);
  };

  useEffect(() => {
    let active = true;

    const syncAuth = async () => {
      if (!isConnected) {
        clearAuthState();
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/check-jwt`, {
          withCredentials: true,
        });

        if (!active) return;

        if (res.data?.isFound) {
          if (res.data?.isPending) {
            // User has selected role but not completed registration
            setAuthState({
              role: res.data.role,
              userId: null,
              isPending: true,
            });
          } else if (res.data?.role && res.data?.userId) {
            // User is fully registered
            setAuthState({
              role: res.data.role,
              userId: res.data.userId,
              isPending: false,
            });
          } else {
            clearAuthState();
          }
        } else {
          clearAuthState();
        }
      } catch {
        if (active) clearAuthState();
      }
    };

    syncAuth();
    return () => {
      active = false;
    };
  }, [isConnected]);

  /**
   * If isAuthentication changes from false to true:

      useMemo notices the change in the dependency array.
      It runs the function inside it again.
      It creates a brand new object (Object B) with the updated values.
      React now tells every component: "Hey, the Auth object is now Object B. Please update."
   */

  const value = useMemo(
    () => ({
      isAuthentication,
      isPending,
      role,
      userId,
      setAuthState,
      clearAuthState,
    }),
    [isAuthentication, isPending, role, userId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
