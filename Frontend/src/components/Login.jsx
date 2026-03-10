import { useAccount, useChainId, useSignMessage, useWalletClient } from "wagmi";
import { SiweMessage } from "siwe";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { createUserOnchain } from "../utils/create_user";
import { BrowserProvider } from "ethers";
import { Briefcase, Rocket, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const roleOptions = [
  {
    id: "freelancer",
    title: "Freelancer",
    subtitle: "Build reputation and win projects",
    description:
      "Showcase verified skills, receive work opportunities, and manage your delivery flow.",
    icon: Rocket,
    actionLabel: "Continue as Freelancer",
    accent: "bg-[#14a19f]/15 text-[#31c4c1]",
  },
  {
    id: "client",
    title: "Client",
    subtitle: "Post roles and hire talent",
    description:
      "Create jobs, review qualified freelancers, and manage projects through the platform.",
    icon: Briefcase,
    actionLabel: "Continue as Client",
    accent: "bg-blue-500/15 text-blue-300",
  },
];

export default function Login({ setLoadingUser, setNotice, setRedNotice }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { signMessageAsync } = useSignMessage();
  const { setAuthState } = useAuth();
  const navigate = useNavigate();
  const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
  const robotoStyle = { fontFamily: "Roboto, sans-serif" };

  const [isSelectingRole, setIsSelectingRole] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);

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

      setAuthState({ role: jwtRes.data.role, userId: jwtRes.data.userId });

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
        domain: window.location.host, //My site to prevent Man in the Middle
        address, //Address which trying to sign
        statement: "Welcome to Neuroguild. Sign in to access your profile and secure your data.",
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
      setPendingRole(role);
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
      setPendingRole(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-[#223041] bg-[#0d1224]/95 shadow-2xl">
        <div className="border-b border-[#223041] px-6 py-6 sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#14a19f]/20 bg-[#14a19f]/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#14a19f]">
            <ShieldCheck size={14} />
            Profile Setup
          </div>
          <h2
            style={orbitronStyle}
            className="mt-4 text-center text-2xl font-semibold tracking-[0.14em] text-white sm:text-left"
          >
            Choose Your Role
          </h2>
          <p
            style={robotoStyle}
            className="mt-3 text-center text-sm text-gray-400 sm:text-left"
          >
            Select the profile that matches how you will use NeuroGuild.
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          {roleOptions.map((role) => {
            const Icon = role.icon;
            const isPending = pendingRole === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => selectRole(role.id)}
                disabled={Boolean(pendingRole)}
                className="rounded-xl border border-[#223041] bg-[#11182d] p-5 text-left transition hover:border-[#31c4c1] hover:bg-[#141d34] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${role.accent}`}>
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full border border-[#223041] bg-[#0b1120] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-gray-400">
                    {isPending ? "Processing" : "Role"}
                  </span>
                </div>

                <div className="mt-6">
                  <h3
                    style={orbitronStyle}
                    className="text-lg font-semibold tracking-[0.08em] text-white"
                  >
                    {role.title}
                  </h3>
                  <p style={robotoStyle} className="mt-2 text-sm font-medium text-[#31c4c1]">
                    {role.subtitle}
                  </p>
                  <p style={robotoStyle} className="mt-3 text-sm leading-6 text-gray-400">
                    {role.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#223041] pt-4">
                  <span
                    style={robotoStyle}
                    className="inline-flex text-sm font-medium text-white"
                  >
                    {isPending ? "Creating profile..." : role.actionLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
