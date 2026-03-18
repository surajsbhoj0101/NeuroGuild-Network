import React, { useEffect, useState } from "react";
import { BrowserProvider, JsonRpcProvider } from "ethers";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Copy,
  ShieldCheck,
  TrendingUp,
  Vote,
} from "lucide-react";
import { useAccount, useWalletClient } from "wagmi";
import CreateProposalModal from "../components/CreateProposalModal";
import SideBar from "../components/SideBar";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNotifications } from "../contexts/NotificationContext.jsx";
import NoticeToast from "../components/NoticeToast.jsx";
import DelegatedTokenCard from "../components/DelegatedTokenCard.jsx";
import { createProposal } from "../utils/create_proposal.js";
import {
  checkHasReputationSbt,
  emptyReputationSbtStatus,
} from "../utils/checkReputationSbt.js";
import { useTokenBalance } from "../contexts/TokenBalanceContext.jsx";
import { delegateOther, delegateSelf } from "../utils/delegate_gov.js";
import api from "../utils/api.js";
import {
  executeProposal,
  fetchProposalQuorum,
  fetchProposalState,
  queueProposal,
} from "../utils/governance_actions.js";
const robotoStyle = { fontFamily: "Roboto, sans-serif" };
const rpcUrl = import.meta.env.VITE_RPC_URL;
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

const truncateText = (value, maxLength) => {
  const normalized = value?.trim?.() || "";
  if (!normalized) {
    return "";
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength).trimEnd()}...`
    : normalized;
};

const formatProposalStatus = (status) => {
  const normalized = status?.trim?.();
  if (!normalized) {
    return "Unknown";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeAddress = (value) => String(value || "").toLowerCase();

const sliceProposalId = (value) => {
  const text = String(value || "");
  if (text.length <= 14) {
    return text;
  }

  return `${text.slice(0, 8)}...${text.slice(-6)}`;
};

const getSupportLabel = (supportValue) => {
  const support = toSafeNumber(supportValue);
  if (support === 1) return "For";
  if (support === 0) return "Against";
  if (support === 2) return "Abstain";
  return "Unknown";
};

const aggregateProposalVotes = (votes = []) => {
  return votes.reduce(
    (totals, vote) => {
      const weight = toSafeNumber(vote?.weight);
      const support = toSafeNumber(vote?.support);

      totals.total += weight;

      if (support === 0) {
        totals.against += weight;
      } else if (support === 1) {
        totals.for += weight;
      } else if (support === 2) {
        totals.abstain += weight;
      }

      return totals;
    },
    { total: 0, for: 0, against: 0, abstain: 0 }
  );
};

const mapBackendProposalToCard = (proposal) => {
  const description = proposal?.description?.trim?.() || "";
  const descriptionLines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const titleSource = descriptionLines[0] || description || `Proposal #${proposal?.id || "--"}`;
  const summarySource =
    descriptionLines.slice(1).join(" ") || description || "No proposal description provided.";
  const voteTotals = aggregateProposalVotes(proposal?.votes || []);

  return {
    id: proposal?.id || `proposal-${Date.now()}`,
    proposer: normalizeAddress(proposal?.proposer),
    votesRaw: (proposal?.votes || []).map((vote) => ({
      voter: normalizeAddress(vote?.voter),
      support: toSafeNumber(vote?.support),
      weight: toSafeNumber(vote?.weight),
    })),
    voteStart: proposal?.voteStart || "",
    title: truncateText(titleSource, 72),
    summary: truncateText(summarySource, 180),
    votes: voteTotals.total,
    quorum: null,
    quorumLabel: `Votes: ${voteTotals.total} | For: ${voteTotals.for} | Against: ${voteTotals.against} | Abstain: ${voteTotals.abstain}`,
    endsAt: proposal?.voteEnd ? `Block ${proposal.voteEnd}` : "Vote end unavailable",
    status: formatProposalStatus(proposal?.status),
  };
};

const ACTIVE_STATUSES = new Set(["Active", "Pending"]);
const REVIEW_STATUSES = new Set(["Succeeded", "Queued"]);
const PAST_STATUSES = new Set(["Defeated", "Executed", "Canceled", "Cancelled", "Expired"]);

