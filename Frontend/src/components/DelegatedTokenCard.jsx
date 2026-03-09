import React, { useState } from "react";
import { ArrowUpRight, Shield, Users, Wallet } from "lucide-react";

const robotoStyle = { fontFamily: "Roboto, sans-serif" };
const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };

export default function DelegatedTokenCard({
  delegatedAmount = "0",
  availableAmount = "--",
  delegateeLabel = "Not delegated yet",
  onDelegate,
}) {
  const [delegateMode, setDelegateMode] = useState("self");
  const [delegateAddress, setDelegateAddress] = useState("");

  const handleDelegate = () => {
    if (onDelegate) {
      onDelegate({
        mode: delegateMode,
        address: delegateMode === "other" ? delegateAddress : "",
      });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-5 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,202,199,0.18),transparent_38%)]" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-200">
            <Users size={13} />
            Governance Delegation
          </div>
          <h3 className="text-lg font-semibold text-white" style={robotoStyle}>
            Delegated Tokens
          </h3>
          <p className="mt-1 text-sm text-gray-400" style={robotoStyle}>
            Track how many governance tokens are currently delegated from this wallet.
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <Shield size={20} />
        </div>
      </div>

      <div className="relative mt-5 rounded-2xl border border-white/10 bg-[#0a1020]/80 p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">
          Delegated Amount
        </p>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-bold text-white" style={orbitronStyle}>
            {delegatedAmount}
          </span>
          <span className="pb-1 text-sm text-cyan-300">GOV</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/8 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
              Delegatee
            </p>
            <p className="mt-2 text-sm text-gray-200" style={robotoStyle}>
              {delegateeLabel}
            </p>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
              Available Balance
            </p>
            <p className="mt-2 text-sm text-gray-200" style={robotoStyle}>
              {availableAmount} GOV
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-5 rounded-2xl border border-white/10 bg-[#09101d]/90 p-4">
        <div className="flex items-center gap-2 text-sm text-white">
          <Wallet size={16} className="text-cyan-300" />
          Choose delegation mode
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setDelegateMode("self")}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              delegateMode === "self"
                ? "border-[#14a19f]/50 bg-[#14a19f]/15 text-white"
                : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
            }`}
          >
            <p className="text-sm font-semibold">Delegate to Self</p>
            <p className="mt-1 text-xs text-gray-400" style={robotoStyle}>
              Keep voting power on your connected wallet.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setDelegateMode("other")}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              delegateMode === "other"
                ? "border-[#14a19f]/50 bg-[#14a19f]/15 text-white"
                : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
            }`}
          >
            <p className="text-sm font-semibold">Delegate to Other</p>
            <p className="mt-1 text-xs text-gray-400" style={robotoStyle}>
              Assign voting power to another wallet address.
            </p>
          </button>
        </div>

        {delegateMode === "other" && (
          <div className="mt-4">
            <label
              htmlFor="delegate-address"
              className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-gray-500"
            >
              Delegate Wallet Address
            </label>
            <input
              id="delegate-address"
              type="text"
              value={delegateAddress}
              onChange={(event) => setDelegateAddress(event.target.value)}
              placeholder="0x..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-gray-500"
            />
          </div>
        )}

        <p className="mt-3 text-xs text-gray-400" style={robotoStyle}>
          {delegateMode === "self"
            ? "Self-delegation enables this wallet to use its own governance voting power."
            : "Delegating to another address transfers voting power without moving token ownership."}
        </p>
      </div>

      <button
        type="button"
        onClick={handleDelegate}
        className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#14a19f] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1ecac7]"
      >
        {delegateMode === "self" ? "Delegate to Self" : "Delegate to Other User"}
        <ArrowUpRight size={16} />
      </button>
    </div>
  );
}
