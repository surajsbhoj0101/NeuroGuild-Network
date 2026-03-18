import { useAccount } from "wagmi";
import { useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function Logout() {
  const { address, isConnected } = useAccount();
  const { clearAuthState } = useAuth();

  const logoutHelper = async() =>{
    try {
      clearAuthState();
      await axios.post(
        `${API_BASE_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      return;
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!isConnected) {
      logoutHelper()
      return
    }
  }, [address, isConnected]);
}

export default Logout;
