import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MdSecurity } from "react-icons/md";
import { GiBrain } from "react-icons/gi";
import { RiExchangeDollarLine } from "react-icons/ri";
import { BsPeople } from "react-icons/bs";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Snowfall from "react-snowfall";
import logo from "./assets/images/logo.png";

import "./index.css";

const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
const robotoStyle = { fontFamily: "Roboto, sans-serif" };

export default function App() {
  const { address, isConnected } = useAccount();

  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  const showToast = (msg) => setToast({ msg, id: Date.now() });
  const handleCheckConnection = (e) => {
    if (!isConnected) {
      e.preventDefault();
      showToast("Please connect your wallet to proceed.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden dark:bg-[#0f111d] bg-[#0f1422] text-white">
      {/* <Snowfall snowflakeCount={60} /> */}
      {/* decorative background blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#122033] via-[#0f2540] to-[#08101a] opacity-40 blur-3xl mix-blend-screen"></div>
      <div className="pointer-events-none absolute right-[-120px] top-48 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>

      {/* toast */}
      {toast && (
        <div className="fixed right-4 top-6 z-50">
          <div className="flex items-center gap-3 bg-[#14a19f] text-white px-4 py-2 rounded shadow-lg">
            <div className="text-sm">{toast.msg}</div>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-xs text-white/90 px-2 py-1 rounded hover:opacity-90"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}  

      {/* hero */}
      <section className="max-w-6xl mx-auto px-6 pt-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        <div className="space-y-6">
          <h1 style={orbitronStyle} className="text-4xl md:text-5xl font-extrabold leading-tight">
            NeuroGuild — decentralized freelancing, reimagined
          </h1>

          <p style={robotoStyle} className="mt-2 text-gray-300 max-w-xl">
            Match with verified talent, escrow payments on-chain, and build reputation using skill SBTs.
            NeuroGuild gives projects and freelancers a secure, composable and privacy-focused marketplace.
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <Link
              to="/browse-jobs"
              onClick={handleCheckConnection}
              className="px-6 py-3 bg-[#14a19f] hover:bg-cyan-700 rounded-md text-white shadow-md transform hover:-translate-y-0.5 transition"
              style={robotoStyle}
            >
              Browse Gigs
            </Link>

            <Link
              to="/post-job"
              onClick={handleCheckConnection}
              className="px-5 py-3 bg-transparent border border-gray-700 hover:border-gray-600 rounded-md text-white"
              style={robotoStyle}
            >
              Post a Job
            </Link>

            <div className="ml-2 text-sm text-gray-400" style={robotoStyle}>
              {isConnected ? `Connected: ${address?.slice(0,6)}...${address?.slice(-4)}` : "Wallet not connected"}
            </div>
          </div>

          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <li className="flex items-start gap-3">
              <div className="p-2 bg-[#111827] rounded text-cyan-300"><GiBrain /></div>
              <div>
                <div style={orbitronStyle} className="text-sm font-semibold">AI-Powered Matches</div>
                <div style={robotoStyle} className="text-xs text-gray-400">Smart discovery of best-fit gigs and freelancers.</div>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="p-2 bg-[#111827] rounded text-yellow-400"><MdSecurity /></div>
              <div>
                <div style={orbitronStyle} className="text-sm font-semibold">On-chain Escrow</div>
                <div style={robotoStyle} className="text-xs text-gray-400">Payments held in contract until delivery.</div>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="p-2 bg-[#111827] rounded text-green-300"><RiExchangeDollarLine /></div>
              <div>
                <div style={orbitronStyle} className="text-sm font-semibold">Transparent Fees</div>
                <div style={robotoStyle} className="text-xs text-gray-400">Low predictable platform overhead.</div>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="p-2 bg-[#111827] rounded text-blue-300"><BsPeople /></div>
              <div>
                <div style={orbitronStyle} className="text-sm font-semibold">SBT Reputation</div>
                <div style={robotoStyle} className="text-xs text-gray-400">Skill-bound tokens verify expertise.</div>
              </div>
            </li>
          </ul>
        </div>

        {/* mock preview card */}
        <aside className="w-full">
          <div className="rounded-2xl p-6 bg-gradient-to-br from-[#081220] to-[#0b1624] shadow-2xl border border-[#162036] transform hover:scale-[1.01] transition">
            <div className="flex items-start gap-4">
              <div className="w-15 h-15 rounded-lg overflow-hidden  flex items-center justify-center">
                <div className="text-white font-bold" style={orbitronStyle}>
                  <img src={logo}  alt="" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 style={orbitronStyle} className="text-lg font-bold">AI Job match — Frontend React</h3>
                  <div className="text-xs px-2 py-1 bg-[#1f2a45] rounded text-gray-200">Hourly</div>
                </div>

                <p style={robotoStyle} className="text-sm text-gray-300 mt-2">Build a responsive admin dashboard using React, TypeScript and Tailwind — 20 hours estimated.</p>

                <div className="flex items-center gap-2 mt-4">
                  <div className="px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded text-white text-sm">Apply</div>
                  <div className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">Save</div>
                  <div className="ml-auto text-lg font-extrabold" style={orbitronStyle}>$55/hr</div>
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
            Built for builders — privacy-forward, modular, and extensible. Integrates with wallets for identity and payments.
          </div>
        </aside>
      </section>

      {/* features */}
      <section className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <div className="bg-[#0f121e] rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-inner border border-[#162036]">
          <div className="p-4">
            <h4 style={orbitronStyle} className="text-lg">For Clients</h4>
            <p style={robotoStyle} className="text-gray-300 text-sm mt-2">Post transparent gigs, hold funds in escrow and pick from verified talent.</p>
          </div>

          <div className="p-4">
            <h4 style={orbitronStyle} className="text-lg">For Freelancers</h4>
            <p style={robotoStyle} className="text-gray-300 text-sm mt-2">Showcase SBT-verified skills, get matched and get paid securely on completion.</p>
          </div>

          <div className="p-4">
            <h4 style={orbitronStyle} className="text-lg">Open Ecosystem</h4>
            <p style={robotoStyle} className="text-gray-300 text-sm mt-2">Composable contracts, token-gated features and integrations for teams and DAOs.</p>
          </div>
        </div>
      </section>
     

      {/* footer */}
      <footer className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between text-gray-400">
          <div style={robotoStyle} className="text-sm">© {new Date().getFullYear()} NeuroGuild</div>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link to="/terms" className="hover:text-white" style={robotoStyle}>Terms</Link>
            <Link to="/privacy" className="hover:text-white" style={robotoStyle}>Privacy</Link>
            <Link to="/contact" className="hover:text-white" style={robotoStyle}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
