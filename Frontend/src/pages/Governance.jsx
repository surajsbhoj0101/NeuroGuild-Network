import React, { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
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
import { useAccount, useWalletClient } from "wagmi";
import CreateProposalModal from "../components/CreateProposalModal";
import SideBar from "../components/SideBar";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNotifications } from "../contexts/NotificationContext.jsx";
import NoticeToast from "../components/NoticeToast.jsx";
import { createProposal } from "../utils/create_proposal.js";
import {
  checkHasReputationSbt,
  emptyReputationSbtStatus,
} from "../utils/checkReputationSbt.js";


const robotoStyle = { fontFamily: "Roboto, sans-serif" };
const createInitialAction = () => ({
  id: Date.now() + Math.random(),
  target: "",
  value: "0",
  functionSignature: "",
  args: "",
});
const createInitialProposalForm = () => ({
  title: "",
  description: "",
  rationale: "",
  actions: [createInitialAction()],
});

const initialActiveProposals = [
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
  const hasNumericQuorum =
    typeof proposal.quorum === "number" && Number.isFinite(proposal.quorum) && proposal.quorum > 0;
  const progress = hasNumericQuorum
    ? Math.min(100, Math.round((proposal.votes / proposal.quorum) * 100))
    : 0;



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
            {hasNumericQuorum
              ? `Votes: ${proposal.votes}/${proposal.quorum}`
              : proposal.quorumLabel || `Votes: ${proposal.votes}`}
          </span>
          <span>{hasNumericQuorum ? `${progress}% to quorum` : "Quorum set by governor"}</span>
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
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { addSystemNotification } = useNotifications();
  const [openCreateProposal, setOpenCreateProposal] = useState(false);
  const [proposalForm, setProposalForm] = useState(createInitialProposalForm);
  const [activeProposals, setActiveProposals] = useState(initialActiveProposals);
  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [reputationStatus, setReputationStatus] = useState(emptyReputationSbtStatus);
  const [loadingReputationStatus, setLoadingReputationStatus] = useState(false);

  useEffect(() => {
    if (!isAuthentication) {
      window.location.href = "/";
    }
  }, [isAuthentication]);

  useEffect(() => {
    let cancelled = false;

    const loadReputationStatus = async () => {
      if (!address) {
        if (!cancelled) {
          setReputationStatus(emptyReputationSbtStatus);
          setLoadingReputationStatus(false);
        }
        return;
      }

      if (!cancelled) {
        setLoadingReputationStatus(true);
      }

      const nextStatus = await checkHasReputationSbt(address);

      if (!cancelled) {
        setReputationStatus(nextStatus);
        setLoadingReputationStatus(false);
      }
    };

    loadReputationStatus();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const getSigner = async () => {
    if (!walletClient || !window.ethereum) {
      return null;
    }

    const provider = new BrowserProvider(window.ethereum);
    return provider.getSigner();
  };

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

  const handleSubmitProposal = async () => {
    if (!reputationStatus.hasReputationSbt) {
      setRedNotice(true);
      setNotice("Reputation SBT required to create governance proposals.");
      return;
    }

    const signer = await getSigner();
    if (!signer) {
      setRedNotice(true);
      setNotice("Please connect your wallet first.");
      return;
    }

    if (!address) {
      setRedNotice(true);
      setNotice("Wallet address missing.");
      return;
    }

    const hasReadyAction = proposalForm.actions.some(
      (action) => action.target.trim() && action.functionSignature.trim()
    );

    if (!hasReadyAction) {
      setRedNotice(true);
      setNotice("Add at least one action with target and function signature.");
      return;
    }

    if (!proposalForm.title) {
      setRedNotice(true);
      setNotice("There is no title given.");
      return;
    }

    if (!proposalForm.description) {
      setRedNotice(true);
      setNotice("Description is required.");
      return;
    }

    const summary =
      proposalForm.rationale.trim() || proposalForm.description.trim();

    try {
      setSubmittingProposal(true);
      const tx = await createProposal(signer, {
        description: proposalForm.description,
        actions: proposalForm.actions,
      });

      if (!tx.success) {
        setRedNotice(true);
        setNotice(tx.error || "Failed to create proposal.");
        return;
      }

      const nextProposal = {
        id: tx.proposalId || `draft-${Date.now()}`,
        title: proposalForm.title.trim(),
        summary,
        votes: 0,
        quorum: null,
        quorumLabel: "Quorum: 4% of total voting supply",
        endsAt: tx.voteEnd ? `Block ${tx.voteEnd}` : "Pending vote end",
        status: "Pending",
        txHash: tx.txHash,
      };

      setActiveProposals((current) => [nextProposal, ...current]);

      try {
        await addSystemNotification({
          title: "New governance proposal created",
          description: `${proposalForm.title.trim()} is now pending governance voting.`,
          link: "/governance",
          metadata: {
            proposalId: tx.proposalId || "",
            proposer: address.toLowerCase(),
            txHash: tx.txHash || "",
          },
        });
      } catch (error) {
        console.error("Failed to add system notification:", error);
      }

      setRedNotice(false);
      setNotice("Proposal created successfully.");
      setProposalForm(createInitialProposalForm());
      setOpenCreateProposal(false);
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleProposalFieldChange = (field, value) => {
    setProposalForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleProposalActionChange = (id, field, value) => {
    setProposalForm((current) => ({
      ...current,
      actions: current.actions.map((action) =>
        action.id === id ? { ...action, [field]: value } : action
      ),
    }));
  };

  const handleAddProposalAction = () => {
    setProposalForm((current) => ({
      ...current,
      actions: [...current.actions, createInitialAction()],
    }));
  };

  const handleRemoveProposalAction = (id) => {
    setProposalForm((current) => {
      if (current.actions.length === 1) {
        return current;
      }

      return {
        ...current,
        actions: current.actions.filter((action) => action.id !== id),
      };
    });
  };

  const handleCloseProposalModal = () => {
    setOpenCreateProposal(false);
  };

  const votingStatusTone = loadingReputationStatus
    ? "border-[#14a19f]/30 bg-[#14a19f]/10 text-[#8ff6f3]"
    : reputationStatus.hasReputationSbt
      ? "border-green-500/30 bg-green-500/10 text-green-300"
      : "border-amber-500/30 bg-amber-500/10 text-amber-300";

  const votingStatusIcon = loadingReputationStatus
    ? ShieldCheck
    : reputationStatus.hasReputationSbt
      ? CheckCircle2
      : AlertCircle;

  const votingStatusLabel = loadingReputationStatus
    ? "Checking eligibility"
    : reputationStatus.hasReputationSbt
      ? "Eligible to Vote"
      : "Reputation SBT Required";

  const votingStatusDescription = loadingReputationStatus
    ? "Fetching your reputation SBT status from Base Sepolia."
    : reputationStatus.hasReputationSbt
      ? `Verified profile and ${reputationStatus.balance} reputation SBT${reputationStatus.balance === 1 ? "" : "s"} found.`
      : "This wallet does not currently hold a reputation SBT, so governance access is limited.";

  const VotingStatusIcon = votingStatusIcon;

  return (
    <>
      <CreateProposalModal
        isOpen={openCreateProposal}
        onClose={handleCloseProposalModal}
        submitProposal={handleSubmitProposal}
        isSubmitting={submittingProposal}
        proposalForm={proposalForm}
        onChange={handleProposalFieldChange}
        onActionChange={handleProposalActionChange}
        onAddAction={handleAddProposalAction}
        onRemoveAction={handleRemoveProposalAction}
      />

      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen">
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

        <SideBar />

        <NoticeToast message={notice} isError={redNotice} onClose={() => setNotice(null)} />

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

              <div className={`rounded-xl p-4 min-w-[250px] ${votingStatusTone}`}>
                <p className="text-xs uppercase tracking-wide text-gray-300 mb-2">
                  Your Voting Status
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold">
                  <VotingStatusIcon size={16} />
                  {votingStatusLabel}
                </div>
                <p className="text-xs text-gray-400 mt-2" style={robotoStyle}>
                  {votingStatusDescription}
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
                  <button
                    onClick={() => setOpenCreateProposal(true)}
                    disabled={!reputationStatus.hasReputationSbt}
                    className="w-full px-4 py-2.5 bg-[#14a19f] hover:bg-[#1ecac7] disabled:bg-[#1d3742] disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-semibold"
                  >
                    Create Proposal
                  </button>
                  {!reputationStatus.hasReputationSbt && (
                    <p className="text-xs text-amber-300" style={robotoStyle}>
                      You need a reputation SBT in this wallet before creating proposals.
                    </p>
                  )}
                  <button className="w-full px-4 py-2.5 bg-[#1c2744] hover:bg-[#25345a] text-gray-200 rounded-lg transition-colors text-sm font-semibold border border-white/10">
                    Explore Governance Docs
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
