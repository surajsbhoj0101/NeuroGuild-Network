import { useAccount, useChainId, useSignMessage } from "wagmi";
import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Logout() {
  const { address, isConnected } = useAccount();

  const logoutHelper = async() =>{
    try {
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
