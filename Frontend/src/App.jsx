import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MdSecurity } from "react-icons/md";
import { GiBrain } from "react-icons/gi";
import { RiExchangeDollarLine } from "react-icons/ri";
import { BsPeople } from "react-icons/bs";
import { useAccount } from "wagmi";
import Snowfall from "react-snowfall";
import Logout from "./components/Logout.jsx";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import CustomConnectButton from "./components/CustomConnectButton.jsx";
import Login from "./components/Login";
import logo from "./assets/images/logo.png";
import "./index.css";
import { LogOut } from "lucide-react";

const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
const robotoStyle = { fontFamily: "Roboto, sans-serif" };

export default function App() {
  const { address, isConnected } = useAccount();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0f1422] text-white">
      <Login
        setLoadingUser={setLoadingUser}
        setNotice={setNotice}
        setRedNotice={setRedNotice}
      />
      <Logout />

      {loadingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-t-[#14a19f] border-gray-700 rounded-full animate-spin"></div>
            <div className="text-sm text-white">Authenticating…</div>
          </div>
        </div>
      )}

      <Snowfall snowflakeCount={60} />

      <div className="pointer-events-none absolute -left-32 -top-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#122033] via-[#0f2540] to-[#08101a] opacity-40 blur-3xl"></div>
      <div className="pointer-events-none absolute right-[-120px] top-48 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl"></div>

      {notice && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-2 rounded shadow-lg border ${
              redNotice
                ? "bg-red-600 border-red-700"
                : "bg-[#14a19f] border-[#1ecac7]/30"
            }`}
          >
            {notice}
          </div>
        </div>
      )}

      <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
        <div className="space-y-6">
          <h1
            style={orbitronStyle}
            className="text-4xl md:text-5xl font-extrabold"
          >
            NeuroGuild — decentralized freelancing, reimagined
          </h1>

          <p style={robotoStyle} className="text-gray-300 max-w-xl">
            Match with verified talent, escrow payments on-chain, and build
            reputation using skill SBTs. A trust-minimized marketplace for the
            future of work.
          </p>

          <div className="mt-6 flex justify-center flex-col  gap-4">
            {!isConnected ? (
              <div className="text-md text-blue-500">
                Connect Wallet to Continue
              </div>
            ) : (
              <div className="text-sm text-green-400">
                Wallet connected Successfully
              </div>
            )}

            <div>
              <CustomConnectButton />
            </div>
          </div>

          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <li className="flex items-start gap-3">
              <div className="p-2 bg-[#111827] rounded text-cyan-300">
                <GiBrain />
              </div>
              <div>
                <div style={orbitronStyle} className="text-sm font-semibold">
                  AI-Powered Matches
                </div>
                <div style={robotoStyle} className="text-xs text-gray-400">
                  Smart discovery of best-fit gigs and freelancers.
                </div>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="p-2 bg-[#111827] rounded text-yellow-400">
                <MdSecurity />
              </div>
              <div>
                <div style={orbitronStyle} className="text-sm font-semibold">
                  On-chain Escrow
                </div>
                <div style={robotoStyle} className="text-xs text-gray-400">
                  Payments locked until delivery.
                </div>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="p-2 bg-[#111827] rounded text-green-300">
                <RiExchangeDollarLine />
              </div>
              <div>
                <div style={orbitronStyle} className="text-sm font-semibold">
                  Transparent Fees
                </div>
                <div style={robotoStyle} className="text-xs text-gray-400">
                  Low predictable platform overhead.
                </div>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="p-2 bg-[#111827] rounded text-blue-300">
                <BsPeople />
              </div>
              <div>
                <div style={orbitronStyle} className="text-sm font-semibold">
                  SBT Reputation
                </div>
                <div style={robotoStyle} className="text-xs text-gray-400">
                  Skill-bound tokens verify expertise.
                </div>
              </div>
            </li>
          </ul>
        </div>

        <aside className="w-full">
          <div className="rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-[#162036]">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
                <img src={logo} alt="logo" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 style={orbitronStyle} className="text-lg font-bold">
                    AI Job Match — Frontend React
                  </h3>
                  <div className="text-xs px-2 py-1 bg-[#1f2a45] rounded">
                    Hourly
                  </div>
                </div>

                <p style={robotoStyle} className="text-sm text-gray-300 mt-2">
                  Build a responsive dashboard using React, TypeScript and
                  Tailwind — 20 hours estimated.
                </p>

                <div
                  className="ml-auto mt-4 text-lg font-extrabold"
                  style={orbitronStyle}
                >
                  $55/hr
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-300">
              <div className="p-2 bg-[#081421] rounded">React</div>
              <div className="p-2 bg-[#081421] rounded">TypeScript</div>
              <div className="p-2 bg-[#081421] rounded">Tailwind</div>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-400" style={robotoStyle}>
            Built for builders — privacy-forward, modular, and composable.
          </div>
        </aside>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-[#0f121e] rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border border-[#162036]">
          <div>
            <h4 style={orbitronStyle} className="text-lg">
              For Clients
            </h4>
            <p style={robotoStyle} className="text-sm text-gray-300 mt-2">
              Post transparent gigs and hold funds in escrow.
            </p>
          </div>

          <div>
            <h4 style={orbitronStyle} className="text-lg">
              For Freelancers
            </h4>
            <p style={robotoStyle} className="text-sm text-gray-300 mt-2">
              Get matched, build reputation, and get paid securely.
            </p>
          </div>

          <div>
            <h4 style={orbitronStyle} className="text-lg">
              Open Ecosystem
            </h4>
            <p style={robotoStyle} className="text-sm text-gray-300 mt-2">
              Composable contracts, token-gated features, DAO-ready.
            </p>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between text-gray-400">
          <div style={robotoStyle} className="text-sm">
            © {new Date().getFullYear()} NeuroGuild
          </div>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
