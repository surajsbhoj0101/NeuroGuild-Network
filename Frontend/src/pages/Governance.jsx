import React, { useEffect } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  CalendarClock,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";
import SideBar from "../components/SideBar";
import { useAuth } from "../contexts/AuthContext.jsx";

const robotoStyle = { fontFamily: "Roboto, sans-serif" };

const activeProposals = [
  {
    id: "001",
    title: "Update Skill Assessment Criteria",
    summary:
      "Refine benchmark thresholds for beginner, intermediate, and advanced certifications.",
    votes: 234,
    quorum: 500,
    endsAt: "Feb 15, 2026",
    status: "Active",
  },
  {
    id: "002",
    title: "Modify Council Voting Power",
    summary:
      "Rebalance council influence between domain experts and elected community delegates.",
    votes: 189,
    quorum: 500,
    endsAt: "Feb 20, 2026",
    status: "Active",
  },
  {
    id: "003",
    title: "Treasury Allocation For Mentor Grants",
    summary:
      "Allocate 4% of quarterly treasury rewards to mentorship grants and apprenticeship bounties.",
    votes: 312,
    quorum: 500,
    endsAt: "Feb 26, 2026",
    status: "Active",
  },
];

const statCards = [
  { label: "Active Proposals", value: "12", icon: Vote },
  { label: "Total Voters", value: "1,247", icon: Users },
  { label: "SBTs Issued", value: "3,492", icon: Award },
  { label: "Participation Rate", value: "67%", icon: TrendingUp },
];

const recentActivity = [
  { item: "Proposal #001", outcome: "Approved", color: "text-green-400" },
  { item: "Proposal #002", outcome: "Rejected", color: "text-red-400" },
  { item: "Proposal #019", outcome: "Approved", color: "text-green-400" },
];

function ProposalCard({ proposal }) {
  const progress = Math.min(
    100,
    Math.round((proposal.votes / proposal.quorum) * 100)
  );

  return (
    <div className="rounded-2xl border border-[#14a19f]/25 bg-[#0f1730]/70 p-5 hover:border-[#14a19f]/45 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[#7df3f0] tracking-wide uppercase">
            Proposal #{proposal.id}
          </p>
          <h3 className="text-white text-lg font-semibold mt-1" style={robotoStyle}>
            {proposal.title}
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-cyan-500/20 text-cyan-300 border-cyan-500/35">
          {proposal.status}
        </span>
      </div>

      <p className="text-gray-300 text-sm mt-3 leading-relaxed" style={robotoStyle}>
        {proposal.summary}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>
            Votes: {proposal.votes}/{proposal.quorum}
          </span>
          <span>{progress}% to quorum</span>
        </div>
        <div className="h-2 rounded-full bg-[#1b2747] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#14a19f] to-[#1ecac7]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock size={13} />
          Ends: {proposal.endsAt}
        </span>
        <button className="inline-flex items-center gap-1 text-[#7df3f0] hover:text-white transition-colors">
          Details <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}

export default function Governance() {
  const { isAuthentication } = useAuth();

  useEffect(() => {
    if (!isAuthentication) {
      window.location.href = "/";
    }
  }, [isAuthentication]);

  if (!isAuthentication) {
    return (
      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen">
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

        <SideBar />

        <div className="flex-1 px-4 md:px-8 pb-8">
          <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-2xl p-10 text-center mt-2">
            <AlertCircle className="w-14 h-14 text-[#14a19f] mx-auto mb-4" />
            <p className="text-white text-lg" style={robotoStyle}>
              Please connect your wallet to access Governance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen">
      <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
      <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

      <SideBar />

      <div className="flex-1 px-4 md:px-8 pb-8 relative z-10">
        <section className="mb-6 md:mb-8 backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-2xl p-5 md:p-7">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#14a19f]/35 bg-[#14a19f]/10 text-[#8ff6f3] text-xs tracking-wide uppercase mb-3">
                <ShieldCheck size={14} />
                Decentralized Governance
              </div>
              <h1
                className="text-2xl md:text-3xl font-bold text-white mb-2"
              >
                Governance
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-2xl" style={robotoStyle}>
                Review proposals, track quorum, and vote on ecosystem changes
                that shape treasury policy, reputation rules, and platform
                upgrades.
              </p>
            </div>

            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 min-w-[250px]">
              <p className="text-xs uppercase tracking-wide text-gray-300 mb-2">
                Your Voting Status
              </p>
              <div className="inline-flex items-center gap-2 text-green-300 text-sm font-semibold">
                <CheckCircle2 size={16} />
                Eligible to Vote
              </div>
              <p className="text-xs text-gray-400 mt-2" style={robotoStyle}>
                Verified profile and SBT ownership confirmed.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-4 hover:border-[#14a19f]/40 transition-all"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#14a19f]/15 text-[#7df3f0] mb-3">
                  <Icon size={18} />
                </div>
                <p className="text-white text-2xl font-bold leading-none">
                  {item.value}
                </p>
                <p className="text-gray-400 text-xs mt-2" style={robotoStyle}>
                  {item.label}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
          <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-white text-xl font-bold tracking-wide">
                Active Proposals
              </h2>
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#14a19f]/35 text-[#8ff6f3] bg-[#14a19f]/10 hover:bg-[#14a19f]/20 transition-colors">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {activeProposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-5">
              <h3 className="text-white text-lg font-semibold mb-3" style={robotoStyle}>
                Your Activity
              </h3>
              <div className="space-y-2.5">
                {recentActivity.map((entry) => (
                  <div
                    key={`${entry.item}-${entry.outcome}`}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-300">{entry.item}</span>
                    <span className={entry.color}>{entry.outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-5">
              <h3 className="text-white text-lg font-semibold mb-3" style={robotoStyle}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2.5 bg-[#14a19f] hover:bg-[#1ecac7] text-white rounded-lg transition-colors text-sm font-semibold">
                  Create Proposal
                </button>
                <button className="w-full px-4 py-2.5 bg-[#1c2744] hover:bg-[#25345a] text-gray-200 rounded-lg transition-colors text-sm font-semibold border border-white/10">
                  Explore Governance Docs
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
