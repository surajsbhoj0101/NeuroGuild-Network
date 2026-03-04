import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, BriefcaseBusiness, CalendarClock, UserRound } from "lucide-react";
import SideBar from "../components/SideBar";
import NoticeToast from "../components/NoticeToast";
import api from "../utils/api.js";

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
    clientAddress: pickFirstDefined(raw.clientAddress, raw.JobDetails?.clientAddress),
    freelancerName: pickFirstDefined(
      raw.freelancerName,
      bidInfo?.freelancerName,
      raw.JobDetails?.freelancerDetails?.BasicInformation?.name,
      "N/A"
    ),
    freelancerAddress: pickFirstDefined(raw.freelancerAddress, bidInfo?.freelancerAddress, raw.bidder),
    contractValue: pickFirstDefined(raw.contractValue, raw.budget, raw.bidAmount, bidInfo?.bidAmount, raw.JobDetails?.budget),
    deadline: pickFirstDefined(raw.deadline, raw.JobDetails?.completion, raw.JobDetails?.deadline),
    status: pickFirstDefined(raw.status, raw.JobDetails?.status, "N/A"),
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

  const viewerRole = location.state?.viewerRole;
  const preloaded = useMemo(
    () => normalizeContract(location.state?.contract, jobId, viewerRole),
    [location.state, jobId, viewerRole]
  );
  const contract = preloaded || remoteContract;

  useEffect(() => {
    let cancelled = false;

    async function fetchFallbackContract() {
      if (preloaded || !jobId) return;

      setLoading(true);
      try {
        const response = await api.get(`http://localhost:5000/api/jobs/fetch-job/${jobId}`, {
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

  return (
    <>
      <NoticeToast message={notice} isError={redNotice} onClose={() => setNotice(null)} />

      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen">
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

        <SideBar />

        <div className="flex-1 px-4 md:px-8 pb-8">
          <div className="mb-6 md:mb-8 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Contract Details</h1>
              <p className="text-gray-400 text-sm md:text-base">Shared view for client and freelancer contracts.</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#14a19f]/40 bg-[#14a19f]/10 hover:bg-[#14a19f]/20 text-[#7df3f0] text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 rounded-full border-2 border-[#14a19f]/30 border-t-[#14a19f] animate-spin" />
            </div>
          ) : !contract ? (
            <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-2xl p-10 text-center">
              <AlertCircle size={46} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Contract not found</h3>
              <p className="text-gray-400">We could not load this contract. Try opening it again from Manage Jobs.</p>
            </div>
          ) : (
            <div className="w-full max-w-5xl bg-[#0d1224] border border-[#14a19f]/30 rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#0f1c2f] via-[#11253a] to-[#0d1224] border-b border-[#14a19f]/20 px-6 py-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-wide uppercase text-[#7df3f0]">Contract #{contract.jobId || "N/A"}</p>
                    <h2 className="text-xl md:text-2xl font-semibold text-white mt-1">{contract.jobTitle || "Untitled Job"}</h2>
                    <p className="text-xs text-gray-400 mt-2">
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
                  <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
                    <p className="text-xs text-gray-400 mb-1">Contract Value</p>
                    <p className="text-[#14a19f] text-lg font-semibold">{formatCurrency(contract.contractValue)}</p>
                  </div>
                  <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
                    <p className="text-xs text-gray-400 mb-1">Deadline</p>
                    <p className="text-white font-medium">{formatDate(contract.deadline)}</p>
                  </div>
                  <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <p className="text-white font-medium">{(contract.status || "N/A").toString().replace("_", " ")}</p>
                  </div>
                  <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
                    <p className="text-xs text-gray-400 mb-1">Job ID</p>
                    <p className="text-white text-xs font-medium break-all">{contract.jobId || "N/A"}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
                    <div className="flex items-center gap-2 mb-2 text-[#7df3f0]">
                      <BriefcaseBusiness size={15} />
                      <p className="text-xs uppercase tracking-wide">Client</p>
                    </div>
                    <p className="text-white font-medium">{contract.clientName || "N/A"}</p>
                    <p className="text-xs text-gray-400 break-all mt-1">{contract.clientAddress || "N/A"}</p>
                  </div>

                  <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
                    <div className="flex items-center gap-2 mb-2 text-[#7df3f0]">
                      <UserRound size={15} />
                      <p className="text-xs uppercase tracking-wide">Freelancer</p>
                    </div>
                    <p className="text-white font-medium">{contract.freelancerName || "N/A"}</p>
                    <p className="text-xs text-gray-400 break-all mt-1">{contract.freelancerAddress || "N/A"}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
                  <div className="flex items-center gap-2 mb-2 text-[#7df3f0]">
                    <CalendarClock size={15} />
                    <p className="text-xs uppercase tracking-wide">Scope</p>
                  </div>
                  <p className="text-gray-200 text-sm whitespace-pre-wrap">{contract.jobDescription || "No project scope provided."}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {contract.skills.length > 0 ? (
                      contract.skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-[#14a19f]/10 text-[#14a19f] px-3 py-1 rounded-full text-xs border border-[#14a19f]/30"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No skills listed.</p>
                    )}
                  </div>
                </div>

                {contract.milestones.length > 0 ? (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Milestones</p>
                    <div className="space-y-2">
                      {contract.milestones.map((milestone, index) => (
                        <div
                          key={`${milestone.name || "milestone"}-${index}`}
                          className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 px-3 py-2 flex items-center justify-between"
                        >
                          <p className="text-sm text-gray-200">{milestone.name || `Milestone ${index + 1}`}</p>
                          <p className={`text-xs font-medium ${milestone.completed ? "text-green-400" : "text-yellow-400"}`}>
                            {milestone.completed ? "Completed" : "Pending"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ContractDetailsPage;
