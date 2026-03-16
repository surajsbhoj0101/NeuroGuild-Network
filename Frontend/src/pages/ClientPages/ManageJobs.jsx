import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, Clock, FolderOpen, Loader2, MessageSquare, Plus, Send, Star, UserRound, XCircle, Zap } from "lucide-react";
import { useWalletClient } from "wagmi";
import { BrowserProvider, Contract } from "ethers";
import SideBar from "../../components/SideBar";
import ClientStats from "../../components/ClientStats";
import api from "../../utils/api.js";
import NoticeToast from "../../components/NoticeToast";
import StatusProjectCard from "../../components/StatusProjectCard";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { acceptBid } from "../../utils/accept_bid.js";
import { acceptWorkOnChain } from "../../utils/accept_work.js";
import { raiseDisputeOnChain } from "../../utils/raise_dispute.js";
import { submitJobRating } from "../../utils/submit_job_rating.js";
import { JobContract } from "../../abis/JobContract.js";

const JOB_CONTRACT_ADDRESS = import.meta.env.VITE_JOB_CONTRACT_ADDRESS;
const ACCEPTED_JOB_STATUS = 1;
const SUBGRAPH_SYNC_RETRIES = 4;
const SUBGRAPH_SYNC_DELAY_MS = 2000;
const DASHBOARD_REFRESH_DELAY_MS = 3000;

