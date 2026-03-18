import { useEffect, useMemo, useState } from "react";
import { BrowserProvider } from "ethers";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, BriefcaseBusiness, CalendarClock, Star, UserRound } from "lucide-react";
import SideBar from "../components/SideBar";
import NoticeToast from "../components/NoticeToast";
import api from "../utils/api.js";
import { submitJobRating } from "../utils/submit_job_rating.js";

const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
const robotoStyle = { fontFamily: "Roboto, sans-serif" };

function formatDate(dateValue) {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
}

function formatCurrency(value) {
  if (value === undefined || value === null || value === "") return "N/A";
  const amount = Number(value);
  if (Number.isNaN(amount)) return `${value}`;
  return `$${amount}`;
}

function pickFirstDefined(...values) {
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] !== undefined && values[i] !== null && values[i] !== "") {
      return values[i];
    }
  }
  return null;
}

function getStatusBadgeClass(statusValue) {
  const normalized = `${statusValue || ""}`.toLowerCase().replace("_", "");
  if (normalized.includes("progress")) {
    return "bg-blue-500/20 text-blue-300 border border-blue-500/40";
  }
  if (normalized.includes("submitted")) {
    return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
  }
  if (normalized.includes("completed")) {
    return "bg-green-500/20 text-green-300 border border-green-500/40";
  }
  if (normalized.includes("disputed")) {
    return "bg-orange-500/20 text-orange-300 border border-orange-500/40";
  }
  if (normalized.includes("cancelled")) {
    return "bg-red-500/20 text-red-300 border border-red-500/40";
  }
  if (normalized.includes("expired")) {
    return "bg-rose-500/20 text-rose-300 border border-rose-500/40";
  }
  return "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40";
}

function normalizeContract(raw, jobIdParam, viewerRole) {
  if (!raw) return null;

  const firstBid = Array.isArray(raw.bids) && raw.bids.length > 0 ? raw.bids[0] : null;
  const bidInfo = raw.bid || firstBid;

  return {
    jobId: pickFirstDefined(raw.jobId, raw._id, jobIdParam),
    jobTitle: pickFirstDefined(raw.jobTitle, raw.title, raw.JobDetails?.title, "Untitled Job"),
    jobDescription: pickFirstDefined(raw.jobDescription, raw.description, raw.JobDetails?.description, ""),
    clientName: pickFirstDefined(
      raw.clientName,
      raw.JobDetails?.clientDetails?.companyDetails?.companyName,
      raw.JobDetails?.clientAddress,
      viewerRole === "client" ? "You" : "N/A"
    ),
    clientId: pickFirstDefined(raw.clientId, raw.JobDetails?.clientId),
    clientAddress: pickFirstDefined(raw.clientAddress, raw.JobDetails?.clientAddress),
    freelancerName: pickFirstDefined(
      raw.freelancerName,
      bidInfo?.freelancerName,
      raw.JobDetails?.freelancerDetails?.BasicInformation?.name,
      "N/A"
    ),
    freelancerId: pickFirstDefined(raw.freelancerId, bidInfo?.freelancerId, raw.JobDetails?.freelancerId),
    freelancerAddress: pickFirstDefined(raw.freelancerAddress, bidInfo?.freelancerAddress, raw.bidder),
    contractValue: pickFirstDefined(raw.contractValue, raw.budget, raw.bidAmount, bidInfo?.bidAmount, raw.JobDetails?.budget),
    deadline: pickFirstDefined(raw.deadline, raw.JobDetails?.completion, raw.JobDetails?.deadline),
    status: pickFirstDefined( raw.JobDetails?.status, "N/A"),
    skills: Array.isArray(raw.skills)
      ? raw.skills
      : Array.isArray(raw.JobDetails?.skills)
        ? raw.JobDetails.skills
        : [],
    milestones: Array.isArray(raw.milestones) ? raw.milestones : [],
  };
}

function ContractDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteContract, setRemoteContract] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const viewerRole = location.state?.viewerRole;
  const preloaded = useMemo(
    () => normalizeContract(location.state?.contract, jobId, viewerRole),
    [location.state, jobId, viewerRole]
  );
  const contract = preloaded || remoteContract;
  const normalizedStatus = `${contract?.status || ""}`.toLowerCase().replaceAll("_", " ");
  const isCompletedContract = normalizedStatus.includes("completed");
  const ratingTargetLabel =
    viewerRole === "client" ? "freelancer" : viewerRole === "freelancer" ? "client" : "counterparty";
  const ratingHeading =
    viewerRole === "client" ? "Rate Freelancer" : viewerRole === "freelancer" ? "Rate Client" : "Rate Counterparty";

  useEffect(() => {
    let cancelled = false;

    async function fetchFallbackContract() {
      if (preloaded || !jobId) return;

      setLoading(true);
      try {
        const response = await api.get(`/api/jobs/fetch-job/${jobId}`, {
          withCredentials: true,
        });

        if (cancelled) return;
        const normalized = normalizeContract(response?.data?.jobDetails, jobId, viewerRole);
        setRemoteContract(normalized);
      } catch (error) {
        if (cancelled) return;
        setRedNotice(true);
        setNotice("Unable to load contract details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFallbackContract();

    return () => {
      cancelled = true;
    };
  }, [jobId, preloaded, viewerRole]);

  const handleSubmitRating = async () => {
    if (!isCompletedContract) {
      setRedNotice(true);
      setNotice("Ratings are available only after the job is completed.");
      return;
    }

    if (!selectedRating) {
      setRedNotice(true);
      setNotice("Choose a rating before submitting.");
      return;
    }

    if (!window.ethereum) {
      setRedNotice(true);
      setNotice("Connect your wallet to submit a rating.");
      return;
    }

    try {
      setSubmittingRating(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const result = await submitJobRating({
        jobId: contract?.jobId,
        rating: selectedRating,
        role: viewerRole,
        signer,
      });

      if (!result?.success) {
        throw new Error(result?.error || "Failed to submit rating.");
      }

      setRedNotice(false);
      setNotice("Rating submitted successfully.");
      setRatingSubmitted(true);
    } catch (error) {
      console.error("Failed to submit rating:", error);
      setRedNotice(true);
      setNotice(error?.message || "Failed to submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <>
      <NoticeToast message={notice} isError={redNotice} onClose={() => setNotice(null)} />

      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen overflow-x-clip">
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

        <div className="hidden md:block shrink-0">
          <SideBar />
        </div>

        <div className="relative z-10 flex-1 px-4 md:px-8 pb-8">
          <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 md:mb-8 rounded-2xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-4 backdrop-blur-md sm:p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#14a19f]/35 bg-[#14a19f]/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[#8ff6f3]" style={robotoStyle}>
                Contract Workspace
              </span>
              <h1 className="mt-3 text-2xl md:text-3xl font-bold text-white" style={orbitronStyle}>Contract Details</h1>
              <p className="mt-2 text-sm md:text-base text-gray-400" style={robotoStyle}>Shared view for client and freelancer contracts.</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#14a19f]/40 bg-[#14a19f]/10 hover:bg-[#14a19f]/20 text-[#7df3f0] text-sm font-semibold transition-colors"
              style={robotoStyle}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 rounded-full border-2 border-[#14a19f]/30 border-t-[#14a19f] animate-spin" />
            </div>
          ) : !contract ? (
            <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-2xl p-10 text-center">
              <AlertCircle size={46} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-200 mb-2" style={orbitronStyle}>Contract not found</h3>
              <p className="text-gray-400" style={robotoStyle}>We could not load this contract. Try opening it again from Manage Jobs.</p>
            </div>
          ) : (
            <div className="w-full border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-2xl backdrop-blur-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#0f1c2f] via-[#11253a] to-[#0d1224] border-b border-[#14a19f]/20 px-6 py-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-wide uppercase text-[#7df3f0]" style={robotoStyle}>Contract #{contract.jobId || "N/A"}</p>
                    <h2 className="text-xl md:text-2xl font-semibold text-white mt-1" style={orbitronStyle}>{contract.jobTitle || "Untitled Job"}</h2>
                    <p className="text-xs text-gray-400 mt-2" style={robotoStyle}>
                      {viewerRole === "freelancer" ? "Freelancer View" : viewerRole === "client" ? "Client View" : "Contract View"}
                    </p>
                  </div>
                  <span
                    className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(contract.status)}`}
                  >
                    {(contract.status || "N/A").toString().replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-[#14a19f]/20 bg-[#161c32]/35 p-4">
                    <p className="text-xs text-gray-400 mb-1" style={robotoStyle}>Contract Value</p>
                    <p className="text-[#8ff6f3] text-lg font-semibold" style={orbitronStyle}>{formatCurrency(contract.contractValue)}</p>
                  </div>
                  <div className="rounded-xl border border-[#14a19f]/20 bg-[#161c32]/35 p-4">
                    <p className="text-xs text-gray-400 mb-1" style={robotoStyle}>Deadline</p>
                    <p className="text-white font-medium" style={robotoStyle}>{formatDate(contract.deadline)}</p>
                  </div>
                  <div className="rounded-xl border border-[#14a19f]/20 bg-[#161c32]/35 p-4">
                    <p className="text-xs text-gray-400 mb-1" style={robotoStyle}>Status</p>
                    <p className="text-white font-medium" style={robotoStyle}>{(contract.status || "N/A").toString().replace("_", " ")}</p>
                  </div>
                  <div className="rounded-xl border border-[#14a19f]/20 bg-[#161c32]/35 p-4">
                    <p className="text-xs text-gray-400 mb-1" style={robotoStyle}>Job ID</p>
                    <p className="text-white text-xs font-medium break-all" style={robotoStyle}>{contract.jobId || "N/A"}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#14a19f]/20 bg-[#161c32]/35 p-4">
                    <div className="flex items-center gap-2 mb-2 text-[#7df3f0]">
                      <BriefcaseBusiness size={15} />
                      <p className="text-xs uppercase tracking-wide" style={robotoStyle}>Client</p>
                    </div>
                    {contract.clientId ? (
                      <Link
                        to={`/profile/${contract.clientId}`}
                        className="font-medium text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
                        style={robotoStyle}
                      >
                        {contract.clientName || "N/A"}
                      </Link>
                    ) : (
                      <p className="text-white font-medium" style={robotoStyle}>{contract.clientName || "N/A"}</p>
                    )}
                    <p className="text-xs text-gray-400 break-all mt-1" style={robotoStyle}>{contract.clientAddress || "N/A"}</p>
                  </div>

                  <div className="rounded-xl border border-[#14a19f]/20 bg-[#161c32]/35 p-4">
                    <div className="flex items-center gap-2 mb-2 text-[#7df3f0]">
                      <UserRound size={15} />
                      <p className="text-xs uppercase tracking-wide" style={robotoStyle}>Freelancer</p>
                    </div>
                    {contract.freelancerId ? (
                      <Link
                        to={`/profile/${contract.freelancerId}`}
                        className="font-medium text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
                        style={robotoStyle}
                      >
                        {contract.freelancerName || "N/A"}
                      </Link>
                    ) : (
                      <p className="text-white font-medium" style={robotoStyle}>{contract.freelancerName || "N/A"}</p>
                    )}
                    <p className="text-xs text-gray-400 break-all mt-1" style={robotoStyle}>{contract.freelancerAddress || "N/A"}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#14a19f]/20 bg-[#161c32]/35 p-4">
                  <div className="flex items-center gap-2 mb-2 text-[#7df3f0]">
                    <CalendarClock size={15} />
                    <p className="text-xs uppercase tracking-wide" style={robotoStyle}>Scope</p>
                  </div>
                  <p className="text-gray-200 text-sm whitespace-pre-wrap leading-7" style={robotoStyle}>{contract.jobDescription || "No project scope provided."}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2" style={robotoStyle}>Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {contract.skills.length > 0 ? (
                      contract.skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-[#14a19f]/10 text-[#8ff6f3] px-3 py-1 rounded-full text-xs border border-[#14a19f]/30"
                          style={robotoStyle}
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400" style={robotoStyle}>No skills listed.</p>
                    )}
                  </div>
                </div>

                {contract.milestones.length > 0 ? (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2" style={robotoStyle}>Milestones</p>
                    <div className="space-y-2">
                      {contract.milestones.map((milestone, index) => (
                        <div
                          key={`${milestone.name || "milestone"}-${index}`}
                          className="rounded-xl border border-[#14a19f]/20 bg-[#161c32]/35 px-3 py-2.5 flex items-center justify-between"
                        >
                          <p className="text-sm text-gray-200" style={robotoStyle}>{milestone.name || `Milestone ${index + 1}`}</p>
                          <p className={`text-xs font-medium ${milestone.completed ? "text-green-400" : "text-yellow-400"}`} style={robotoStyle}>
                            {milestone.completed ? "Completed" : "Pending"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isCompletedContract ? (
                  <div className="rounded-xl border border-[#14a19f]/20 bg-[#161c32]/35 p-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#7df3f0]" style={robotoStyle}>
                          Completed Job Rating
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white" style={orbitronStyle}>{ratingHeading}</h3>
                        <p className="mt-2 text-sm text-gray-400" style={robotoStyle}>
                          Share a 1 to 5 star rating for the {ratingTargetLabel}. This will be submitted onchain.
                        </p>
                      </div>
                      {ratingSubmitted ? (
                        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                          Rating Submitted
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const activeValue = hoveredRating || selectedRating;
                        const isActive = starValue <= activeValue;

                        return (
                          <button
                            key={starValue}
                            type="button"
                            onMouseEnter={() => setHoveredRating(starValue)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={() => setSelectedRating(starValue)}
                            disabled={ratingSubmitted || submittingRating}
                            className="rounded-full p-2 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                          >
                            <Star
                              size={28}
                              className={
                                isActive
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-500"
                              }
                            />
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm text-gray-300" style={robotoStyle}>
                        {selectedRating
                          ? `Selected rating: ${selectedRating} / 5`
                          : `Select a star rating for the ${ratingTargetLabel}.`}
                      </p>
                      <button
                        type="button"
                        onClick={handleSubmitRating}
                        disabled={!selectedRating || ratingSubmitted || submittingRating}
                        className="inline-flex items-center justify-center rounded-lg bg-[#14a19f] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1ecac7] disabled:cursor-not-allowed disabled:bg-[#1d3742] disabled:text-gray-400"
                        style={robotoStyle}
                      >
                        {submittingRating ? "Submitting..." : ratingSubmitted ? "Submitted" : "Submit Rating"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ContractDetailsPage;