const mapOnchainProposalState = (state) => {
  switch (Number(state)) {
    case 0:
      return "Pending";
    case 1:
      return "Active";
    case 2:
      return "Canceled";
    case 3:
      return "Defeated";
    case 4:
      return "Succeeded";
    case 5:
      return "Queued";
    case 6:
      return "Expired";
    case 7:
      return "Executed";
    default:
      return null;
  }
};

const getProposalTone = (status) => {
  const normalized = status?.toLowerCase?.() || "";

  if (normalized === "executed" || normalized === "succeeded") {
    return "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
  }

  if (normalized === "defeated" || normalized === "expired" || normalized === "canceled" || normalized === "cancelled") {
    return "border-red-500/35 bg-red-500/10 text-red-300";
  }

  if (normalized === "queued" || normalized === "pending") {
    return "border-amber-500/35 bg-amber-500/10 text-amber-300";
  }

  return "border-cyan-500/35 bg-cyan-500/20 text-cyan-300";
};

const formatProposalDateLabel = (proposal) => {
  if (proposal?.status === "Active" || proposal?.status === "Pending") {
    return proposal?.endsAt ? `Ends ${proposal.endsAt}` : "Vote timing unavailable";
  }

  return proposal?.endsAt ? `Closed at ${proposal.endsAt}` : "Past proposal";
};

