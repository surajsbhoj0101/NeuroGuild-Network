import React from "react";
import { ArrowUpRight, Shield, Users } from "lucide-react";

const robotoStyle = { fontFamily: "Roboto, sans-serif" };
const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };

export default function DelegatedTokenCard({
  delegatedAmount = "0",
  availableAmount = "--",
  delegateeLabel = "Not delegated yet",
  onDelegate,
}) {
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

      <button
        type="button"
        onClick={onDelegate}
        className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#14a19f] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1ecac7]"
      >
        Delegate Tokens
        <ArrowUpRight size={16} />
      </button>
    </div>
  );
}
