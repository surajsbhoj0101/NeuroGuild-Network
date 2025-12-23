import { useAccount, useChainId, useSignMessage, useWalletClient } from "wagmi";
import { SiweMessage } from "siwe";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { createUserOnchain } from "../utils/create_user";
import { BrowserProvider } from "ethers";

export default function Login({ setLoadingUser, setNotice, setRedNotice }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { signMessageAsync } = useSignMessage();
  const navigate = useNavigate();

  const [isSelectingRole, setIsSelectingRole] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) return;
    authenticate();
  }, [address, isConnected]);

  async function getSigner(params) {
    let signer;
    if (walletClient) {
      const provider = new BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    }
    return signer;
  }

  const authenticate = async () => {
    try {
      setLoadingUser(true);

      const jwtRes = await axios.get(
        "http://localhost:5000/api/auth/check-jwt",
        { withCredentials: true }
      );

      if (!jwtRes.data?.isFound) {
        await handleSiwe();
        return;
      }

      if (!jwtRes.data.role) {
        setIsSelectingRole(true);
        return;
      }

      redirectByRole(jwtRes.data.role);
    } catch (err) {
      await handleSiwe();
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSiwe = async () => {
    try {
      const nonceRes = await axios.get(
        "http://localhost:5000/api/auth/get-nonce",
        { withCredentials: true }
      );

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: nonceRes.data.nonce,
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      await axios.post(
        "http://localhost:5000/api/auth/verify-siwe",
        { message, signature },
        { withCredentials: true }
      );

      authenticate();
    } catch (error) {
      setRedNotice(true);
      setNotice("Wallet signature failed");
    }
  };

  const selectRole = async (role) => {
    const signer = await getSigner();
    if (!signer) {
      setRedNotice(true);
      setNotice("Please connect your wallet first.");
      return;
    }
    try {
      setLoadingUser(true);
      const RoleEnum = {
        client: 0,
        freelancer: 1,
      };
      const resCreateUser = await createUserOnchain(signer, RoleEnum[role]);
      
      const user = await axios.post('http://localhost:5000/api/auth/create-user',
        {role},
        {withCredentials: true}
      )

      setIsSelectingRole(false);
      authenticate()
    } catch (error) {
      setRedNotice(true);
      setNotice("Role selection failed");
    } finally {
      setLoadingUser(false);
    }
  };

  const redirectByRole = (role) => {
    if (role === "freelancer") {
      navigate("/freelancer/my-profile");
    } else {
      navigate("/client/my-profile");
    }
  };

  if (!isSelectingRole) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f121e] border border-[#162036] rounded-xl p-8 w-full max-w-md space-y-6">
        <h2 className="text-xl font-bold text-white text-center">
          Choose your role
        </h2>

        <button
          onClick={() => selectRole("freelancer")}
          className="w-full py-3 rounded-lg bg-[#14a19f] hover:bg-cyan-700 transition text-white"
        >
          Continue as Freelancer
        </button>

        <button
          onClick={() => selectRole("client")}
          className="w-full py-3 rounded-lg border border-gray-600 hover:border-gray-400 transition text-white"
        >
          Continue as Client
        </button>
      </div>
    </div>
  );
}
