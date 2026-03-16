import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import {
  Award,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import api from "../../utils/api.js";
import NoticeToast from "../../components/NoticeToast.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
const robotoStyle = { fontFamily: "Roboto, sans-serif" };

function StatusPill({ tone, label }) {
  const styles = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    danger: "border-red-500/30 bg-red-500/10 text-red-200",
    neutral: "border-white/10 bg-white/5 text-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${styles[tone] || styles.neutral}`}
    >
      {label}
    </span>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <div className="border border-white/10 bg-[#111827]/70 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-gray-400">{detail}</div>
    </div>
  );
}

function StepRow({ title, detail, active, complete }) {
  return (
    <div className="grid grid-cols-[32px_1fr] gap-3 border-t border-white/8 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="pt-0.5">
        <div
          className={`flex h-8 w-8 items-center justify-center border text-xs font-semibold ${
            complete
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : active
                ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                : "border-white/10 bg-white/5 text-gray-500"
          }`}
        >
          {complete ? <CheckCircle2 size={15} /> : active ? <Clock3 size={15} /> : "·"}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{title}</p>
          {complete ? <StatusPill tone="success" label="Complete" /> : null}
          {!complete && active ? <StatusPill tone="warning" label="Active" /> : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-gray-400">{detail}</p>
      </div>
    </div>
  );
}

function ActivityItem({ title, meta, tone }) {
  const dot = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-red-400",
    neutral: "bg-sky-400",
  };

  return (
    <div className="flex items-start gap-3 border-t border-white/8 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className={`mt-2 h-2 w-2 rounded-full ${dot[tone] || dot.neutral}`} />
      <div>
        <p className="text-sm font-medium text-gray-100">{title}</p>
        <p className="mt-1 text-xs leading-5 text-gray-400">{meta}</p>
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-3">
          <div className="h-24 border border-white/8 bg-white/5" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-24 border border-white/8 bg-white/5" />
            <div className="h-24 border border-white/8 bg-white/5" />
            <div className="h-24 border border-white/8 bg-white/5" />
          </div>
          <div className="h-72 border border-white/8 bg-white/5" />
        </div>
        <div className="space-y-3">
          <div className="h-40 border border-white/8 bg-white/5" />
          <div className="h-52 border border-white/8 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export default function MintSkillSbtPage() {
  const { skill } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { isAuthentication } = useAuth();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(
        "http://localhost:5000/api/freelancer/skill-mint-status",
        {
          params: { skill },
          withCredentials: true,
        }
      );
      setStatus(response.data);
    } catch (error) {
      setRedNotice(true);
      setNotice(
        error?.response?.data?.message || "Failed to load skill mint status."
      );
    } finally {
      setLoading(false);
    }
  }, [skill]);

  useEffect(() => {
    let timer;
    if (!isAuthentication || !isConnected || !address) {
      setRedNotice(true);
      setNotice("Wallet not connected — redirecting to home...");
      timer = window.setTimeout(() => navigate("/"), 1600);
    } else if (skill) {
      setNotice(null);
      loadStatus();
    }
    return () => window.clearTimeout(timer);
  }, [address, isAuthentication, isConnected, loadStatus, navigate, skill]);

  const skillState = status?.skill;
  const isQuizPassed = !!skillState?.quizPassed;
  const isMinted = !!skillState?.minted;
  const backendCouncilReady = !!status?.backendCouncilReady;
  const isAwaitingCouncil = isQuizPassed && !isMinted && backendCouncilReady;

  const headerState = useMemo(() => {
    if (isMinted) {
      return {
        label: "Minted On-Chain",
        tone: "success",
        message: "Council has completed issuance. Your skill credential is now live.",
      };
    }

    if (isAwaitingCouncil) {
      return {
        label: "Awaiting Council Mint",
        tone: "warning",
        message:
          "Your quiz passed. The credential is now in the council mint queue.",
      };
    }

    if (isQuizPassed && !backendCouncilReady) {
      return {
        label: "Blocked By Setup",
        tone: "danger",
        message:
          "Your result is valid, but the backend council signer is not ready yet.",
      };
    }

    return {
      label: "Quiz Required",
      tone: "neutral",
      message: "This skill must pass verification before council can mint the SBT.",
    };
  }, [backendCouncilReady, isAwaitingCouncil, isMinted, isQuizPassed]);

  const activity = [
    {
      title: isQuizPassed
        ? `Assessment passed for ${skill}`
        : `Assessment pending for ${skill}`,
      meta: isQuizPassed
        ? `AI score recorded at ${skillState?.aiScore ?? 0}/100 and stored for council review.`
        : "No successful assessment has been recorded yet for this skill.",
      tone: isQuizPassed ? "success" : "neutral",
    },
    {
      title: backendCouncilReady
        ? "Council signer available"
        : "Council signer unavailable",
      meta: backendCouncilReady
        ? "The backend is configured to process council-authorized mint actions."
        : "Council issuance cannot proceed until the backend signer is configured as a council member.",
      tone: backendCouncilReady ? "success" : "danger",
    },
    {
      title: isMinted ? "Credential minted" : "Credential not minted yet",
      meta: isMinted
        ? `Token ${skillState?.tokenId || "Unavailable"} has been issued on-chain for this skill.`
        : "The Skill SBT has not yet been issued on-chain for this wallet.",
      tone: isMinted ? "success" : isAwaitingCouncil ? "warning" : "neutral",
    },
  ];

  return (
    <>
      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

      <div className="min-h-screen bg-[#0f1724] text-white overflow-x-hidden">
        <div className="border-b border-white/8 bg-[#0b111b]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center border border-[#14a19f]/25 bg-[#14a19f]/10 text-[#8ff6f3]">
                <Award size={18} />
              </div>
              <div className="min-w-0">
                <p
                  style={orbitronStyle}
                  className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-white"
                >
                  Skill Credential Status
                </p>
                <p className="truncate text-xs text-gray-400" style={robotoStyle}>
                  {skill} · Council-issued verification flow
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusPill tone={headerState.tone} label={headerState.label} />
              <button
                onClick={loadStatus}
                disabled={loading}
                className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-100 transition-colors hover:bg-white/10 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
          {loading ? (
            <LoadingShell />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.45fr_0.92fr]">
              <div className="space-y-4">
                <section className="border border-white/10 bg-[#101827]">
                  <div className="grid gap-4 border-b border-white/8 px-4 py-4 md:grid-cols-[1.2fr_0.8fr] md:px-5">
                    <div>
                      <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-gray-500">
                        Credential Summary
                      </div>
                      <h1
                        style={orbitronStyle}
                        className="text-2xl font-semibold text-white"
                      >
                        {skill}
                      </h1>
                      <p
                        className="mt-2 max-w-2xl text-sm leading-6 text-gray-400"
                        style={robotoStyle}
                      >
                        {headerState.message}
                      </p>
                    </div>

                    <div className="border border-white/8 bg-[#0b111b] px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                        Operational Notes
                      </div>
                      <div className="mt-3 text-sm leading-6 text-gray-300">
                        Only council-authorized wallets can execute `mintSkill` on the deployed contract. Freelancers complete verification, then track issuance here.
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 px-4 py-4 md:grid-cols-3 md:px-5">
                    <MetricCard
                      label="Quiz Result"
                      value={isQuizPassed ? "Passed" : "Pending"}
                      detail={
                        isQuizPassed
                          ? "Verification threshold cleared."
                          : "Waiting for a successful quiz result."
                      }
                    />
                    <MetricCard
                      label="AI Score"
                      value={`${skillState?.aiScore ?? 0}/100`}
                      detail="Derived from the completed quiz submission."
                    />
                    <MetricCard
                      label="Council Confidence"
                      value={`${skillState?.councilConfidence ?? 0}/100`}
                      detail="Applied at issuance time by the council workflow."
                    />
                  </div>
                </section>

                <section className="border border-white/10 bg-[#101827] px-4 py-4 md:px-5">
                  <div className="flex items-center justify-between border-b border-white/8 pb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Workflow</h2>
                      <p className="mt-1 text-xs text-gray-400">
                        Real contract-backed progression from test completion to SBT issuance.
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">Updated live</div>
                  </div>

                  <div className="pt-4">
                    <StepRow
                      title="Assessment completed"
                      detail="Your answers are scored and persisted to the freelancer skill record for this credential."
                      active={isQuizPassed}
                      complete={isQuizPassed}
                    />
                    <StepRow
                      title="Council mint queue"
                      detail="A council-authorized signer reviews the passed result and prepares the on-chain mint."
                      active={isAwaitingCouncil}
                      complete={isMinted}
                    />
                    <StepRow
                      title="Skill SBT issued"
                      detail={
                        isMinted
                          ? `Token ${skillState?.tokenId || "Unavailable"} is now linked to this skill.`
                          : "The credential is not minted on-chain yet."
                      }
                      active={false}
                      complete={isMinted}
                    />
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <section className="border border-white/10 bg-[#101827]">
                  <div className="border-b border-white/8 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-white">Current Status</h2>
                        <p className="mt-1 text-xs text-gray-400">
                          The most important state for this skill issuance.
                        </p>
                      </div>
                      <StatusPill tone={headerState.tone} label={headerState.label} />
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    {isMinted ? (
                      <div className="border border-emerald-500/25 bg-emerald-500/10 px-4 py-4 text-emerald-100">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <CheckCircle2 size={16} />
                          Credential issued
                        </div>
                        <p className="mt-2 text-sm leading-6">
                          Token ID <span className="font-semibold text-white">{skillState?.tokenId || "Unavailable"}</span> has been minted and recorded for this skill.
                        </p>
                      </div>
                    ) : isAwaitingCouncil ? (
                      <div className="border border-amber-500/25 bg-amber-500/10 px-4 py-4 text-amber-100">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Clock3 size={16} />
                          Awaiting council action
                        </div>
                        <p className="mt-2 text-sm leading-6">
                          Your quiz has passed. The next action is an on-chain mint by a council-authorized signer.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-white/10 bg-white/5 px-4 py-4 text-gray-200">
                        <div className="text-sm font-semibold text-white">
                          Mint not started
                        </div>
                        <p className="mt-2 text-sm leading-6 text-gray-400">
                          {isQuizPassed
                            ? "The quiz result is valid, but issuance is currently blocked by environment setup."
                            : "No qualifying quiz result has been recorded for this skill yet."}
                        </p>
                      </div>
                    )}

                    {!backendCouncilReady ? (
                      <div className="mt-3 border border-red-500/25 bg-red-500/10 px-4 py-4 text-red-200">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <ShieldAlert size={16} />
                          Council signer unavailable
                        </div>
                        <p className="mt-2 text-sm leading-6">
                          The backend signer must be configured as a council member before the mint queue can progress.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="border border-white/10 bg-[#101827] px-4 py-4">
                  <div className="border-b border-white/8 pb-3">
                    <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
                    <p className="mt-1 text-xs text-gray-400">
                      A compact operational log for this credential.
                    </p>
                  </div>

                  <div className="pt-4">
                    {activity.map((item) => (
                      <ActivityItem
                        key={item.title}
                        title={item.title}
                        meta={item.meta}
                        tone={item.tone}
                      />
                    ))}
                  </div>
                </section>

                <section className="border border-white/10 bg-[#101827] px-4 py-4">
                  <div className="border-b border-white/8 pb-3">
                    <h2 className="text-sm font-semibold text-white">Actions</h2>
                    <p className="mt-1 text-xs text-gray-400">
                      Keep this state fresh or return to your profile.
                    </p>
                  </div>

                  <div className="grid gap-3 pt-4">
                    <button
                      onClick={loadStatus}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 border border-[#14a19f]/30 bg-[#14a19f]/12 px-4 py-3 text-sm font-medium text-[#8ff6f3] transition-colors hover:bg-[#14a19f]/18 disabled:opacity-60"
                    >
                      {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      Refresh Status
                    </button>

                    <button
                      onClick={() => navigate("/freelancer/my-profile")}
                      className="inline-flex items-center justify-center border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                      Back To Profile
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