function ProposalCard({ proposal, onCopyProposalId }) {
  const hasNumericQuorum =
    typeof proposal.quorum === "number" && Number.isFinite(proposal.quorum) && proposal.quorum > 0;
  const progress = hasNumericQuorum
    ? Math.min(100, Math.round((proposal.votes / proposal.quorum) * 100))
    : 0;
  const votesNeeded = hasNumericQuorum
    ? Math.max(proposal.quorum - proposal.votes, 0)
    : null;

  const navigate = useNavigate();

  return (
    <div className="min-w-0 rounded-2xl border border-[#14a19f]/25 bg-[#0f1730]/70 p-4 sm:p-5 hover:border-[#14a19f]/45 transition-colors">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-[#7df3f0] tracking-tight uppercase">
              Proposal #{sliceProposalId(proposal.id)}
            </p>
            <button
              type="button"
              onClick={() => onCopyProposalId?.(proposal.id)}
              className="inline-flex items-center justify-center rounded-md border border-[#14a19f]/30 bg-[#14a19f]/10 p-1 text-[#7df3f0] transition-colors hover:bg-[#14a19f]/20 hover:text-white"
              aria-label={`Copy proposal id ${proposal.id}`}
            >
              <Copy size={12} />
            </button>
          </div>
          <h3 className="mt-1 text-white text-lg font-semibold break-words" style={robotoStyle}>
            {proposal.title}
          </h3>
        </div>
        <span className={`w-fit px-2.5 py-1 rounded-full text-xs font-semibold border ${getProposalTone(proposal.status)}`}>
          {proposal.status}
        </span>
      </div>

      <p className="mt-3 break-words text-sm leading-relaxed text-gray-300" style={robotoStyle}>
        {proposal.summary}
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex flex-col gap-1 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span className="break-words">
            {hasNumericQuorum
              ? `Votes: ${proposal.votes}/${proposal.quorum}`
              : proposal.quorumLabel || `Votes: ${proposal.votes}`}
          </span>
          <span className="shrink-0">{hasNumericQuorum ? `${progress}% to quorum` : "Quorum set by governor"}</span>
        </div>
        <div className="h-2 rounded-full bg-[#1b2747] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#14a19f] to-[#1ecac7]"
            style={{ width: `${progress}%` }}
          />
        </div>
        {hasNumericQuorum ? (
          <div className="mt-2 flex flex-col gap-1 text-[11px] text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Quorum progress</span>
            <span>{votesNeeded} votes needed</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
          <CalendarClock size={13} />
          {formatProposalDateLabel(proposal)}
        </span>
        <button onClick={()=> {navigate(`/proposal/${proposal.id}`)}} className="inline-flex w-fit items-center gap-1 text-[#7df3f0] hover:text-white transition-colors">
          Details <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}

function PastProposalRow({ proposal, onCopyProposalId }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/proposal/${proposal.id}`)}
      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-[#14a19f]/30 hover:bg-[#14a19f]/8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#7df3f0]">
              Proposal #{sliceProposalId(proposal.id)}
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCopyProposalId?.(proposal.id);
              }}
              className="inline-flex items-center justify-center rounded-md border border-[#14a19f]/30 bg-[#14a19f]/10 p-1 text-[#7df3f0] transition-colors hover:bg-[#14a19f]/20 hover:text-white"
              aria-label={`Copy proposal id ${proposal.id}`}
            >
              <Copy size={12} />
            </button>
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{proposal.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-gray-400" style={robotoStyle}>
            {proposal.summary}
          </p>
        </div>
        <div className="flex w-fit shrink-0 items-center gap-2 self-start sm:self-auto">
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getProposalTone(proposal.status)}`}>
            {proposal.status}
          </span>
          <ChevronRight size={16} className="text-gray-500" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 break-words text-[11px] text-gray-500">
        <span>{proposal.quorumLabel || `Votes: ${proposal.votes}`}</span>
        <span>{formatProposalDateLabel(proposal)}</span>
      </div>
    </button>
  );
}

function ReviewProposalRow({
  proposal,
  onCopyProposalId,
  onProposalAction,
  isSubmitting,
}) {
  const navigate = useNavigate();
  const status = proposal?.status?.toLowerCase?.() || "";
  const canQueue = status === "succeeded";
  const canExecute = status === "queued";

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-[#14a19f]/30 hover:bg-[#14a19f]/8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#7df3f0]">
              Proposal #{sliceProposalId(proposal.id)}
            </p>
            <button
              type="button"
              onClick={() => onCopyProposalId?.(proposal.id)}
              className="inline-flex items-center justify-center rounded-md border border-[#14a19f]/30 bg-[#14a19f]/10 p-1 text-[#7df3f0] transition-colors hover:bg-[#14a19f]/20 hover:text-white"
              aria-label={`Copy proposal id ${proposal.id}`}
            >
              <Copy size={12} />
            </button>
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{proposal.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-gray-400" style={robotoStyle}>
            {proposal.summary}
          </p>
        </div>

        <div className="flex w-fit shrink-0 items-center gap-2 self-start sm:self-auto">
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getProposalTone(proposal.status)}`}>
            {proposal.status}
          </span>
          <button
            type="button"
            onClick={() => navigate(`/proposal/${proposal.id}`)}
            className="inline-flex items-center gap-1 rounded-md border border-[#14a19f]/30 bg-[#14a19f]/10 px-2 py-1 text-[11px] font-medium text-[#7df3f0] transition-colors hover:bg-[#14a19f]/20"
          >
            Open <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 break-words text-[11px] text-gray-500">
        <span>{proposal.quorumLabel || `Votes: ${proposal.votes}`}</span>
        <span>{formatProposalDateLabel(proposal)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {canQueue ? (
          <button
            type="button"
            onClick={() => onProposalAction?.("queue", proposal.id)}
            disabled={isSubmitting}
            className="rounded-lg bg-[#14a19f] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1ecac7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Queueing..." : "Queue Proposal"}
          </button>
        ) : null}

        {canExecute ? (
          <button
            type="button"
            onClick={() => onProposalAction?.("execute", proposal.id)}
            disabled={isSubmitting}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Executing..." : "Execute Proposal"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function Governance() {
  const { isAuthentication } = useAuth();
  const navigate = useNavigate();
  const { address } = useAccount();
  const balances = useTokenBalance();
  const { data: walletClient } = useWalletClient();
  const { addSystemNotification } = useNotifications();
  const [openCreateProposal, setOpenCreateProposal] = useState(false);
  const [proposalForm, setProposalForm] = useState(createInitialProposalForm);
  const [proposals, setProposals] = useState([]);
  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [submittingReviewAction, setSubmittingReviewAction] = useState("");
  const [reputationStatus, setReputationStatus] = useState(emptyReputationSbtStatus);
  const [loadingReputationStatus, setLoadingReputationStatus] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);

  useEffect(() => {
    if (!isAuthentication) {
      window.location.href = "/";
    }
  }, [isAuthentication]);

  const fetchAllProposals = async () => {
    try {
      setLoadingProposals(true);
      const proposals = await api.get('/api/governance/fetch-proposals');
      const mappedProposals = (proposals?.data?.proposals || []).map(mapBackendProposalToCard);

      let provider = null;
      if (window.ethereum) {
        provider = new BrowserProvider(window.ethereum);
      } else if (rpcUrl) {
        provider = new JsonRpcProvider(rpcUrl);
      }

      const hydratedProposals = await Promise.all(
        mappedProposals.map(async (proposalCard) => {
          if (!provider || !proposalCard.voteStart) {
            return proposalCard;
          }

          const quorumResult = await fetchProposalQuorum(provider, proposalCard.voteStart);
          const stateResult = await fetchProposalState(provider, proposalCard.id);
          const quorumValue = Number(quorumResult?.quorum);
          const onchainStatus = stateResult?.success
            ? mapOnchainProposalState(stateResult.state)
            : null;

          return {
            ...proposalCard,
            status: onchainStatus || proposalCard.status,
            quorum:
              quorumResult?.success && Number.isFinite(quorumValue) && quorumValue > 0
                ? quorumValue
                : null,
          };
        })
      );

      setProposals(hydratedProposals);
    } catch (error) {
      console.error("Failed to fetch governance proposals:", error);
      setProposals([]);
      setRedNotice(true);
      setNotice("Failed to fetch governance proposals.");
    } finally {
      setLoadingProposals(false);
    }
  };

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
    fetchAllProposals();

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
      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex min-h-screen w-full flex-col gap-4 overflow-x-clip bg-[#161c32]">
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

        <div className="hidden md:block">
          <SideBar />
        </div>

        <div className="min-w-0 flex-1 px-4 md:px-8 pb-8">
          <div className="mx-auto w-full max-w-7xl backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-2xl p-10 text-center mt-2">
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

      setProposals((current) => [nextProposal, ...current]);

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

  const activeProposals = proposals.filter((proposal) => ACTIVE_STATUSES.has(proposal.status));
  const reviewProposals = proposals.filter((proposal) => REVIEW_STATUSES.has(proposal.status));
  const pastProposals = proposals.filter(
    (proposal) =>
      PAST_STATUSES.has(proposal.status) ||
      (!ACTIVE_STATUSES.has(proposal.status) && !REVIEW_STATUSES.has(proposal.status))
  );
  const totalVoters = proposals.reduce(
    (sum, proposal) => sum + proposal.votes,
    0
  );
  const totalPast = pastProposals.length;
  const executedCount = pastProposals.filter((proposal) => proposal.status === "Executed").length;
  const participationRate = proposals.length
    ? Math.round(
        proposals.reduce((sum, proposal) => {
          if (typeof proposal.quorum === "number" && proposal.quorum > 0) {
            return sum + Math.min(100, Math.round((proposal.votes / proposal.quorum) * 100));
          }
          return sum;
        }, 0) / proposals.length
      )
    : 0;
  const statCards = [
    { label: "Active Proposals", value: `${activeProposals.length}`, icon: Vote },
    { label: "Awaiting Action", value: `${reviewProposals.length}`, icon: CalendarClock },
    { label: "Executed", value: `${executedCount}`, icon: Award },
    { label: "Quorum Avg", value: `${participationRate}%`, icon: TrendingUp },
  ];
  const normalizedViewer = normalizeAddress(address);
  const recentActivity = proposals
    .flatMap((proposal) => {
      const entries = [];
      const activityColor =
        proposal.status === "Executed" || proposal.status === "Succeeded"
          ? "text-green-400"
          : proposal.status === "Defeated" || proposal.status === "Cancelled" || proposal.status === "Canceled"
            ? "text-red-400"
            : "text-amber-300";

      if (normalizedViewer && proposal.proposer === normalizedViewer) {
        entries.push({
          key: `created-${proposal.id}`,
          proposalId: proposal.id,
          item: `You created Proposal #${proposal.id}`,
          outcome: proposal.status,
          color: activityColor,
        });
      }

      const myVote = proposal.votesRaw?.find((vote) => vote.voter === normalizedViewer);
      if (normalizedViewer && myVote) {
        entries.push({
          key: `voted-${proposal.id}`,
          proposalId: proposal.id,
          item: `You voted ${getSupportLabel(myVote.support)} on Proposal #${proposal.id}`,
          outcome: proposal.status,
          color: activityColor,
        });
      }

      return entries;
    })
    .slice(0, 6);



  const handlehandleDelegateGovToken = async (...args) => {
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
    console.log(args[0])
    try {
      if (args[0]?.mode === 'self') {
        const res = await delegateSelf(signer);
        if (res.isSuccess) {
          setRedNotice(false);
          setNotice("Delegation successfull")
        }
      } else if (args[0]?.mode === 'other') {
        const res = await delegateOther(signer, args?.address);
        if (res.isSuccess) {
          setRedNotice(false);
          setNotice("Delegation successfull")
        }
      } else {
        setRedNotice(true);
        setNotice("Choose a valid delegation mode");
      }
    } catch (error) {
      console.log("Error occured while delegating", error)
      setRedNotice(true);
      setNotice(error)
    }
  }

  const handleCopyProposalId = async (proposalId) => {
    const value = String(proposalId || "");
    if (!value) {
      setRedNotice(true);
      setNotice("Proposal ID unavailable to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setRedNotice(false);
      setNotice("Proposal ID copied.");
    } catch (error) {
      console.log("Failed to copy proposal id", error);
      setRedNotice(true);
      setNotice("Could not copy proposal ID.");
    }
  };

  const handleReviewProposalAction = async (actionType, proposalId) => {
    if (!proposalId) {
      setRedNotice(true);
      setNotice("Proposal ID missing.");
      return;
    }

    const signer = await getSigner();
    if (!signer) {
      setRedNotice(true);
      setNotice("Please connect your wallet first.");
      return;
    }

    try {
      setSubmittingReviewAction(`${actionType}-${proposalId}`);
      const response = await api.get(`/api/governance/proposal/${proposalId}`);
      const proposalDetails = response?.data?.proposal;

      if (!proposalDetails?.description) {
        setRedNotice(true);
        setNotice("Proposal details unavailable for governance action.");
        return;
      }

      const result =
        actionType === "queue"
          ? await queueProposal(signer, proposalDetails)
          : await executeProposal(signer, proposalDetails);

      if (!result?.success) {
        setRedNotice(true);
        setNotice(result?.error || `Failed to ${actionType} proposal.`);
        return;
      }

      setRedNotice(false);
      setNotice(actionType === "queue" ? "Proposal queued successfully." : "Proposal executed successfully.");
      await fetchAllProposals();
    } catch (error) {
      console.error(`Failed to ${actionType} proposal:`, error);
      setRedNotice(true);
      setNotice(error?.message || `Failed to ${actionType} proposal.`);
    } finally {
      setSubmittingReviewAction("");
    }
  };


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

      <div className="dark:bg-[#0f111d] py-4 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full overflow-x-clip min-h-screen">
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

        <div className="hidden md:block">
          <SideBar />
        </div>

        <NoticeToast message={notice} isError={redNotice} onClose={() => setNotice(null)} />

        <div className="relative z-10 min-w-0 flex-1 px-4 pb-8 md:px-8">
          <div className="mx-auto w-full max-w-7xl">
          <section className="mb-6 md:mb-8 rounded-2xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-4 backdrop-blur-md sm:p-5 md:p-7">
            <div className="flex flex-col gap-5">
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {activeProposals.length} active now
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {reviewProposals.length} awaiting queue/execute
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {pastProposals.length} archived decisions
                  </span>
                  <span className="rounded-full border border-[#14a19f]/25 bg-[#14a19f]/10 px-3 py-1 text-xs text-[#8ff6f3]">
                    {totalVoters} weighted votes indexed
                  </span>
                </div>
              </div>

              <div className={`rounded-xl p-4 ${votingStatusTone}`}>
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

          <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4">
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

          <section className="space-y-6">
            <div className="rounded-xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-4 backdrop-blur-md sm:p-5 md:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-white text-xl font-bold tracking-wide">
                  Active Proposals
                </h2>
                <div className="w-fit rounded-lg border border-[#14a19f]/35 bg-[#14a19f]/10 px-3 py-1.5 text-xs font-semibold text-[#8ff6f3]">
                  {activeProposals.length} live
                </div>
              </div>

              <div className="space-y-4">
                {loadingProposals ? (
                  <>
                    <div className="h-44 animate-pulse rounded-2xl border border-[#14a19f]/12 bg-[#0f1730]/55" />
                    <div className="h-44 animate-pulse rounded-2xl border border-[#14a19f]/12 bg-[#0f1730]/55" />
                  </>
                ) : activeProposals.length > 0 ? (
                  activeProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onCopyProposalId={handleCopyProposalId}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-400" style={robotoStyle}>
                    No active proposals right now. Past governance decisions are listed below.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-4 backdrop-blur-md sm:p-5 md:p-6">
                <div className="mb-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-white text-lg font-semibold" style={robotoStyle}>
                      Awaiting Governance Action
                    </h3>
                    <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-300">
                      {reviewProposals.length} review
                    </span>
                  </div>

                  <div className="space-y-3">
                    {reviewProposals.length > 0 ? (
                      reviewProposals.map((proposal) => (
                        <ReviewProposalRow
                          key={proposal.id}
                          proposal={proposal}
                          onCopyProposalId={handleCopyProposalId}
                          onProposalAction={handleReviewProposalAction}
                          isSubmitting={submittingReviewAction === `queue-${proposal.id}` || submittingReviewAction === `execute-${proposal.id}`}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-400" style={robotoStyle}>
                        Proposals that passed voting and still need queue or execution will appear here.
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-white text-lg font-semibold" style={robotoStyle}>
                      Past Proposals
                    </h3>
                    <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-300">
                      {pastProposals.length} closed
                    </span>
                  </div>

                  <div className="space-y-3">
                    {loadingProposals ? (
                      <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
                    ) : pastProposals.length > 0 ? (
                      pastProposals.slice(0, 8).map((proposal) => (
                        <PastProposalRow
                          key={proposal.id}
                          proposal={proposal}
                          onCopyProposalId={handleCopyProposalId}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-400" style={robotoStyle}>
                        Closed proposals will appear here once governance history is indexed.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <DelegatedTokenCard
                  delegatedAmount={balances.votes}
                  availableAmount={balances.governance}
                  delegateeLabel="Choose a delegate to activate voting power."
                  onDelegate={handlehandleDelegateGovToken}
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-5 backdrop-blur-md">
                    <h3 className="text-white text-lg font-semibold mb-3" style={robotoStyle}>
                      Your Activity
                    </h3>
                    {recentActivity.length > 0 ? (
                      <ul className="space-y-2.5">
                        {recentActivity.map((entry, index) => (
                          <li
                            key={`${entry.key}-${index}`}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm text-gray-300 wrap-break-word leading-5">
                                {entry.item.replace(`#${entry.proposalId}`, `#${sliceProposalId(entry.proposalId)}`)}
                              </p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-fit rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium ${entry.color}`}
                                >
                                  {entry.outcome}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyProposalId(entry.proposalId)}
                                  className="inline-flex items-center justify-center rounded-md border border-[#14a19f]/30 bg-[#14a19f]/10 p-1 text-[#7df3f0] transition-colors hover:bg-[#14a19f]/20 hover:text-white"
                                  aria-label={`Copy proposal id ${entry.proposalId}`}
                                >
                                  <Copy size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/proposal/${entry.proposalId}`)}
                                  className="inline-flex items-center gap-1 rounded-md border border-[#14a19f]/30 bg-[#14a19f]/10 px-2 py-1 text-[11px] font-medium text-[#7df3f0] transition-colors hover:bg-[#14a19f]/20"
                                >
                                  Open <ArrowUpRight size={12} />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-gray-400" style={robotoStyle}>
                        No personal governance activity found yet. Create or vote on a proposal to see it here.
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-5 backdrop-blur-md">
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          </div>
        </div>
      </div>
    </>
  );
}