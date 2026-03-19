import React, { useEffect, useMemo, useState } from "react";
import { BrowserProvider, JsonRpcProvider } from "ethers";
import {
  ArrowLeft,
  Bot,
  CircleAlert,
  CircleDot,
  Clock3,
  FileCode2,
  FileText,
  Gavel,
  CheckCircle2,
  Sparkles,
  Target,
  Vote,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { useTokenBalance } from "../contexts/TokenBalanceContext.jsx";
import api from "../utils/api";
import {
  executeProposal,
  fetchProposalQuorum,
  fetchProposalState,
  queueProposal,
  submitProposalVote,
} from "../utils/governance_actions.js";

const robotoStyle = { fontFamily: "Roboto, sans-serif" };
const ESTIMATED_BLOCK_SECONDS = 2;
const rpcUrl = import.meta.env.VITE_RPC_URL;

const createReadProvider = () => {
  if (window.ethereum) {
    return new BrowserProvider(window.ethereum);
  }

  if (rpcUrl) {
    return new JsonRpcProvider(rpcUrl);
  }

  return null;
};

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatProposalStatus = (status) => {
  const normalized = status?.trim?.();
  if (!normalized) {
    return "Unknown";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

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

const normalizeBackendProposalStatus = (status) => {
  const normalized = formatProposalStatus(status);

  if (normalized === "Created") {
    return "Pending";
  }

  if (normalized === "Cancelled") {
    return "Canceled";
  }

  return normalized;
};

const hydrateProposalWithStatus = async (proposal) => {
  if (!proposal) {
    return proposal;
  }

  const fallbackStatus = normalizeBackendProposalStatus(proposal.status);
  const provider = createReadProvider();

  if (!provider || (!proposal?.id && proposal?.id !== 0)) {
    return { ...proposal, status: fallbackStatus };
  }

  const stateResult = await fetchProposalState(provider, proposal.id);
  const onchainStatus = stateResult?.success ? mapOnchainProposalState(stateResult.state) : null;

  return {
    ...proposal,
    status: onchainStatus || fallbackStatus,
  };
};

const shortenAddress = (value) => {
  if (!value) {
    return "Unavailable";
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const aggregateProposalVotes = (votes = []) =>
  votes.reduce(
    (totals, vote) => {
      const weight = toSafeNumber(vote?.weight);
      const support = toSafeNumber(vote?.support);

      if (support === 0) totals.against += weight;
      if (support === 1) totals.for += weight;
      if (support === 2) totals.abstain += weight;

      totals.total += weight;
      return totals;
    },
    { total: 0, for: 0, against: 0, abstain: 0 },
  );

const splitDescription = (description) => {
  const lines = (description || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    title: lines[0] || "Untitled Proposal",
    summary: lines[1] || "Governance proposal awaiting review.",
    body:
      lines.slice(1).join("\n") || description || "No proposal description available.",
  };
};

const getIpfsGatewayUrl = (value) => {
  const normalized = value?.trim?.();
  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${normalized.replace("ipfs://", "")}`;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  return "";
};

const renderDescriptionBody = (body, tones) => {
  const lines = (body || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return (
      <p className={`text-sm leading-7 ${tones.body}`} style={robotoStyle}>
        No proposal description available.
      </p>
    );
  }

  return lines.map((line, index) => {
    const parts = line.split(":");
    const value = parts.length > 1 ? parts.slice(1).join(":").trim() : "";
    const ipfsUrl = getIpfsGatewayUrl(value);

    if (ipfsUrl) {
      return (
        <p key={`${line}-${index}`} className={`text-sm leading-7 ${tones.body}`} style={robotoStyle}>
          <span>{parts[0]}: </span>
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
          >
            {value}
          </a>
        </p>
      );
    }

    return (
      <p key={`${line}-${index}`} className={`text-sm leading-7 ${tones.body}`} style={robotoStyle}>
        {line}
      </p>
    );
  });
};

const extractDescriptionFields = (body) => {
  return (body || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((fields, line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return fields;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key && value) {
        fields[key] = value;
      }

      return fields;
    }, {});
};

const getVoteShare = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

const formatDateTime = (value) => {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

const estimateBlockDate = (targetBlock, currentBlock, currentTimestampSeconds) => {
  const normalizedTarget = toSafeNumber(targetBlock);
  const normalizedCurrent = toSafeNumber(currentBlock);
  const normalizedTimestamp = toSafeNumber(currentTimestampSeconds);

  if (!normalizedTarget || !normalizedCurrent || !normalizedTimestamp) {
    return null;
  }

  const secondsDelta = (normalizedTarget - normalizedCurrent) * ESTIMATED_BLOCK_SECONDS;
  return new Date((normalizedTimestamp + secondsDelta) * 1000);
};

const getVoteButtonTone = (type) => {
  if (type === "for") {
    return "bg-emerald-500 hover:bg-emerald-400 text-white";
  }

  if (type === "against") {
    return "bg-rose-500 hover:bg-rose-400 text-white";
  }

  return "bg-sky-500 hover:bg-sky-400 text-white";
};

const buildSummary = (proposal, details, voteTotals, isProposer, timeline) => {
  const summaryBits = [];

  summaryBits.push(details.summary);
  summaryBits.push(`Status: ${formatProposalStatus(proposal?.status)}.`);

  if (timeline.voteStartAt) {
    summaryBits.push(`Voting starts around ${formatDateTime(timeline.voteStartAt)}.`);
  }

  if (timeline.voteEndAt) {
    summaryBits.push(`Voting ends around ${formatDateTime(timeline.voteEndAt)}.`);
  }

  if (voteTotals.total > 0) {
    summaryBits.push(
      `Current weighted votes are ${voteTotals.for} for, ${voteTotals.against} against, and ${voteTotals.abstain} abstain.`,
    );
  } else {
    summaryBits.push("No votes have been indexed yet.");
  }

  if (proposal?.targets?.length) {
    summaryBits.push(`This proposal contains ${proposal.targets.length} executable action(s).`);
  }

  if (isProposer) {
    summaryBits.push("This wallet is the proposer, so monitoring the live vote window is the main next step.");
  } else {
    summaryBits.push("Review the execution payload before voting.");
  }

  return summaryBits.join(" ");
};

const getTimelineSteps = (status, timeline) => {
  const normalized = status?.toLowerCase?.() || "";

  return [
    {
      key: "created",
      label: "Created",
      caption: "Proposal published",
      state: "done",
    },
    {
      key: "voting",
      label: "Voting",
      caption: timeline.isActiveWindow
        ? "Live now"
        : timeline.hasVotingEnded
          ? "Voting completed"
          : "Awaiting start",
      state: timeline.isActiveWindow || timeline.hasVotingEnded ? "done" : "active",
    },
    {
      key: "outcome",
      label: "Outcome",
      caption:
        normalized === "succeeded"
          ? "Proposal passed"
          : normalized === "defeated"
            ? "Proposal rejected"
            : normalized === "active"
              ? "Pending result"
              : "Result pending",
      state:
        normalized === "succeeded" || normalized === "defeated" || normalized === "queued" || normalized === "executed"
          ? "done"
          : "idle",
    },
    {
      key: "queue",
      label: "Queue",
      caption:
        normalized === "queued" || normalized === "executed"
          ? "Queued"
          : normalized === "succeeded"
            ? "Ready to queue"
            : "Not ready",
      state:
        normalized === "queued" || normalized === "executed"
          ? "done"
          : normalized === "succeeded"
            ? "active"
            : "idle",
    },
    {
      key: "execute",
      label: "Execute",
      caption:
        normalized === "executed"
          ? "Executed"
          : normalized === "queued"
            ? "Ready to execute"
            : normalized === "defeated"
              ? "Closed"
              : "Pending",
      state:
        normalized === "executed"
          ? "done"
          : normalized === "queued"
            ? "active"
            : "idle",
    },
  ];
};

function SectionCard({ title, icon: Icon, children, aside, tones }) {
  return (
    <section className={`rounded-[26px] border p-4 md:p-5 backdrop-blur-sm shadow-[0_12px_40px_rgba(3,8,20,0.14)] ${tones.card}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${tones.iconWrap}`}>
            <Icon size={16} />
          </div>
          <h2 className={`text-base font-semibold ${tones.title}`}>{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function MetricTile({ label, value, hint, tones }) {
  return (
    <div className={`rounded-2xl border px-3.5 py-3 ${tones.tile}`}>
      <p className={`text-[10px] uppercase tracking-[0.18em] ${tones.muted}`}>{label}</p>
      <p className={`mt-1.5 text-sm font-semibold ${tones.title}`}>{value}</p>
      {hint ? (
        <p className={`mt-1 text-[11px] ${tones.muted}`} style={robotoStyle}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function VoteStat({ label, value, total, accentClass, barClass, tones }) {
  const share = getVoteShare(value, total);

  return (
    <div className={`rounded-2xl border p-3 ${tones.tile}`}>
      <div className="flex items-center justify-between text-xs">
        <span className={tones.muted}>{label}</span>
        <span className={tones.title}>{share}%</span>
      </div>
      <p className={`mt-2 text-lg font-semibold ${accentClass}`}>{value}</p>
      <div className={`mt-3 h-1.5 rounded-full ${tones.progressTrack}`}>
        <div className={`h-1.5 rounded-full ${barClass}`} style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

function LoadingSkeleton({ tones, pageTone }) {
  return (
    <div className={`min-h-screen overflow-x-hidden px-4 py-6 md:px-8 md:py-8 ${pageTone}`}>
      <div className="mx-auto max-w-6xl space-y-4">
        <div className={`h-44 rounded-[28px] border animate-pulse ${tones.loading}`} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-4">
            <div className={`h-52 rounded-[26px] border animate-pulse ${tones.loading}`} />
            <div className={`h-72 rounded-[26px] border animate-pulse ${tones.loading}`} />
          </div>
          <div className="space-y-4">
            <div className={`h-52 rounded-[26px] border animate-pulse ${tones.loading}`} />
            <div className={`h-72 rounded-[26px] border animate-pulse ${tones.loading}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Proposal() {
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  const balances = useTokenBalance();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chainSnapshot, setChainSnapshot] = useState({
    blockNumber: 0,
    timestampSeconds: 0,
  });
  const [submittingVote, setSubmittingVote] = useState("");
  const [voteError, setVoteError] = useState("");
  const [voteNotice, setVoteNotice] = useState("");
  const [submittingAction, setSubmittingAction] = useState("");
  const [quorum, setQuorum] = useState("0");

  const tones = useMemo(
    () => ({
      page: "dark:bg-[#0f111d] bg-[#161c32]",
      glowA: "from-[#17323b] via-[#10253a] to-[#0b1320] opacity-25",
      glowB: "from-[#123637] via-[#101d34] to-[#0b1320] opacity-20",
      overlay:
        "bg-[radial-gradient(circle_at_top,rgba(36,210,207,0.08),transparent_36%),linear-gradient(180deg,rgba(11,18,36,0.1),rgba(7,12,24,0.28))]",
      hero: "border-[#14a19f]/16 bg-[#0d1224]/64",
      card: "border-[#14a19f]/14 bg-[#0b1322]/78",
      tile: "border-white/8 bg-white/[0.04]",
      muted: "text-gray-400",
      title: "text-white",
      body: "text-gray-300",
      summary: "text-gray-400",
      iconWrap: "border-[#14a19f]/18 bg-[#14a19f]/10 text-[#8ff6f3]",
      chip: "border-white/10 bg-white/5 text-gray-300",
      actionChip: "border-[#14a19f]/20 bg-[#14a19f]/10 text-[#8ff6f3]",
      progressTrack: "bg-[#16213b]",
      panelSoft: "border-white/6 bg-[#0a1020]",
      loading: "border-[#14a19f]/12 bg-[#0d1224]/60",
      notice: "border-[#14a19f]/14 bg-[#14a19f]/8 text-[#8ff6f3]",
    }),
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchProposal = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/api/governance/proposal/${id}`);

        if (!isMounted) {
          return;
        }

        const nextProposal = await hydrateProposalWithStatus(response?.data?.proposal || null);
        setProposal(nextProposal);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setError(
          fetchError?.response?.data?.message ||
            fetchError?.message ||
            "Failed to load proposal.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProposal();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const fetchChainSnapshot = async () => {
      const provider = createReadProvider();

      if (!provider) {
        return;
      }

      try {
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);

        if (!isMounted) {
          return;
        }

        setChainSnapshot({
          blockNumber: Number(blockNumber),
          timestampSeconds: Number(block?.timestamp || 0),
        });
      } catch (snapshotError) {
        console.error("Failed to estimate proposal timestamps:", snapshotError);
      }
    };

    fetchChainSnapshot();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchQuorum = async () => {
      if (!proposal?.voteStart) {
        return;
      }

      try {
        const provider = createReadProvider();

        if (!provider) {
          return;
        }

        const result = await fetchProposalQuorum(provider, proposal.voteStart);

        if (!isMounted || !result?.success) {
          return;
        }

        setQuorum(result.quorum || "0");
      } catch (quorumError) {
        console.error("Failed to fetch proposal quorum:", quorumError);
      }
    };

    fetchQuorum();

    return () => {
      isMounted = false;
    };
  }, [proposal?.voteStart]);

  const details = splitDescription(proposal?.description || "");
  const voteTotals = aggregateProposalVotes(proposal?.votes || []);
  const totalActions = proposal?.targets?.length || 0;
  const statusLabel = formatProposalStatus(proposal?.status);
  const isProposer =
    proposal?.proposer && address
      ? proposal.proposer.toLowerCase() === address.toLowerCase()
      : false;
  const existingVote = address
    ? (proposal?.votes || []).find(
        (vote) => vote?.voter?.toLowerCase?.() === address.toLowerCase(),
      )
    : null;
  const existingVoteSupport = toSafeNumber(existingVote?.support);
  const existingVoteLabel =
    existingVoteSupport === 1
      ? "For"
      : existingVoteSupport === 0
        ? "Against"
        : existingVoteSupport === 2
          ? "Abstain"
          : "Recorded";

  const timeline = useMemo(() => {
    const voteStartAt = estimateBlockDate(
      proposal?.voteStart,
      chainSnapshot.blockNumber,
      chainSnapshot.timestampSeconds,
    );
    const voteEndAt = estimateBlockDate(
      proposal?.voteEnd,
      chainSnapshot.blockNumber,
      chainSnapshot.timestampSeconds,
    );
    const currentBlock = toSafeNumber(chainSnapshot.blockNumber);
    const voteStartBlock = toSafeNumber(proposal?.voteStart);
    const voteEndBlock = toSafeNumber(proposal?.voteEnd);
    const hasVotingBegun = voteStartBlock > 0 && currentBlock >= voteStartBlock;
    const hasVotingEnded = voteEndBlock > 0 && currentBlock >= voteEndBlock;
    const isActiveWindow = hasVotingBegun && !hasVotingEnded;

    return {
      voteStartAt,
      voteEndAt,
      hasVotingBegun,
      hasVotingEnded,
      isActiveWindow,
    };
  }, [chainSnapshot.blockNumber, chainSnapshot.timestampSeconds, proposal?.voteEnd, proposal?.voteStart]);

  const summary = buildSummary(proposal, details, voteTotals, isProposer, timeline);
  const descriptionFields = extractDescriptionFields(details.body);
  const isDisputeProposal = Boolean(
    descriptionFields["Evidence IPFS"] || descriptionFields["Reason IPFS"] || descriptionFields["Work Proof 1"],
  );
  const timelineSteps = getTimelineSteps(proposal?.status, timeline);
  const quorumValue = toSafeNumber(quorum);
  const quorumProgress = quorumValue > 0 ? Math.min(100, Math.round((voteTotals.total / quorumValue) * 100)) : 0;
  const votesNeededForQuorum = Math.max(quorumValue - voteTotals.total, 0);

  const refreshProposal = async () => {
    const response = await api.get(`/api/governance/proposal/${id}`);
    const nextProposal = await hydrateProposalWithStatus(response?.data?.proposal || null);
    setProposal(nextProposal);
  };

  const handleVote = async (support, label) => {
    if (!window.ethereum || !proposal?.id) {
      setVoteError("Wallet provider not available.");
      return;
    }

    try {
      setSubmittingVote(label);
      setVoteError("");
      setVoteNotice("");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const result = await submitProposalVote(signer, proposal.id, support);

      if (!result?.success) {
        throw new Error(result?.error || "Failed to submit vote.");
      }

      setVoteNotice(`${label} vote submitted successfully.`);
      await refreshProposal();
    } catch (submitError) {
      console.error("Governance vote failed:", submitError);
      setVoteError(
        submitError?.reason ||
          submitError?.shortMessage ||
          submitError?.message ||
          "Failed to submit vote.",
      );
    } finally {
      setSubmittingVote("");
    }
  };

  const handleProposalAction = async (actionType) => {
    if (!window.ethereum || !proposal?.description) {
      setVoteError("Wallet provider or proposal data not available.");
      return;
    }

    try {
      setSubmittingAction(actionType);
      setVoteError("");
      setVoteNotice("");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const result =
        actionType === "queue"
          ? await queueProposal(signer, proposal)
          : await executeProposal(signer, proposal);

      if (!result?.success) {
        throw new Error(result?.error || `Failed to ${actionType} proposal.`);
      }

      setVoteNotice(
        actionType === "queue"
          ? "Proposal queued successfully."
          : "Proposal executed successfully.",
      );
      await refreshProposal();
    } catch (actionError) {
      console.error(`Governance ${actionType} failed:`, actionError);
      setVoteError(
        actionError?.reason ||
          actionError?.shortMessage ||
          actionError?.message ||
          `Failed to ${actionType} proposal.`,
      );
    } finally {
      setSubmittingAction("");
    }
  };

  if (loading) {
    return <LoadingSkeleton tones={tones} pageTone={tones.page} />;
  }

  if (error || !proposal) {
    return (
      <div className={`min-h-screen overflow-x-hidden px-4 py-8 md:px-8 ${tones.page}`}>
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/20 bg-[#0d1224]/75 p-6 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
            <CircleAlert size={22} />
          </div>
          <h1 className={`text-xl font-semibold ${tones.title}`}>Unable to load proposal</h1>
          <p className={`mt-3 text-sm ${tones.summary}`} style={robotoStyle}>
            {error || "Proposal not found."}
          </p>
          <Link
            to="/governance"
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border bg-cyan-500/20 text-cyan-300 border-cyan-500/35`}
          >
            
            Back to governance
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-hidden px-4 py-6 md:px-8 md:py-8 ${tones.page}`}>
      <div className={`pointer-events-none fixed right-[6%] top-[7%] h-[260px] w-[260px] rounded-full blur-3xl mix-blend-screen ${tones.glowA}`} />
      <div className={`pointer-events-none fixed left-[4%] bottom-[6%] h-[280px] w-[280px] rounded-full blur-3xl mix-blend-screen ${tones.glowB}`} />
      <div className={`pointer-events-none fixed inset-0 ${tones.overlay}`} />

      <main className="relative z-10 mx-auto max-w-6xl">
        <section className={`rounded-[30px] border p-5 backdrop-blur-md md:p-6 ${tones.hero}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/governance"
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border bg-cyan-500/20 text-cyan-300 border-cyan-500/35`}
            >
      
              Back to governance
            </Link>

            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${proposal?.status?.toLowerCase?.() === "active" ? tones.actionChip : tones.chip}`}>
              <CircleDot size={12} />
              {statusLabel}
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#14a19f]">
                Proposal #{proposal.id || id}
              </p>
              <h1 className={`mt-2 max-w-3xl text-3xl font-bold leading-tight md:text-4xl ${tones.title}`}>
                {details.title}
              </h1>
              <p className={`mt-3 max-w-3xl text-sm md:text-base ${tones.summary}`} style={robotoStyle}>
                {details.summary}
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <span className={`rounded-full border px-3 py-1 text-xs ${tones.actionChip}`}>
                  {totalActions} action{totalActions === 1 ? "" : "s"}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs ${tones.chip}`}>
                  {voteTotals.total} weighted votes
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs ${tones.chip}`}>
                  {timeline.voteEndAt ? `Ends ${formatDateTime(timeline.voteEndAt)}` : "Vote date unavailable"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricTile
                label="Proposer"
                value={shortenAddress(proposal.proposer)}
                hint={isProposer ? "Current wallet is proposer" : "Origin wallet"}
                tones={tones}
              />
              <MetricTile
                label="Voting Opens"
                value={timeline.voteStartAt ? formatDateTime(timeline.voteStartAt) : "Estimating"}
                tones={tones}
              />
              <MetricTile
                label="Voting Closes"
                value={timeline.voteEndAt ? formatDateTime(timeline.voteEndAt) : "Estimating"}
                tones={tones}
              />
              <MetricTile
                label="Updated"
                value={proposal.updatedAt || "Unavailable"}
                tones={tones}
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-1">
            <div className="flex min-w-[760px] items-center gap-3">
              {timelineSteps.map((step, index) => {
                const isDone = step.state === "done";
                const isActive = step.state === "active";

                return (
                  <React.Fragment key={step.key}>
                    <div className="min-w-[132px] flex-1">
                      <div
                        className={`rounded-2xl border px-3 py-3 transition-all duration-500 ${
                          isDone
                            ? "border-[#14a19f]/25 bg-[#14a19f]/10"
                            : isActive
                              ? "border-cyan-400/30 bg-cyan-400/8 shadow-[0_0_18px_rgba(34,211,238,0.12)]"
                              : "border-white/8 bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                              isDone
                                ? "border-[#14a19f]/30 bg-[#14a19f] text-white"
                                : isActive
                                  ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-300 animate-pulse"
                                  : "border-white/10 bg-white/5 text-gray-500"
                            }`}
                          >
                            {step.key === "outcome" && proposal?.status?.toLowerCase?.() === "defeated" ? (
                              <XCircle size={15} />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${tones.title}`}>{step.label}</p>
                            <p className={`text-[11px] ${tones.muted}`} style={robotoStyle}>
                              {step.caption}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {index < timelineSteps.length - 1 ? (
                      <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/8">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full ${
                            isDone
                              ? "w-full bg-gradient-to-r from-[#14a19f] to-[#2bd4d1]"
                              : isActive
                                ? "w-2/3 bg-gradient-to-r from-cyan-400/80 via-cyan-300 to-transparent animate-pulse"
                                : "w-0"
                          }`}
                        />
                      </div>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-4">
            <SectionCard title="Proposal Overview" icon={FileText} tones={tones}>
              <div className="space-y-4">
                {isDisputeProposal ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className={`rounded-2xl border p-3 ${tones.tile}`}>
                      <p className={`text-[10px] uppercase tracking-[0.16em] ${tones.muted}`}>Raised by</p>
                      <p className={`mt-2 break-all text-sm ${tones.title}`}>{descriptionFields["Raised by"] || "Unavailable"}</p>
                    </div>
                    <div className={`rounded-2xl border p-3 ${tones.tile}`}>
                      <p className={`text-[10px] uppercase tracking-[0.16em] ${tones.muted}`}>Requested winner</p>
                      <p className={`mt-2 break-all text-sm ${tones.title}`}>{descriptionFields["Requested winner"] || "Unavailable"}</p>
                    </div>
                    <div className={`rounded-2xl border p-3 ${tones.tile}`}>
                      <p className={`text-[10px] uppercase tracking-[0.16em] ${tones.muted}`}>Client</p>
                      <p className={`mt-2 break-all text-sm ${tones.title}`}>{descriptionFields.Client || "Unavailable"}</p>
                    </div>
                    <div className={`rounded-2xl border p-3 ${tones.tile}`}>
                      <p className={`text-[10px] uppercase tracking-[0.16em] ${tones.muted}`}>Freelancer</p>
                      <p className={`mt-2 break-all text-sm ${tones.title}`}>{descriptionFields.Freelancer || "Unavailable"}</p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1.5">{renderDescriptionBody(details.body, tones)}</div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className={`rounded-2xl border p-3 ${tones.tile}`}>
                    <p className={`text-xs ${tones.muted}`}>What changes</p>
                    <p className={`mt-2 text-sm ${tones.title}`}>Governance logic or treasury behavior</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${tones.tile}`}>
                    <p className={`text-xs ${tones.muted}`}>Who should review</p>
                    <p className={`mt-2 text-sm ${tones.title}`}>Delegates, proposers, and active voters</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${tones.tile}`}>
                    <p className={`text-xs ${tones.muted}`}>Decision surface</p>
                    <p className={`mt-2 text-sm ${tones.title}`}>Vote outcome plus executable actions</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Execution Payload"
              icon={FileCode2}
              tones={tones}
              aside={
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${tones.chip}`}>
                  On-chain actions
                </span>
              }
            >
              <div className="space-y-3">
                {totalActions > 0 ? (
                  proposal.targets.map((target, index) => (
                    <div key={`${target}-${index}`} className={`rounded-2xl border p-3.5 ${tones.tile}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={`text-[11px] uppercase tracking-[0.16em] ${tones.muted}`}>
                          Action {index + 1}
                        </p>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] ${tones.actionChip}`}>
                          Value {proposal?.values?.[index] || "0"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className={`rounded-xl border p-3 ${tones.panelSoft}`}>
                          <p className={`text-[10px] uppercase tracking-[0.14em] ${tones.muted}`}>Target</p>
                          <p className={`mt-2 break-all text-sm ${tones.title}`}>{target || "No target"}</p>
                        </div>
                        <div className={`rounded-xl border p-3 ${tones.panelSoft}`}>
                          <p className={`text-[10px] uppercase tracking-[0.14em] ${tones.muted}`}>Signature</p>
                          <p className={`mt-2 break-all text-sm ${tones.title}`}>
                            {proposal?.signatures?.[index] || "Direct calldata"}
                          </p>
                        </div>
                      </div>

                      <div className={`mt-3 rounded-xl border p-3 ${tones.panelSoft}`}>
                        <p className={`text-[10px] uppercase tracking-[0.14em] ${tones.muted}`}>Calldata</p>
                        <p className={`mt-2 break-all text-xs leading-6 ${tones.body}`} style={robotoStyle}>
                          {proposal?.calldatas?.[index] || "No calldata indexed"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`rounded-2xl border px-3 py-3 text-sm ${tones.tile} ${tones.muted}`}>
                    No executable actions were returned for this proposal.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard title="Voting Snapshot" icon={Vote} tones={tones}>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <VoteStat
                    label="For"
                    value={voteTotals.for}
                    total={voteTotals.total}
                    accentClass="text-emerald-400"
                    barClass="bg-emerald-400"
                    tones={tones}
                  />
                  <VoteStat
                    label="Against"
                    value={voteTotals.against}
                    total={voteTotals.total}
                    accentClass="text-rose-400"
                    barClass="bg-rose-400"
                    tones={tones}
                  />
                  <VoteStat
                    label="Abstain"
                    value={voteTotals.abstain}
                    total={voteTotals.total}
                    accentClass="text-sky-400"
                    barClass="bg-sky-400"
                    tones={tones}
                  />
                </div>

                <div className={`rounded-2xl border p-3.5 text-sm ${tones.tile}`}>
                  <div className={`flex items-center justify-between ${tones.muted}`}>
                    <span>Total weighted participation</span>
                    <span className={tones.title}>{voteTotals.total}</span>
                  </div>
                  <div className={`mt-2 flex items-center justify-between ${tones.muted}`}>
                    <span>Unique voters indexed</span>
                    <span className={tones.title}>{proposal?.votes?.length || 0}</span>
                  </div>
                  <div className={`mt-2 flex items-center justify-between ${tones.muted}`}>
                    <span>Quorum target</span>
                    <span className={tones.title}>{quorumValue || "Unavailable"}</span>
                  </div>
                </div>

                <div className={`rounded-2xl border p-3.5 text-sm ${tones.tile}`}>
                  <div className={`mb-2 flex items-center justify-between ${tones.muted}`}>
                    <span>Quorum progress</span>
                    <span className={tones.title}>{quorumProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#16213b]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#14a19f] to-[#2bd4d1] transition-all duration-500"
                      style={{ width: `${quorumProgress}%` }}
                    />
                  </div>
                  <div className={`mt-3 flex items-center justify-between ${tones.muted}`}>
                    <span>Votes needed for quorum</span>
                    <span className={tones.title}>{votesNeededForQuorum}</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Vote On Proposal" icon={Gavel} tones={tones}>
              <div className="space-y-3">
                <div className={`rounded-2xl border p-3.5 ${tones.tile}`}>
                  <p className={`text-xs uppercase tracking-[0.16em] ${tones.muted}`}>Voting window</p>
                  <p className={`mt-2 text-sm ${tones.title}`} style={robotoStyle}>
                    {timeline.voteStartAt ? formatDateTime(timeline.voteStartAt) : "Estimating start"} to{" "}
                    {timeline.voteEndAt ? formatDateTime(timeline.voteEndAt) : "estimating end"}
                  </p>
                  <p className={`mt-2 text-xs ${tones.muted}`} style={robotoStyle}>
                    {timeline.isActiveWindow
                      ? "Voting is currently active."
                      : timeline.hasVotingEnded
                        ? "Voting window has ended."
                        : "Voting has not started yet."}
                  </p>
                </div>

                {voteNotice ? (
                  <div className={`rounded-2xl border px-3 py-2 text-sm ${tones.notice}`}>
                    {voteNotice}
                  </div>
                ) : null}

                {voteError ? (
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/8 px-3 py-2 text-sm text-red-300">
                    {voteError}
                  </div>
                ) : null}

                {timeline.isActiveWindow && existingVote ? (
                  <div className={`rounded-2xl border px-3 py-3 ${tones.notice}`}>
                    <p className="text-sm font-semibold">You already voted</p>
                    <p className="mt-1 text-xs" style={robotoStyle}>
                      This wallet has already submitted a <span className="font-semibold">{existingVoteLabel}</span> vote for this proposal.
                    </p>
                  </div>
                ) : null}

                {timeline.isActiveWindow && !existingVote ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => handleVote(1, "For")}
                      disabled={!isConnected || Boolean(submittingVote)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${getVoteButtonTone("for")}`}
                    >
                      {submittingVote === "For" ? "Submitting..." : "Vote For"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(0, "Against")}
                      disabled={!isConnected || Boolean(submittingVote)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${getVoteButtonTone("against")}`}
                    >
                      {submittingVote === "Against" ? "Submitting..." : "Vote Against"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(2, "Abstain")}
                      disabled={!isConnected || Boolean(submittingVote)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${getVoteButtonTone("abstain")}`}
                    >
                      {submittingVote === "Abstain" ? "Submitting..." : "Abstain"}
                    </button>
                  </div>
                ) : null}

                {proposal?.status?.toLowerCase?.() === "succeeded" ? (
                  <button
                    type="button"
                    onClick={() => handleProposalAction("queue")}
                    disabled={!isConnected || Boolean(submittingAction)}
                    className="w-full rounded-2xl bg-[#14a19f] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1ecac7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingAction === "queue" ? "Queueing..." : "Queue Proposal"}
                  </button>
                ) : null}

                {proposal?.status?.toLowerCase?.() === "queued" ? (
                  <button
                    type="button"
                    onClick={() => handleProposalAction("execute")}
                    disabled={!isConnected || Boolean(submittingAction)}
                    className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingAction === "execute" ? "Executing..." : "Execute Proposal"}
                  </button>
                ) : null}

                {proposal?.status?.toLowerCase?.() === "defeated" ? (
                  <div className="rounded-2xl border border-red-400/18 bg-red-500/8 px-3 py-3 text-sm text-red-300">
                    This proposal failed. No further governance action is available from this page.
                  </div>
                ) : null}

                {!isConnected ? (
                  <p className={`text-xs ${tones.muted}`} style={robotoStyle}>
                    Connect your wallet to vote when the proposal enters its active window.
                  </p>
                ) : null}
              </div>
            </SectionCard>

          </div>
        </section>

        <section className="mt-4">
          <SectionCard title="Summary" icon={Bot} tones={tones}>
            <div className={`rounded-2xl border p-4 ${tones.notice}`}>
              <div className="flex items-center gap-2">
                <Sparkles size={15} />
                <span className="text-xs uppercase tracking-[0.16em]">Assistant Brief</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-gray-200" style={robotoStyle}>
                {summary}
              </p>
            </div>

            <div className="mt-3 grid gap-2.5 md:grid-cols-2">
              <div className={`flex items-start gap-3 rounded-2xl border p-3 ${tones.tile}`}>
                <Target size={16} className="mt-0.5 text-[#14a19f]" />
                <div>
                  <p className={`text-sm font-medium ${tones.title}`}>Review target contracts</p>
                  <p className={`mt-1 text-xs leading-6 ${tones.summary}`} style={robotoStyle}>
                    Verify each target and signature before relying on the summary alone.
                  </p>
                </div>
              </div>

              <div className={`flex items-start gap-3 rounded-2xl border p-3 ${tones.tile}`}>
                <Clock3 size={16} className="mt-0.5 text-[#14a19f]" />
                <div>
                  <p className={`text-sm font-medium ${tones.title}`}>Track the vote schedule</p>
                  <p className={`mt-1 text-xs leading-6 ${tones.summary}`} style={robotoStyle}>
                    The displayed dates are estimated from the current block and chain time.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </section>
      </main>
    </div>
  );
}

export default Proposal;
