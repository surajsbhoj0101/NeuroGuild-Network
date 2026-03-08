import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAccount } from "wagmi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { isConnected } = useAccount();
  const [isAuthentication, setIsAuthentication] = useState(false);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);

  const setAuthState = ({ role: nextRole, userId: nextUserId }) => {
    setIsAuthentication(true);
    setRole(nextRole || null);
    setUserId(nextUserId || null);
  };

  const clearAuthState = () => {
    setIsAuthentication(false);
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
        const res = await axios.get("http://localhost:5000/api/auth/check-jwt", {
          withCredentials: true,
        });

        if (!active) return;

        if (res.data?.isFound && res.data?.role && res.data?.userId) {
          setAuthState({ role: res.data.role, userId: res.data.userId });
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
      role,
      userId,
      setAuthState,
      clearAuthState,
    }),
    [isAuthentication, role, userId]
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
