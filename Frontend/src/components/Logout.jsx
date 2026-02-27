import { useAccount } from "wagmi";
import { useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

function Logout() {
  const { address, isConnected } = useAccount();
  const { clearAuthState } = useAuth();

  const logoutHelper = async() =>{
    try {
      clearAuthState();
      await axios.post(
        "http://localhost:5000/api/auth/logout",
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
