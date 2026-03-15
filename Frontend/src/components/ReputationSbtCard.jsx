import React from "react";
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  ShieldCheck,
  Star,
  Target,
  TriangleAlert,
} from "lucide-react";

const robotoStyle = { fontFamily: "Roboto, sans-serif" };

function MetricPill({ label, value, tone = "default" }) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : tone === "warn"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
        : "border-white/10 bg-white/5 text-white";

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

export default function ReputationSbtCard({ reputationProfile, orbitronStyle }) {
  const hasSbt = reputationProfile?.hasReputationSbt;
  const reliability = Number(reputationProfile?.reliabilityScore || 0);
  const onchainRating = Number(reputationProfile?.ratingAverage || 0);
  const starRating = onchainRating / 2;
  const ratingWidth = Math.min(100, (starRating / 5) * 100);
  const reliabilityWidth = Math.min(100, reliability);
  const completedJobsList = Array.isArray(reputationProfile?.completedJobsList)
    ? reputationProfile.completedJobsList
    : [];

  const formatDate = (value) => {
    if (!value) return "Unknown date";
    const numericValue = Number(value);
    const date = numericValue > 0
      ? new Date(numericValue * 1000)
      : new Date(value);

    if (Number.isNaN(date.getTime())) return "Unknown date";

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#14a19f]/30 bg-[linear-gradient(180deg,rgba(20,161,159,0.16),rgba(15,24,43,0.92))] p-5 shadow-[0_16px_40px_rgba(7,14,28,0.32)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#1ecac7]/12 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)]" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#14a19f]/25 bg-[#14a19f]/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8ff6f3]">
              <Award size={13} />
              Reputation SBT
            </div>
            <h3 className="mt-3 text-white text-lg font-bold tracking-wide" style={orbitronStyle}>
              Onchain Reputation
            </h3>
            <p className="mt-1 text-xs text-gray-400" style={robotoStyle}>
              {hasSbt ? `Token #${reputationProfile.tokenId}` : "No reputation token minted yet"}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold border ${
              hasSbt
                ? reputationProfile.revoked
                  ? "border-red-500/30 bg-red-500/12 text-red-300"
                  : "border-emerald-500/30 bg-emerald-500/12 text-emerald-300"
                : "border-gray-500/20 bg-gray-500/10 text-gray-400"
            }`}
            style={robotoStyle}
          >
            {hasSbt ? (
              reputationProfile.revoked ? <TriangleAlert size={12} /> : <ShieldCheck size={12} />
            ) : (
              <Award size={12} />
            )}
            {hasSbt ? (reputationProfile.revoked ? "Revoked" : "Active") : "Not Minted"}
          </span>
        </div>

        {hasSbt ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MetricPill label="Completed" value={reputationProfile.completedJobs} tone="good" />
              <MetricPill label="Disputes" value={reputationProfile.disputeCount} tone="warn" />
              <MetricPill label="Expired / Lost" value={reputationProfile.failedJobs} />
              <MetricPill label="Score" value={reputationProfile.totalScore} />
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Star size={15} className="fill-amber-300" />
                    <span className="text-xs uppercase tracking-[0.14em]" style={robotoStyle}>
                      Rating Average
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white" style={robotoStyle}>
                    {starRating.toFixed(1)}/5
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#0f1729] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300"
                    style={{ width: `${ratingWidth}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Target size={15} />
                    <span className="text-xs uppercase tracking-[0.14em]" style={robotoStyle}>
                      Reliability
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white" style={robotoStyle}>
                    {reliability}%
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#0f1729] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#14a19f] to-[#1ecac7]"
                    style={{ width: `${reliabilityWidth}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-500/15 bg-amber-500/8 p-3">
              <p className="text-xs font-medium text-amber-200" style={robotoStyle}>
                Reputation mapping
              </p>
              <p className="mt-1 text-xs leading-6 text-amber-100/80" style={robotoStyle}>
                Expired jobs and dispute losses count toward this onchain failure total. Cancelled jobs are not recorded
                as failures in the contract.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-cyan-300">
                <BriefcaseBusiness size={15} />
                <p className="text-xs uppercase tracking-[0.14em]" style={robotoStyle}>
                  Completed Jobs
                </p>
              </div>

              {completedJobsList.length ? (
                <div className="mt-3 space-y-3">
                  {completedJobsList.map((job) => (
                    <div
                      key={job.historyId || job.jobId}
                      className="rounded-xl border border-white/10 bg-[#0f1729]/70 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white" style={robotoStyle}>
                            {job.title || "Completed Job"}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gray-500">
                            Job ID {job.jobId?.slice?.(0, 10)}...
                          </p>
                        </div>
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                          Completed
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-300" style={robotoStyle}>
                        <span className="rounded-full bg-white/5 px-2 py-1">
                          Client: {job.clientName || "Unknown"}
                        </span>
                        {job.budget ? (
                          <span className="rounded-full bg-white/5 px-2 py-1">
                            Budget: {Number(job.budget).toLocaleString()}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400" style={robotoStyle}>
                        <CalendarDays size={13} />
                        <span>Completed on {formatDate(job.completedAt)}</span>
                      </div>

                      {job.description ? (
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-400" style={robotoStyle}>
                          {job.description}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs leading-6 text-gray-400" style={robotoStyle}>
                  Completed jobs linked to this reputation token will appear here.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-[#14a19f]/25 bg-[#0d1224]/55 p-4">
            <p className="text-sm text-white font-medium" style={robotoStyle}>
              Reputation unlocks after job activity
            </p>
            <p className="mt-2 text-xs text-gray-400 leading-6" style={robotoStyle}>
              Once jobs are completed and rated onchain, your reputation SBT stats will appear here with reliability, rating, and dispute history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