function EmptyState({ title, description, ctaLabel, onCta }) {
  return (
    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-2xl p-10 text-center">
      <AlertCircle size={46} className="mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
      <p className="text-gray-400 mb-5">{description}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="px-5 py-2 rounded-lg bg-[#14a19f] text-white text-sm font-semibold hover:bg-[#1ecac7] transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

function ManageJobs() {
  const { isAuthentication } = useAuth();
  const navigate = useNavigate();

  const { data: walletClient } = useWalletClient();
  const [activeTab, setActiveTab] = useState("Open");
  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openJobs, setOpenJobs] = useState([]);
  const [inProgressJobs, setInProgressJobs] = useState([]);
  const [submittedJobs, setSubmittedJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [disputedJobs, setDisputedJobs] = useState([]);
  const [cancelledJobs, setCancelledJobs] = useState([]);
  const [expiredJobs, setExpiredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [acceptingBidId, setAcceptingBidId] = useState(null);
  const [confirmAcceptWorkJob, setConfirmAcceptWorkJob] = useState(null);
  const [acceptingWorkJobId, setAcceptingWorkJobId] = useState(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeJob, setSelectedDisputeJob] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [raisingDisputeJobId, setRaisingDisputeJobId] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedRatingJob, setSelectedRatingJob] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submittingRatingJobId, setSubmittingRatingJobId] = useState(null);
  const [ratedJobIds, setRatedJobIds] = useState({});

  const [stats, setStats] = useState({
    openJobs: 0,
    activeProjects: 0,
    submittedProjects: 0,
    completedProjects: 0,
    disputedProjects: 0,
    cancelledProjects: 0,
    expiredProjects: 0,
  });

  const normalizeProofLinks = (proofs, fallbackProof = "") => {
    if (Array.isArray(proofs)) return proofs.filter(Boolean);
    if (proofs) return [proofs];
    return fallbackProof ? [fallbackProof] : [];
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const scheduleDashboardRefresh = () => {
    window.setTimeout(() => {
      fetchDashboardData();
    }, DASHBOARD_REFRESH_DELAY_MS);
  };

  const buildAcceptedInProgressJob = (job, bid) => ({
    jobId: job.jobId,
    jobTitle: job.jobTitle || "Untitled Job",
    jobDescription: job.jobDescription || "",
    budget: bid.bidAmount ?? job.budget,
    deadline: job.deadline,
    skills: job.skills || [],
    jobType: job.jobType || "Fixed",
    submittedAt: bid.createdAt || job.submittedAt || null,
    bid: {
      bidId: bid.bidId,
      bidAmount: bid.bidAmount,
      proposal: bid.proposal,
      createdAt: bid.createdAt,
      status: "ACCEPTED",
      freelancerId: bid.freelancerId,
      freelancerName: bid.freelancerName || "Unknown",
      freelancerAddress: bid.freelancerAddress,
      freelancerPfp: bid.freelancerPfp,
    },
  });

  const applyAcceptedBidOptimistically = (job, bid) => {
    const nextInProgressJob = buildAcceptedInProgressJob(job, bid);

    setOpenJobs((prev) => prev.filter((entry) => entry.jobId !== job.jobId));
    setInProgressJobs((prev) => {
      const withoutJob = prev.filter((entry) => entry.jobId !== job.jobId);
      return [nextInProgressJob, ...withoutJob];
    });
    setStats((prev) => ({
      ...prev,
      openJobs: Math.max(0, prev.openJobs - 1),
      activeProjects: prev.activeProjects + 1,
    }));
  };

  const applyAcceptedWorkOptimistically = (job) => {
    const completedJob = {
      ...job,
      budget: job.budget,
    };

    setSubmittedJobs((prev) => prev.filter((entry) => entry.jobId !== job.jobId));
    setCompletedJobs((prev) => {
      const withoutJob = prev.filter((entry) => entry.jobId !== job.jobId);
      return [completedJob, ...withoutJob];
    });
    setStats((prev) => ({
      ...prev,
      submittedProjects: Math.max(0, prev.submittedProjects - 1),
      completedProjects: prev.completedProjects + 1,
    }));
  };

  const applyDisputeOptimistically = (job) => {
    const disputedJob = {
      ...job,
      status: "Disputed",
    };

    setSubmittedJobs((prev) => prev.filter((entry) => entry.jobId !== job.jobId));
    setInProgressJobs((prev) => prev.filter((entry) => entry.jobId !== job.jobId));
    setDisputedJobs((prev) => {
      const withoutJob = prev.filter((entry) => entry.jobId !== job.jobId);
      return [disputedJob, ...withoutJob];
    });
    setStats((prev) => ({
      ...prev,
      activeProjects: Math.max(
        0,
        prev.activeProjects - (job?.workProofLinks?.length ? 0 : 1)
      ),
      submittedProjects: Math.max(
        0,
        prev.submittedProjects - (job?.workProofLinks?.length ? 1 : 0)
      ),
      disputedProjects: prev.disputedProjects + 1,
    }));
  };

  async function waitForAcceptedBidSync(jobId, signer) {
    const jobContract = new Contract(JOB_CONTRACT_ADDRESS, JobContract, signer);

    for (let attempt = 0; attempt < SUBGRAPH_SYNC_RETRIES; attempt += 1) {
      try {
        const status = Number(await jobContract.getJobStatus(jobId));
        if (status !== ACCEPTED_JOB_STATUS) {
          break;
        }
      } catch (error) {
        console.error("getJobStatus failed during accept-bid sync:", error);
        break;
      }

      await delay(SUBGRAPH_SYNC_DELAY_MS);
    }

    await fetchDashboardData();
  }

  useEffect(() => {
    let timer;
    if (!isAuthentication) {
      timer = setTimeout(() => {
        if (!isAuthentication) {
          setRedNotice(true);
          setNotice("Wallet not connected — redirecting to home...");
          navigate("/");
        }
      }, 1200);
    } else {
      setNotice(null);
      fetchDashboardData();
    }
    return () => clearTimeout(timer);
  }, [isAuthentication, navigate]);

  async function getSigner() {
    if (!walletClient || !window.ethereum) return null;
    const provider = new BrowserProvider(window.ethereum);
    return provider.getSigner();
  }

  const getProofHref = (proof) => {
    if (!proof) return "";
    if (proof.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${proof.replace("ipfs://", "")}`;
    }
    return proof;
  };

  async function fetchDashboardData() {
    try {
      setLoading(true);

      const response = await api.get(
        "http://localhost:5000/api/jobs/fetch-client-jobs",
        { withCredentials: true }
      );

      const data = response.data || {};

      const opJobs = [];

      if (Array.isArray(data.categorized?.open)) {
        for (const job of data.categorized.open) {
          const existingJob = opJobs.find((j) => j.jobId === job.jobId);
          if (job?.bidder) {
            const bid = {
              bidId: job?.bidId,
              bidAmount: job?.bidAmount,
              proposal: job?.proposal,
              createdAt: job?.createdAt,
              status: job?.status,
              freelancerId: job?.JobDetails?.freelancerId,
              freelancerName:
                job.JobDetails?.freelancerDetails?.BasicInformation?.name ||
                "Unknown",
              freelancerAddress: `${job?.bidder?.slice(0, 6)}...${job?.bidder?.slice(
                -6
              )}`,
              freelancerPfp:
                job.JobDetails?.freelancerDetails?.BasicInformation?.avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${job.bidder}`,
            };

            if (existingJob) {
              existingJob.bids.push(bid);
            } else {
              opJobs.push({
                jobId: job.jobId,
                jobTitle: job.JobDetails?.title || "Untitled Job",
                jobDescription: job.JobDetails?.description || "",
                budget: job.JobDetails?.budget,
                deadline: job.JobDetails?.deadline,
                skills: job.JobDetails?.skills || [],
                jobType: job.JobDetails?.jobType || "Fixed",
                submittedAt: job.createdAt,
                bids: [bid],
              });
            }
          } else {
            opJobs.push({
              jobId: job.jobId,
              jobTitle: job.JobDetails?.title || "Untitled Job",
              jobDescription: job.JobDetails?.description || "",
              budget: job.JobDetails?.budget,
              deadline: job.JobDetails?.deadline,
              skills: job.JobDetails?.skills || [],
              jobType: job.JobDetails?.jobType || "Fixed",
              submittedAt: job.createdAt,
              bids: [],
            });
          }
        }
      }

      const inProgressJobsArr = [];

      if (Array.isArray(data.categorized?.inProgress)) {
        for (const job of data.categorized.inProgress) {
          const bid = {
            bidId: job.bidId,
            bidAmount: job.bidAmount,
            proposal: job.proposal,
            createdAt: job.createdAt,
            status: job.status,
            freelancerId: job.JobDetails?.freelancerId,
            freelancerName:
              job.JobDetails?.freelancerDetails?.BasicInformation?.name ||
              "Unknown",
            freelancerAddress: `${job?.bidder?.slice(0, 6)}...${job?.bidder?.slice(
              -6
            )}`,
            freelancerPfp:
              job.JobDetails?.freelancerDetails?.BasicInformation?.avatarUrl ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${job.bidder}`,
          };

          inProgressJobsArr.push({
            jobId: job.jobId,
            jobTitle: job.JobDetails?.title || "Untitled Job",
            jobDescription: job.JobDetails?.description || "",
            budget: job.bidAmount,
            deadline: job.JobDetails?.deadline,
            skills: job.JobDetails?.skills || [],
            jobType: job.JobDetails?.jobType || "Fixed",
            submittedAt: job.createdAt,
            bid,
          });
        }
      }

      const submittedJobsArr = Array.isArray(data.categorized?.submitted)
        ? data.categorized.submitted.map((job) => ({
          jobId: job.jobId,
          jobTitle: job.JobDetails?.title || "Untitled Job",
          jobDescription: job.JobDetails?.description || "",
          clientName:
            job.JobDetails?.clientDetails?.companyDetails?.companyName || "You",
          clientAddress: job.JobDetails?.clientAddress,
          freelancerName:
            job.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "Unknown",
          freelancerId: job.JobDetails?.freelancerId,
          freelancerAddress: job.bidder,
          budget: job.bidAmount ?? job.JobDetails?.budget,
          deadline: job.JobDetails?.deadline,
          skills: job.JobDetails?.skills || [],
          workProofLinks: normalizeProofLinks(job.workProofLinks),
          workProofLink: job.workProofLink || "",
          submittedAt: job.submittedAt || null,
        }))
        : [];

      const completedJobsArr = Array.isArray(data.categorized?.completed)
        ? data.categorized.completed.map((job) => ({
          jobId: job.jobId,
          jobTitle: job.JobDetails?.title || "Untitled Job",
          jobDescription: job.JobDetails?.description || "",
          clientName:
            job.JobDetails?.clientDetails?.companyDetails?.companyName || "You",
          clientAddress: job.JobDetails?.clientAddress,
          freelancerId: job.JobDetails?.freelancerId,
          freelancerName:
            job.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "Unknown",
          freelancerAddress: job.bidder,
          budget: job.bidAmount ?? job.JobDetails?.budget,
          deadline: job.JobDetails?.deadline,
          skills: job.JobDetails?.skills || [],
        }))
        : [];

      const disputedJobsArr = Array.isArray(data.categorized?.disputed)
        ? data.categorized.disputed.map((job) => ({
          jobId: job.jobId,
          jobTitle: job.JobDetails?.title || "Untitled Job",
          jobDescription: job.JobDetails?.description || "",
          freelancerId: job.JobDetails?.freelancerId,
          clientName:
            job.JobDetails?.clientDetails?.companyDetails?.companyName || "You",
          clientAddress: job.JobDetails?.clientAddress,
          freelancerName:
            job.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "Unknown",
          freelancerAddress: job.bidder,
          budget: job.bidAmount ?? job.JobDetails?.budget,
          deadline: job.JobDetails?.deadline,
          skills: job.JobDetails?.skills || [],
          workProofLinks: normalizeProofLinks(job.workProofLinks),
          workProofLink: job.workProofLink || "",
          submittedAt: job.submittedAt || null,
        }))
        : [];

      const cancelledJobsArr = Array.isArray(data.categorized?.cancelled)
        ? data.categorized.cancelled.map((job) => ({
          jobId: job.jobId,
          jobTitle: job.JobDetails?.title || "Untitled Job",
          jobDescription: job.JobDetails?.description || "",
          freelancerId: job.JobDetails?.freelancerId,
          clientName:
            job.JobDetails?.clientDetails?.companyDetails?.companyName || "You",
          clientAddress: job.JobDetails?.clientAddress,
          freelancerName:
            job.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "Unknown",
          freelancerAddress: job.bidder,
          budget: job.bidAmount ?? job.JobDetails?.budget,
          deadline: job.JobDetails?.deadline,
          skills: job.JobDetails?.skills || [],
        }))
        : [];

      const expiredJobsArr = Array.isArray(data.categorized?.expired)
        ? data.categorized.expired.map((job) => ({
          jobId: job.jobId,
          jobTitle: job.JobDetails?.title || "Untitled Job",
          jobDescription: job.JobDetails?.description || "",
          freelancerId: job.JobDetails?.freelancerId,
          clientName:
            job.JobDetails?.clientDetails?.companyDetails?.companyName || "You",
          clientAddress: job.JobDetails?.clientAddress,
          freelancerName:
            job.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "Unknown",
          freelancerAddress: job.bidder,
          budget: job.bidAmount ?? job.JobDetails?.budget,
          deadline: job.JobDetails?.deadline,
          skills: job.JobDetails?.skills || [],
        }))
        : [];

      setOpenJobs(opJobs);
      setInProgressJobs(inProgressJobsArr);
      setSubmittedJobs(submittedJobsArr);
      setCompletedJobs(completedJobsArr);
      setDisputedJobs(disputedJobsArr);
      setCancelledJobs(cancelledJobsArr);
      setExpiredJobs(expiredJobsArr);

      setStats({
        openJobs: opJobs.length,
        activeProjects: inProgressJobsArr.length,
        submittedProjects: submittedJobsArr.length,
        completedProjects: completedJobsArr.length,
        disputedProjects: disputedJobsArr.length,
        cancelledProjects: cancelledJobsArr.length,
        expiredProjects: expiredJobsArr.length,
      });
    } catch (error) {
      console.error("Dashboard fetch failed:", error);

      if (error?.response?.status === 401) {
        setRedNotice(true);
        setNotice("Session expired. Please connect your wallet again.");
        navigate("/");
        return;
      }

      setRedNotice(true);
      setNotice(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const handleShowContract = (project) => {
    if (!project?.jobId) return;
    navigate(`/contracts/${project.jobId}`, {
      state: { contract: project, viewerRole: "client" },
    });
  };

  const handleOpenBids = (job) => {
    setSelectedJob(job);
  };

  const handleCloseBids = () => {
    setSelectedJob(null);
    setAcceptingBidId(null);
  };

  const handleAcceptBid = async (job, bid) => {
    try {
      const signer = await getSigner();
      if (!signer) {
        setRedNotice(true);
        setNotice("Wallet signer not available. Reconnect wallet.");
        return;
      }

      setAcceptingBidId(bid.bidId);
      const ok = await acceptBid(job.jobId, bid.bidId, signer, bid.bidAmount);
      if (!ok) {
        setRedNotice(true);
        setNotice("Failed to accept bid.");
        return;
      }

      if (bid?.freelancerId) {
        try {
          await api.post(
            "http://localhost:5000/api/notifications/job-event",
            {
              eventType: "bid_accepted",
              recipientId: bid.freelancerId,
              metadata: {
                jobId: job.jobId,
                bidId: bid.bidId,
                bidAmount: bid.bidAmount,
              },
            },
            { withCredentials: true }
          );
        } catch (notificationError) {
          console.error("bid_accepted notification failed:", notificationError);
        }
      }

      applyAcceptedBidOptimistically(job, bid);
      setRedNotice(false);
      setNotice("Bid accepted successfully.");
      handleCloseBids();
      setActiveTab("InProgress");
      await waitForAcceptedBidSync(job.jobId, signer);
    } catch (error) {
      console.error("accept bid error:", error);
      setRedNotice(true);
      setNotice(error?.shortMessage || error?.message || "Failed to accept bid.");
    } finally {
      setAcceptingBidId(null);
    }
  };

  const openAcceptWorkDialog = (job) => {
    setConfirmAcceptWorkJob(job);
  };

  const closeAcceptWorkDialog = () => {
    if (acceptingWorkJobId) return;
    setConfirmAcceptWorkJob(null);
  };

  const handleAcceptWork = async () => {
    if (!confirmAcceptWorkJob?.jobId) {
      setRedNotice(true);
      setNotice("Job details missing. Try again.");
      return;
    }

    try {
      const signer = await getSigner();
      if (!signer) {
        setRedNotice(true);
        setNotice("Wallet signer not available. Reconnect wallet.");
        return;
      }

      setAcceptingWorkJobId(confirmAcceptWorkJob.jobId);
      const ok = await acceptWorkOnChain(confirmAcceptWorkJob.jobId, signer);
      if (!ok) {
        setRedNotice(true);
        setNotice("Failed to accept submitted work.");
        return;
      }

      if (confirmAcceptWorkJob?.freelancerId) {
        try {
          await api.post(
            "http://localhost:5000/api/notifications/job-event",
            {
              eventType: "work_accepted",
              recipientId: confirmAcceptWorkJob.freelancerId,
              metadata: {
                jobId: confirmAcceptWorkJob.jobId,
              },
            },
            { withCredentials: true }
          );
        } catch (notificationError) {
          console.error("work_accepted notification failed:", notificationError);
        }
      }

      applyAcceptedWorkOptimistically(confirmAcceptWorkJob);
      setRedNotice(false);
      setNotice("Work accepted successfully.");
      setConfirmAcceptWorkJob(null);
      setActiveTab("Completed");
      scheduleDashboardRefresh();
    } catch (error) {
      console.error("accept work error:", error);
      setRedNotice(true);
      setNotice(
        error?.shortMessage ||
        error?.reason ||
        error?.message ||
        "Unable to accept work."
      );
    } finally {
      setAcceptingWorkJobId(null);
    }
  };

  const handleMessage = (project) => {
    if (!project?.freelancerId) {
      setRedNotice(true);
      setNotice("Freelancer ID is missing for this job.");
      return;
    }
    navigate(`/messages/${project.freelancerId}`, {
      state: {
        recipient: project.freelancerId
      },
    });
  };

  const handleViewFreelancerProfile = (freelancerId) => {
    if (!freelancerId) {
      setRedNotice(true);
      setNotice("Freelancer profile is unavailable for this bid.");
      return;
    }

    navigate(`/profile/${freelancerId}`);
  };

  const openDisputeModal = (job) => {
    setSelectedDisputeJob(job);
    setDisputeReason("");
    setIsDisputeModalOpen(true);
  };

  const closeDisputeModal = () => {
    if (raisingDisputeJobId) return;
    setIsDisputeModalOpen(false);
    setSelectedDisputeJob(null);
    setDisputeReason("");
  };

  const handleRaiseDispute = async () => {
    const signer = await getSigner();
    if (!signer) {
      setRedNotice(true);
      setNotice("Please connect your wallet first.");
      return;
    }

    if (!selectedDisputeJob?.jobId) {
      setRedNotice(true);
      setNotice("Job ID missing for this dispute.");
      return;
    }

    if (!disputeReason.trim()) {
      setRedNotice(true);
      setNotice("Please describe the dispute reason.");
      return;
    }

    try {
      setRaisingDisputeJobId(selectedDisputeJob.jobId);
      const result = await raiseDisputeOnChain({
        jobId: selectedDisputeJob.jobId,
        reason: disputeReason,
        signer,
        actorRole: "client",
        jobTitle: selectedDisputeJob.jobTitle,
        disputeContext: selectedDisputeJob,
      });

      if (!result?.success) {
        throw new Error(result?.error || "Unable to raise dispute.");
      }

      setRedNotice(false);
      setNotice(
        result?.governanceProposalCreated
          ? `Dispute raised and governance proposal #${result.governanceProposalId} created.`
          : result?.governanceError || "Dispute raised successfully."
      );
      applyDisputeOptimistically(selectedDisputeJob);
      setIsDisputeModalOpen(false);
      setSelectedDisputeJob(null);
      setDisputeReason("");
      setActiveTab("Disputed");
      scheduleDashboardRefresh();
    } catch (error) {
      console.error("raise dispute error:", error);
      setRedNotice(true);
      setNotice(error?.message || "Unable to raise dispute.");
    } finally {
      setRaisingDisputeJobId(null);
    }
  };

  const openRatingModal = (job) => {
    setSelectedRatingJob(job);
    setSelectedRating(0);
    setHoveredRating(0);
    setIsRatingModalOpen(true);
  };

  const closeRatingModal = () => {
    if (submittingRatingJobId) return;
    setIsRatingModalOpen(false);
    setSelectedRatingJob(null);
    setSelectedRating(0);
    setHoveredRating(0);
  };

  const handleSubmitRating = async () => {
    const signer = await getSigner();
    if (!signer) {
      setRedNotice(true);
      setNotice("Please connect your wallet first.");
      return;
    }

    if (!selectedRatingJob?.jobId) {
      setRedNotice(true);
      setNotice("Job ID missing for rating.");
      return;
    }

    if (!selectedRating) {
      setRedNotice(true);
      setNotice("Choose a rating before submitting.");
      return;
    }

    try {
      setSubmittingRatingJobId(selectedRatingJob.jobId);
      const result = await submitJobRating({
        jobId: selectedRatingJob.jobId,
        rating: selectedRating,
        role: "client",
        signer,
      });

      if (!result?.success) {
        throw new Error(result?.error || "Unable to submit rating.");
      }

      setRatedJobIds((current) => ({
        ...current,
        [selectedRatingJob.jobId]: selectedRating,
      }));
      setRedNotice(false);
      setNotice("Rating submitted successfully.");
      setIsRatingModalOpen(false);
      setSelectedRatingJob(null);
      setSelectedRating(0);
      setHoveredRating(0);
    } catch (error) {
      console.error("submit rating error:", error);
      setRedNotice(true);
      setNotice(error?.message || "Unable to submit rating.");
    } finally {
      setSubmittingRatingJobId(null);
    }
  };

  return (
    <>
      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

      {isDisputeModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#0d1224] p-6 shadow-2xl">
            <h3 className="text-white text-lg font-semibold">Raise Dispute</h3>
            <p className="text-sm text-gray-300 mt-2">
              {selectedDisputeJob?.jobTitle || "Selected project"}
            </p>
            <p className="text-xs text-gray-500 mt-1 break-all">
              Job ID: {selectedDisputeJob?.jobId || "N/A"}
            </p>

            <div className="mt-5">
              <label
                htmlFor="dispute-reason-client"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Dispute Reason
              </label>
              <textarea
                id="dispute-reason-client"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={5}
                placeholder="Describe the issue with this submitted work..."
                className="w-full rounded-lg border border-red-500/30 bg-[#161c32] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeDisputeModal}
                disabled={Boolean(raisingDisputeJobId)}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800/60 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRaiseDispute}
                disabled={Boolean(raisingDisputeJobId)}
                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 disabled:opacity-60 disabled:cursor-not-allowed border border-red-400/35 text-red-300 text-sm font-semibold transition-colors"
              >
                {raisingDisputeJobId ? "Raising..." : "Raise Dispute"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isRatingModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-amber-400/30 bg-[#0d1224] p-6 shadow-2xl">
            <h3 className="text-white text-lg font-semibold">Rate Freelancer</h3>
            <p className="text-sm text-gray-300 mt-2">
              {selectedRatingJob?.jobTitle || "Completed project"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Share a rating from 1 to 5 stars for the freelancer.
            </p>

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
                    disabled={Boolean(submittingRatingJobId)}
                    className="rounded-full p-2 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Star
                      size={30}
                      className={isActive ? "fill-amber-400 text-amber-400" : "text-gray-500"}
                    />
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-sm text-gray-300">
              {selectedRating
                ? `Selected rating: ${selectedRating} / 5`
                : "Select a rating to continue."}
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeRatingModal}
                disabled={Boolean(submittingRatingJobId)}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800/60 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={!selectedRating || Boolean(submittingRatingJobId)}
                className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed border border-amber-400/35 text-amber-300 text-sm font-semibold transition-colors"
              >
                {submittingRatingJobId ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen overflow-x-clip">
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

        <div className="hidden md:block shrink-0">
          <SideBar />
        </div>

        <div className="flex-1 px-4 md:px-8 pb-8">
          <div className="mb-6 md:mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#14a19f] mb-1.5">Client Workspace</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Manage Jobs</h1>
              <p className="text-gray-400 text-sm mt-1">Track bids, active contracts, and completed work.</p>
            </div>
            <button
              onClick={() => navigate("/post-job")}
              className="shrink-0 hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14a19f] hover:bg-[#1ecac7] text-white text-sm font-semibold transition-colors"
            >
              <Plus size={15} />
              Post Job
            </button>
          </div>

          {!loading && <ClientStats stats={stats} />}

          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "Open",       label: "Open",        count: stats.openJobs,         icon: FolderOpen    },
              { id: "InProgress", label: "In Progress", count: stats.activeProjects,    icon: Zap           },
              { id: "Submitted",  label: "Submitted",   count: stats.submittedProjects, icon: Send          },
              { id: "Completed",  label: "Completed",   count: stats.completedProjects, icon: CheckCircle2  },
              { id: "Disputed",   label: "Disputed",    count: stats.disputedProjects,  icon: AlertTriangle },
              { id: "Cancelled",  label: "Cancelled",   count: stats.cancelledProjects, icon: XCircle       },
              { id: "Expired",    label: "Expired",     count: stats.expiredProjects,   icon: Clock         },
            ].map(({ id, label, count, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  activeTab === id
                    ? "bg-[#14a19f]/15 text-[#14a19f] border-[#14a19f]/35"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border-transparent"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(" ")[0]}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    activeTab === id ? "bg-[#14a19f]/25 text-[#14a19f]" : "bg-white/8 text-gray-400"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-10 w-10 rounded-full border-2 border-[#14a19f]/30 border-t-[#14a19f] animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "Open" &&
                (openJobs.length === 0 ? (
                  <EmptyState
                    title="No open jobs"
                    description="You haven’t posted any jobs yet. Post your first job and start receiving bids."
                    ctaLabel="Post A Job"
                    onCta={() => navigate("/post-job")}
                  />
                ) : (
                  <div className="grid gap-4">{openJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={{
                        ...job,
                        freelancerName: job?.bids?.[0]?.freelancerName || "N/A",
                        freelancerAddress: job?.bids?.[0]?.freelancerAddress || "N/A",
                      }}
                      status="Open"
                      showActions={true}
                      extraActions={
                        <button
                          onClick={() => handleOpenBids(job)}
                          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#14a19f]/40 bg-[#14a19f]/10 hover:bg-[#14a19f]/20 text-[#7df3f0] text-sm font-semibold transition-colors"
                        >
                          Show Bids
                          <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-[#14a19f]/30 text-[#b7fffe] text-xs">
                            {job?.bids?.length || 0}
                          </span>
                        </button>
                      }
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() =>
                        handleMessage({
                          ...job,
                          freelancerId: job?.bids?.[0]?.freelancerId,
                          freelancerName:
                            job?.bids?.[0]?.freelancerName || "N/A",
                          freelancerAddress:
                            job?.bids?.[0]?.freelancerAddress || "N/A",
                        })
                      }
                    />
                  ))}</div>
                ))}

              {activeTab === "InProgress" &&
                (inProgressJobs.length === 0 ? (
                  <EmptyState
                    title="No active projects"
                    description="Accepted bids and running contracts will appear here."
                  />
                ) : (
                  <div className="grid gap-4">{inProgressJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={{
                        ...job,
                        freelancerName: job?.bid?.freelancerName || "N/A",
                        freelancerAddress: job?.bid?.freelancerAddress || "N/A",
                      }}
                      status="InProgress"
                      showActions={true}
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() =>
                        handleMessage({
                          ...job,
                          freelancerId: job?.bid?.freelancerId,
                          freelancerName: job?.bid?.freelancerName || "N/A",
                          freelancerAddress:
                            job?.bid?.freelancerAddress || "N/A",
                        })
                      }
                    />
                  ))}</div>
                ))}

              {activeTab === "Submitted" &&
                (submittedJobs.length === 0 ? (
                  <EmptyState
                    title="No submitted projects"
                    description="Projects waiting for your approval will appear here."
                  />
                ) : (
                  <div className="grid gap-4">{submittedJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={job}
                      status="Submitted"
                      showActions={true}
                      extraActions={
                        <div className="space-y-2">
                          {normalizeProofLinks(
                            job.workProofLinks,
                            job.workProofLink
                          ).length > 0 ? (
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                              <p className="text-xs text-emerald-300/90 mb-1">
                                Freelancer Submitted Proofs
                              </p>
                              <div className="space-y-1.5">
                                {normalizeProofLinks(
                                  job.workProofLinks,
                                  job.workProofLink
                                ).map((proof, index) => (
                                  <a
                                    key={`${job.jobId}-proof-${index}`}
                                    href={getProofHref(proof)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-sm text-emerald-200 underline break-all hover:text-white transition-colors"
                                  >
                                    {proof}
                                  </a>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <button
                            onClick={() => openAcceptWorkDialog(job)}
                            disabled={acceptingWorkJobId === job.jobId}
                            className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-sm font-semibold py-2 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {acceptingWorkJobId === job.jobId
                              ? "Accepting..."
                              : "Accept Work"}
                          </button>

                          <button
                            onClick={() => openDisputeModal(job)}
                            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-sm font-semibold py-2 rounded transition-colors"
                          >
                            Raise Dispute
                          </button>
                        </div>
                      }
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() => handleMessage(job)}
                    />
                  ))}</div>
                ))}

              {activeTab === "Completed" &&
                (completedJobs.length === 0 ? (
                  <EmptyState
                    title="No completed projects"
                    description="Completed contracts will appear here."
                  />
                ) : (
                  <div className="grid gap-4">{completedJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={job}
                      status="Completed"
                      showActions={true}
                      extraActions={
                        ratedJobIds[job.jobId] ? (
                          <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                            You rated this freelancer {ratedJobIds[job.jobId]}/5.
                          </div>
                        ) : (
                          <button
                            onClick={() => openRatingModal(job)}
                            className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-sm font-semibold py-2 rounded transition-colors"
                          >
                            Rate Freelancer
                          </button>
                        )
                      }
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() => handleMessage(job)}
                    />
                  ))}</div>
                ))}

              {activeTab === "Disputed" &&
                (disputedJobs.length === 0 ? (
                  <EmptyState
                    title="No disputed projects"
                    description="If a contract enters dispute, it will appear in this tab."
                  />
                ) : (
                  <div className="grid gap-4">{disputedJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={job}
                      status="Disputed"
                      showActions={true}
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() => handleMessage(job)}
                    />
                  ))}</div>
                ))}

              {activeTab === "Cancelled" &&
                (cancelledJobs.length === 0 ? (
                  <EmptyState
                    title="No cancelled projects"
                    description="Cancelled contracts will appear here."
                  />
                ) : (
                  <div className="grid gap-4">{cancelledJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={job}
                      status="Cancelled"
                      showActions={true}
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() => handleMessage(job)}
                    />
                  ))}</div>
                ))}

              {activeTab === "Expired" &&
                (expiredJobs.length === 0 ? (
                  <EmptyState
                    title="No expired projects"
                    description="Expired contracts will appear here."
                  />
                ) : (
                  <div className="grid gap-4">{expiredJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={job}
                      status="Expired"
                      showActions={true}
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() => handleMessage(job)}
                    />
                  ))}</div>
                ))}

            </>
          )}
        </div>
      </div>

      {confirmAcceptWorkJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#14a19f]/25 bg-[#0d1224] p-5 shadow-2xl">
            <h3 className="text-white text-lg font-semibold">Accept Submitted Work</h3>
            <p className="text-sm text-gray-300 mt-2">
              You are about to mark this project as completed and release funds.
              This action cannot be undone.
            </p>
            <p className="text-xs text-gray-400 mt-2 break-all">
              Job ID: {confirmAcceptWorkJob.jobId}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeAcceptWorkDialog}
                disabled={Boolean(acceptingWorkJobId)}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800/60 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptWork}
                disabled={Boolean(acceptingWorkJobId)}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed border border-emerald-400/35 text-emerald-300 text-sm font-semibold transition-colors"
              >
                {acceptingWorkJobId ? "Confirming..." : "Yes, Accept Work"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-black/55 backdrop-blur-sm">
          <div className="w-full md:max-w-3xl max-h-[90vh] overflow-hidden rounded-t-2xl md:rounded-2xl border border-[#14a19f]/25 bg-[#0d1224] shadow-2xl">
            <div className="p-5 border-b border-[#14a19f]/20 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-white text-xl font-semibold">Bids For This Job</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedJob.jobTitle || "Untitled Job"} • {selectedJob?.bids?.length || 0} bid(s)
                </p>
              </div>
              <button
                onClick={handleCloseBids}
                className="px-3 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800/60 text-sm"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[72vh]">
              {!selectedJob?.bids?.length ? (
                <div className="rounded-xl border border-[#14a19f]/20 bg-[#11172d] p-6 text-center text-gray-400">
                  No bids found for this job.
                </div>
              ) : (
                selectedJob.bids.map((bid) => (
                  <div
                    key={bid.bidId}
                    className="rounded-xl border border-[#14a19f]/25 bg-[#11172d] p-4 md:p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={bid.freelancerPfp}
                          alt={bid.freelancerName}
                          className="w-10 h-10 rounded-full border border-[#14a19f]/35"
                        />
                        <div>
                          <p className="text-white font-semibold">{bid.freelancerName}</p>
                          <p className="text-xs text-gray-400">{bid.freelancerAddress}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#14a19f]/20 text-[#8bf5f2] text-xs border border-[#14a19f]/35">
                          ${bid.bidAmount}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 text-gray-300 text-xs border border-white/10">
                          Bid #{bid.bidId}
                        </span>
                      </div>
                    </div>

                    {bid?.proposal ? (
                      <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                        {bid.proposal.length > 240
                          ? `${bid?.proposal?.slice(0, 240)}...`
                          : bid.proposal}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-col md:flex-row gap-2">
                      <button
                        onClick={() => handleAcceptBid(selectedJob, bid)}
                        disabled={acceptingBidId === bid.bidId}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed border border-emerald-400/35 text-emerald-300 text-sm font-semibold transition-colors"
                      >
                        {acceptingBidId === bid.bidId ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            Accept Bid
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleViewFreelancerProfile(bid.freelancerId)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-colors"
                      >
                        <UserRound size={16} />
                        View Profile
                        <ChevronRight size={14} />
                      </button>

                      <button
                        onClick={() =>
                          handleMessage({
                            ...selectedJob,
                            freelancerId: bid.freelancerId,
                          })
                        }
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-blue-300 text-sm font-semibold transition-colors"
                      >
                        <MessageSquare size={16} />
                        Message Freelancer
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ManageJobs;
