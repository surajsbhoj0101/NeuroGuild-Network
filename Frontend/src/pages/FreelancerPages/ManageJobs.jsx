import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Layers, Search, Send, Star, XCircle, Zap } from "lucide-react";
import SideBar from "../../components/SideBar";
import api from "../../utils/api.js";
import "../../index.css";
import FreelancerStats from "../../components/FreelancerStats";
import NoticeToast from "../../components/NoticeToast";
import StatusProjectCard from "../../components/StatusProjectCard";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { submitWorkOnChain } from "../../utils/submit_work.js";
import { raiseDisputeOnChain } from "../../utils/raise_dispute.js";
import { submitJobRating } from "../../utils/submit_job_rating.js";

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
  const DASHBOARD_REFRESH_DELAY_MS = 3000;
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { isAuthentication } = useAuth();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [isSubmitWorkModalOpen, setIsSubmitWorkModalOpen] = useState(false);
  const [submitProofLink, setSubmitProofLink] = useState("ipfs://");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("MyBids");
  const [submittingWorkJobId, setSubmittingWorkJobId] = useState(null);
  const [selectedSubmitProject, setSelectedSubmitProject] = useState(null);
  const [submittedProofByJob, setSubmittedProofByJob] = useState({});
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeProject, setSelectedDisputeProject] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [raisingDisputeJobId, setRaisingDisputeJobId] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedRatingProject, setSelectedRatingProject] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submittingRatingJobId, setSubmittingRatingJobId] = useState(null);
  const [ratedJobIds, setRatedJobIds] = useState({});
  const [ongoingGovernanceDisputeJobIds, setOngoingGovernanceDisputeJobIds] = useState(
    new Set()
  );

  const [myBids, setMyBids] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [submittedProjects, setSubmittedProjects] = useState([]);
  const [disputedProjects, setDisputedProjects] = useState([]);
  const [cancelledProjects, setCancelledProjects] = useState([]);
  const [expiredProjects, setExpiredProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);

  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeProjects: 0,
    pendingBids: 0,
    myBids: 0,
    inProgressProjects: 0,
    submittedProjects: 0,
    disputedProjects: 0,
    cancelledProjects: 0,
    expiredProjects: 0,
    completedProjects: 0,
    openProjects: 0,
  });

  const normalizeProofLinks = (proofs, fallbackProof = "") => {
    if (Array.isArray(proofs)) return proofs.filter(Boolean);
    if (proofs) return [proofs];
    return fallbackProof ? [fallbackProof] : [];
  };

  const extractJobIdFromProposalDescription = (description = "") => {
    const match = String(description).match(/Job\s*ID\s*:\s*([^\n\r]+)/i);
    return match?.[1]?.trim?.() || "";
  };

  const isOngoingDisputeProposalStatus = (status = "") => {
    const normalized = String(status).trim().toLowerCase();
    return ["created", "pending", "active", "succeeded", "queued"].includes(normalized);
  };

  const hasOngoingGovernanceDispute = (jobId) =>
    ongoingGovernanceDisputeJobIds.has(String(jobId || ""));

  const scheduleDashboardRefresh = (proofOverrides = submittedProofByJob) => {
    window.setTimeout(() => {
      fetchDashboardData(proofOverrides);
    }, DASHBOARD_REFRESH_DELAY_MS);
  };

  const applySubmittedWorkOptimistically = (project, ipfsProof) => {
    const submittedProject = {
      ...project,
      status: "Submitted",
      workProofLinks: normalizeProofLinks(project.workProofLinks, ipfsProof),
      workProofLink: ipfsProof,
      submittedAt: new Date().toISOString(),
    };

    setActiveProjects((prev) =>
      prev.filter((entry) => entry.jobId !== project.jobId)
    );
    setSubmittedProjects((prev) => {
      const withoutProject = prev.filter((entry) => entry.jobId !== project.jobId);
      return [submittedProject, ...withoutProject];
    });
    setMyBids((prev) =>
      prev.map((entry) =>
        entry.jobId === project.jobId
          ? { ...entry, jobStatus: "SUBMITTED", bidStatus: "accepted" }
          : entry
      )
    );
    setStats((prev) => ({
      ...prev,
      activeProjects: Math.max(0, prev.activeProjects - 1),
      inProgressProjects: Math.max(0, prev.inProgressProjects - 1),
      submittedProjects: prev.submittedProjects + 1,
    }));
  };

  const applyFreelancerDisputeOptimistically = (project) => {
    const disputedProject = {
      ...project,
      status: "Disputed",
    };

    setActiveProjects((prev) =>
      prev.filter((entry) => entry.jobId !== project.jobId)
    );
    setSubmittedProjects((prev) =>
      prev.filter((entry) => entry.jobId !== project.jobId)
    );
    setDisputedProjects((prev) => {
      const withoutProject = prev.filter((entry) => entry.jobId !== project.jobId);
      return [disputedProject, ...withoutProject];
    });
    setMyBids((prev) =>
      prev.map((entry) =>
        entry.jobId === project.jobId
          ? { ...entry, jobStatus: "DISPUTED", bidStatus: "accepted" }
          : entry
      )
    );
    setStats((prev) => ({
      ...prev,
      activeProjects: Math.max(
        0,
        prev.activeProjects - (project?.workProofLinks?.length ? 0 : 1)
      ),
      inProgressProjects: Math.max(
        0,
        prev.inProgressProjects - (project?.workProofLinks?.length ? 0 : 1)
      ),
      submittedProjects: Math.max(
        0,
        prev.submittedProjects - (project?.workProofLinks?.length ? 1 : 0)
      ),
      disputedProjects: prev.disputedProjects + 1,
    }));
  };

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

  const fetchDashboardData = async (proofOverrides = submittedProofByJob) => {
    setLoading(true);
    try {
      try {
        const governanceResponse = await api.get("/api/governance/fetch-proposals");
        const proposals = governanceResponse?.data?.proposals || [];
        const nextOngoingJobIds = new Set();

        proposals.forEach((proposal) => {
          const proposalJobId = extractJobIdFromProposalDescription(
            proposal?.description || ""
          );

          if (proposalJobId && isOngoingDisputeProposalStatus(proposal?.status)) {
            nextOngoingJobIds.add(String(proposalJobId));
          }
        });

        setOngoingGovernanceDisputeJobIds(nextOngoingJobIds);
      } catch (governanceError) {
        console.error("Failed to fetch governance proposals for dispute state:", governanceError);
        setOngoingGovernanceDisputeJobIds(new Set());
      }

      const response = await api.get(
        "/api/jobs/fetch-freelancer-jobs",
        { withCredentials: true }
      );

      const data = response.data || {};

      const inProgressProjects = Array.isArray(data.categorized?.inProgress)
        ? data.categorized.inProgress.map((project) => ({
          jobId: project.jobId,
          jobTitle: project.JobDetails?.title || "Untitled Job",
          jobDescription: project.JobDetails?.description || "",
          clientName:
            project.JobDetails?.clientName ||
            project.JobDetails?.clientDetails?.companyDetails?.companyName ||
            project.JobDetails?.clientAddress,
          clientAddress: project.JobDetails?.clientAddress,
          clientId: project.JobDetails?.clientId,
          freelancerName:
            project.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "You",
          freelancerAddress: address,
          contractValue: project.bidAmount,
          deadline:
            project.JobDetails?.completion || project.JobDetails?.deadline,
          status: "Active",
          skills: project.JobDetails?.skills || [],
          milestones: project?.milestones || [],
        }))
        : [];

      const completedProj = Array.isArray(data.categorized?.completed)
        ? data.categorized.completed.map((project) => ({
          jobId: project.jobId,
          jobTitle: project.JobDetails?.title || "Untitled Job",
          jobDescription: project.JobDetails?.description || "",
          clientName:
            project.JobDetails?.clientName ||
            project.JobDetails?.clientDetails?.companyDetails?.companyName ||
            project.JobDetails?.clientAddress,
          clientAddress: project.JobDetails?.clientAddress,
          clientId: project.JobDetails?.clientId,
          freelancerName:
            project.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "You",
          freelancerAddress: address,
          budget: project.bidAmount,
          deadline:
            project.JobDetails?.completion || project.JobDetails?.deadline,
          amountEarned: project.bidAmount,
          completedDate: project.completedDate || project.updatedAt,
          clientRating: project.clientRating,
          clientComment: project.clientComment,
          daysWorked: project.daysWorked || 0,
          deliverables: project.deliverables || 0,
        }))
        : [];

      const expiredProj = Array.isArray(data.categorized?.expired)
        ? data.categorized.expired.map((project) => ({
          jobId: project.jobId,
          jobTitle: project.JobDetails?.title || "Untitled Job",
          jobDescription: project.JobDetails?.description || "",
          clientName:
            project.JobDetails?.clientName ||
            project.JobDetails?.clientDetails?.companyDetails?.companyName ||
            project.JobDetails?.clientAddress,
          clientAddress: project.JobDetails?.clientAddress,
          clientId: project.JobDetails?.clientId,
          freelancerName:
            project.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "You",
          freelancerAddress: address,
          contractValue: project.bidAmount,
          deadline:
            project.JobDetails?.completion || project.JobDetails?.deadline,
          status: "Expired",
          skills: project.JobDetails?.skills || [],
          milestones: project?.milestones || [],
        }))
        : [];

      const submittedProj = Array.isArray(data.categorized?.submitted)
        ? data.categorized.submitted.map((project) => ({
          jobId: project.jobId,
          jobTitle: project.JobDetails?.title || "Untitled Job",
          jobDescription: project.JobDetails?.description || "",
          clientName:
            project.JobDetails?.clientName ||
            project.JobDetails?.clientDetails?.companyDetails?.companyName ||
            project.JobDetails?.clientAddress,
          clientAddress: project.JobDetails?.clientAddress,
          clientId: project.JobDetails?.clientId,
          freelancerName:
            project.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "You",
          freelancerAddress: address,
          contractValue: project.bidAmount,
          deadline:
            project.JobDetails?.completion || project.JobDetails?.deadline,
          status: "Submitted",
          skills: project.JobDetails?.skills || [],
          workProofLinks: normalizeProofLinks(
            project.workProofLinks,
            proofOverrides[project.jobId]
          ),
          workProofLink:
            project.workProofLink || proofOverrides[project.jobId] || "",
          submittedAt: project.submittedAt || null,
        }))
        : [];

      const disputedProj = Array.isArray(data.categorized?.disputed)
        ? data.categorized.disputed.map((project) => ({
          jobId: project.jobId,
          jobTitle: project.JobDetails?.title || "Untitled Job",
          jobDescription: project.JobDetails?.description || "",
          clientName:
            project.JobDetails?.clientName ||
            project.JobDetails?.clientDetails?.companyDetails?.companyName ||
            project.JobDetails?.clientAddress,
          clientAddress: project.JobDetails?.clientAddress,
          clientId: project.JobDetails?.clientId,
          freelancerName:
            project.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "You",
          freelancerAddress: address,
          contractValue: project.bidAmount,
          deadline:
            project.JobDetails?.completion || project.JobDetails?.deadline,
          status: "Disputed",
          skills: project.JobDetails?.skills || [],
          workProofLinks: normalizeProofLinks(project.workProofLinks),
          workProofLink: project.workProofLink || "",
          submittedAt: project.submittedAt || null,
        }))
        : [];

      const cancelledProj = Array.isArray(data.categorized?.cancelled)
        ? data.categorized.cancelled.map((project) => ({
          jobId: project.jobId,
          jobTitle: project.JobDetails?.title || "Untitled Job",
          jobDescription: project.JobDetails?.description || "",
          clientName:
            project.JobDetails?.clientName ||
            project.JobDetails?.clientDetails?.companyDetails?.companyName ||
            project.JobDetails?.clientAddress,
          clientAddress: project.JobDetails?.clientAddress,
          clientId: project.JobDetails?.clientId,
          freelancerName:
            project.JobDetails?.freelancerDetails?.BasicInformation?.name ||
            "You",
          freelancerAddress: address,
          contractValue: project.bidAmount,
          deadline:
            project.JobDetails?.completion || project.JobDetails?.deadline,
          status: "Cancelled",
          skills: project.JobDetails?.skills || [],
        }))
        : [];

      const myBidProjects = [
        ...(Array.isArray(data.categorized?.open) ? data.categorized.open : []),
        ...(Array.isArray(data.categorized?.inProgress)
          ? data.categorized.inProgress
          : []),
        ...(Array.isArray(data.categorized?.submitted)
          ? data.categorized.submitted
          : []),
        ...(Array.isArray(data.categorized?.completed)
          ? data.categorized.completed
          : []),
        ...(Array.isArray(data.categorized?.disputed)
          ? data.categorized.disputed
          : []),
        ...(Array.isArray(data.categorized?.cancelled)
          ? data.categorized.cancelled
          : []),
        ...(Array.isArray(data.categorized?.expired)
          ? data.categorized.expired
          : []),
      ].map((project) => ({
        jobId: project.jobId,
        jobTitle: project.JobDetails?.title || "Untitled Job",
        jobDescription: project.JobDetails?.description || "",
        clientName:
          project.JobDetails?.clientName ||
          project.JobDetails?.clientDetails?.companyDetails?.companyName ||
          project.JobDetails?.clientAddress,
        clientAddress: project.JobDetails?.clientAddress,
        clientId: project.JobDetails?.clientId,
        bidAmount: project.bidAmount,
        proposal: project.proposal || "",
        deadline: project.JobDetails?.completion || project.JobDetails?.deadline,
        bidStatus: (project.bidStatus || "pending").toLowerCase(),
        jobStatus: project.status || "OPEN",
        createdAt: project.createdAt,
      }));

      setMyBids(myBidProjects);
      setActiveProjects(inProgressProjects);
      setSubmittedProjects(submittedProj);
      setDisputedProjects(disputedProj);
      setCancelledProjects(cancelledProj);
      setExpiredProjects(expiredProj);
      setCompletedProjects(completedProj);

      const totalEarnings = completedProj.reduce(
        (sum, project) => sum + Number(project.amountEarned || 0),
        0
      );

      setStats({
        totalEarnings,
        activeProjects: inProgressProjects.length,
        pendingBids: myBidProjects.filter((bid) => bid.bidStatus === "pending")
          .length,
        myBids: myBidProjects.length,
        inProgressProjects: inProgressProjects.length,
        submittedProjects: submittedProj.length,
        disputedProjects: disputedProj.length,
        cancelledProjects: cancelledProj.length,
        expiredProjects: expiredProj.length,
        completedProjects: completedProj.length,
        openProjects: 0,
      });

      setRedNotice(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setRedNotice(true);
      setNotice("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowContract = (project) => {
    if (!project?.jobId) return;
    navigate(`/contracts/${project.jobId}`, {
      state: { contract: project, viewerRole: "freelancer" },
    });
  };

  const handleMessage = (project) => {
    navigate(`/messages/${project?.clientId}`, {
      state: {
        recipient: project?.clientId,
      },
    });
  };

  const handleArchive = () => { };

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

  const closeSubmitWorkModal = () => {
    if (submittingWorkJobId) return;
    setIsSubmitWorkModalOpen(false);
    setSelectedSubmitProject(null);
    setSubmitProofLink("ipfs://");
  };

  const openSubmitWorkModal = (project) => {
    setSelectedSubmitProject(project);
    setSubmitProofLink("ipfs://");
    setIsSubmitWorkModalOpen(true);
  };

  const handleSubmitWork = async () => {
    if (!selectedSubmitProject?.jobId) {
      setRedNotice(true);
      setNotice("Project details missing. Try again.");
      return;
    }

    const ipfsProof = submitProofLink.trim();

    if (!ipfsProof) {
      setRedNotice(true);
      setNotice("Proof link is required to submit work.");
      return;
    }

    try {
      const signer = await getSigner();
      if (!signer) {
        setRedNotice(true);
        setNotice("Wallet signer not available. Reconnect wallet.");
        return;
      }

      setSubmittingWorkJobId(selectedSubmitProject.jobId);
      const ok = await submitWorkOnChain(
        selectedSubmitProject.jobId,
        ipfsProof,
        signer
      );

      if (!ok) {
        setRedNotice(true);
        setNotice("Failed to submit work.");
        return;
      }

      if (selectedSubmitProject?.clientId) {
        try {
          await api.post(
            "/api/notifications/job-event",
            {
              eventType: "work_submitted",
              recipientId: selectedSubmitProject.clientId,
              metadata: {
                jobId: selectedSubmitProject.jobId,
                proof: ipfsProof,
              },
            },
            { withCredentials: true }
          );
        } catch (notificationError) {
          console.error("work_submitted notification failed:", notificationError);
        }
      }

      setRedNotice(false);
      setNotice("Work submitted successfully.");
      const nextSubmittedProofByJob = {
        ...submittedProofByJob,
        [selectedSubmitProject.jobId]: ipfsProof,
      };
      setSubmittedProofByJob(nextSubmittedProofByJob);
      applySubmittedWorkOptimistically(selectedSubmitProject, ipfsProof);
      closeSubmitWorkModal();
      setActiveTab("Submitted");
      scheduleDashboardRefresh(nextSubmittedProofByJob);
    } catch (error) {
      console.error("submit work error:", error);
      setRedNotice(true);
      setNotice(error?.reason || error?.message || "Unable to submit work.");
    } finally {
      setSubmittingWorkJobId(null);
    }
  };

  const getBidStatusClasses = (status) => {
    if (status === "accepted") {
      return "bg-green-500/20 text-green-300 border border-green-500/40";
    }
    if (status === "rejected") {
      return "bg-red-500/20 text-red-300 border border-red-500/40";
    }
    return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
  };

  const openDisputeModal = (project) => {
    setSelectedDisputeProject(project);
    setDisputeReason("");
    setIsDisputeModalOpen(true);
  };

  const closeDisputeModal = () => {
    if (raisingDisputeJobId) {
      return;
    }
    setIsDisputeModalOpen(false);
    setSelectedDisputeProject(null);
    setDisputeReason("");
  };

  const handleRaiseDispute = async () => {
    const signer = await getSigner();
    if (!signer) {
      setRedNotice(true);
      setNotice("Please connect your wallet first.");
      return;
    }

    if (!selectedDisputeProject?.jobId) {
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
      setRaisingDisputeJobId(selectedDisputeProject.jobId);
      const result = await raiseDisputeOnChain({
        jobId: selectedDisputeProject.jobId,
        reason: disputeReason,
        signer,
        actorRole: "freelancer",
        jobTitle: selectedDisputeProject.jobTitle,
        disputeContext: selectedDisputeProject,
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
      applyFreelancerDisputeOptimistically(selectedDisputeProject);
      setIsDisputeModalOpen(false);
      setSelectedDisputeProject(null);
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

  const openRatingModal = (project) => {
    setSelectedRatingProject(project);
    setSelectedRating(0);
    setHoveredRating(0);
    setIsRatingModalOpen(true);
  };

  const closeRatingModal = () => {
    if (submittingRatingJobId) {
      return;
    }

    setIsRatingModalOpen(false);
    setSelectedRatingProject(null);
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

    if (!selectedRatingProject?.jobId) {
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
      setSubmittingRatingJobId(selectedRatingProject.jobId);
      const result = await submitJobRating({
        jobId: selectedRatingProject.jobId,
        rating: selectedRating,
        role: "freelancer",
        signer,
      });

      if (!result?.success) {
        throw new Error(result?.error || "Unable to submit rating.");
      }

      setRatedJobIds((current) => ({
        ...current,
        [selectedRatingProject.jobId]: selectedRating,
      }));
      setRedNotice(false);
      setNotice("Rating submitted successfully.");
      setIsRatingModalOpen(false);
      setSelectedRatingProject(null);
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

      {isSubmitWorkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#14a19f]/30 bg-[#0d1224] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Submit Work</h2>
            <p className="text-sm text-gray-400 mt-2">
              {selectedSubmitProject?.jobTitle || "Selected project"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Job ID: {selectedSubmitProject?.jobId || "N/A"}
            </p>

            <div className="mt-5">
              <label
                htmlFor="proof-link"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Deliverable Proof Link (IPFS CID/URL)
              </label>
              <input
                id="proof-link"
                type="text"
                value={submitProofLink}
                onChange={(e) => setSubmitProofLink(e.target.value)}
                placeholder="ipfs://..."
                className="w-full rounded-lg border border-[#14a19f]/30 bg-[#161c32] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#14a19f]/50"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                onClick={closeSubmitWorkModal}
                disabled={Boolean(submittingWorkJobId)}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={Boolean(submittingWorkJobId)}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submittingWorkJobId ? "Submitting..." : "Submit Work"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#0d1224] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Raise Dispute</h2>
            <p className="text-sm text-gray-400 mt-2">
              {selectedDisputeProject?.jobTitle || "Selected project"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Job ID: {selectedDisputeProject?.jobId || "N/A"}
            </p>

            <div className="mt-5">
              <label
                htmlFor="dispute-reason-freelancer"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Dispute Reason
              </label>
              <textarea
                id="dispute-reason-freelancer"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={5}
                placeholder="Describe the issue with this submitted job..."
                className="w-full rounded-lg border border-red-500/30 bg-[#161c32] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                onClick={closeDisputeModal}
                disabled={Boolean(raisingDisputeJobId)}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRaiseDispute}
                disabled={Boolean(raisingDisputeJobId)}
                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {raisingDisputeJobId ? "Raising..." : "Raise Dispute"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRatingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-400/30 bg-[#0d1224] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Rate Client</h2>
            <p className="text-sm text-gray-400 mt-2">
              {selectedRatingProject?.jobTitle || "Completed project"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Share a rating from 1 to 5 stars for the client.
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

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                onClick={closeRatingModal}
                disabled={Boolean(submittingRatingJobId)}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={!selectedRating || Boolean(submittingRatingJobId)}
                className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submittingRatingJobId ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen overflow-x-clip">
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

        <div className="hidden md:block shrink-0">
          <SideBar />
        </div>

        <div className="flex-1 px-4 md:px-8 pb-8">
          <div className="mb-6 md:mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#14a19f] mb-1.5">Freelancer Workspace</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Manage Jobs</h1>
              <p className="text-gray-400 text-sm mt-1">Track bids, active contracts, and completed work.</p>
            </div>
            <button
              onClick={() => navigate("/browse-jobs")}
              className="shrink-0 hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14a19f] hover:bg-[#1ecac7] text-white text-sm font-semibold transition-colors"
            >
              <Search size={15} />
              Browse Jobs
            </button>
          </div>

          {!loading && <FreelancerStats stats={stats} />}

          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "MyBids",     label: "My Bids",     count: stats.myBids,             icon: Layers        },
              { id: "InProgress", label: "In Progress", count: stats.inProgressProjects, icon: Zap           },
              { id: "Submitted",  label: "Submitted",   count: stats.submittedProjects,  icon: Send          },
              { id: "Completed",  label: "Completed",   count: stats.completedProjects,  icon: CheckCircle2  },
              { id: "Disputed",   label: "Disputed",    count: stats.disputedProjects,   icon: AlertTriangle },
              { id: "Cancelled",  label: "Cancelled",   count: stats.cancelledProjects,  icon: XCircle       },
              { id: "Expired",    label: "Expired",     count: stats.expiredProjects,    icon: Clock         },
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
              {activeTab === "MyBids" && (
                <div>
                  {myBids.length === 0 ? (
                    <EmptyState
                      title="No bids submitted yet"
                      description="Your proposals will appear here with status updates."
                      ctaLabel="Browse Jobs"
                      onCta={() => navigate("/browse-jobs")}
                    />
                  ) : (
                    <div className="grid gap-4">
                      {myBids.map((bid) => (
                        <div
                          key={`${bid.jobId}-${bid.createdAt || bid.jobStatus}`}
                          className={`relative overflow-hidden rounded-xl border border-white/10 bg-[#0b1022]/75 hover:border-[#14a19f]/30 transition-all duration-200`}
                        >
                          <div className={`absolute left-0 top-0 h-full w-0.75 ${
                            bid.bidStatus === "accepted" ? "bg-emerald-400/70" :
                            bid.bidStatus === "rejected" ? "bg-red-400/70" : "bg-amber-400/70"
                          }`} />
                          <div className="pl-4 pr-4 pt-4 pb-3 md:pl-5 md:pr-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base md:text-lg font-semibold text-white leading-snug">
                                {bid.jobTitle || "Untitled Job"}
                              </h3>
                              <p className="text-[11px] text-gray-500 mt-0.5 font-mono tracking-wide">
                                #{bid.jobId || "N/A"}
                              </p>
                            </div>
                            <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border ${getBidStatusClasses(bid.bidStatus)}`}>
                              {bid.bidStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="rounded-lg bg-white/3 border border-white/6 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Your Bid</p>
                              <p className="text-sm font-semibold text-white">${bid?.bidAmount ?? 0}</p>
                            </div>
                            <div className="rounded-lg bg-white/3 border border-white/6 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Job Status</p>
                              <p className="text-sm font-semibold text-white capitalize">{(bid?.jobStatus || "OPEN").replace("_", " ").toLowerCase()}</p>
                            </div>
                            <div className="rounded-lg bg-white/3 border border-white/6 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Deadline</p>
                              <p className="text-sm font-semibold text-white">{bid?.deadline ? new Date(bid.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "N/A"}</p>
                            </div>
                            <div className="rounded-lg bg-white/3 border border-white/6 px-3 py-2 min-w-0">
                              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Client</p>
                              <p className="text-sm font-semibold text-white truncate">{bid?.clientName || bid?.clientAddress || "N/A"}</p>
                            </div>
                          </div>

                          {bid?.proposal && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1.5">Proposal</p>
                              <p className="text-sm text-gray-400 bg-white/3 border border-white/6 rounded-lg px-3 py-2.5 leading-relaxed line-clamp-3">
                                {bid.proposal}
                              </p>
                            </div>
                          )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "InProgress" && (
                <div>
                  {activeProjects.length === 0 ? (
                    <EmptyState
                      title="No active projects"
                      description="Accepted bids will appear here once a client starts a contract."
                    />
                  ) : (
                    <div className="grid gap-4">
                      {activeProjects.map((project) => (
                        <StatusProjectCard
                          key={project.jobId}
                          project={project}
                          status="InProgress"
                          showActions={true}
                          extraActions={
                            <button
                              onClick={() => openSubmitWorkModal(project)}
                              disabled={submittingWorkJobId === project.jobId}
                              className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-sm font-semibold py-2 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {submittingWorkJobId === project.jobId
                                ? "Submitting..."
                                : "Submit Work"}
                            </button>
                          }
                          onShowContract={() => handleShowContract(project)}
                          onMessage={() => handleMessage(project)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Submitted" && (
                <div>
                  {submittedProjects.length === 0 ? (
                    <EmptyState
                      title="No submitted projects"
                      description="Projects waiting for client review will appear here."
                    />
                  ) : (
                    <div className="grid gap-4">
                      {submittedProjects.map((project) => (
                        <StatusProjectCard
                          key={project.jobId}
                          project={project}
                          status="Submitted"
                          showActions={true}
                          extraActions={
                            <div className="space-y-2">
                              {normalizeProofLinks(
                                project.workProofLinks,
                                project.workProofLink
                              ).length > 0 ? (
                                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                                  <p className="text-xs text-emerald-300/90 mb-1">
                                    Submitted Work Proofs
                                  </p>
                                  <div className="space-y-1.5">
                                    {normalizeProofLinks(
                                      project.workProofLinks,
                                      project.workProofLink
                                    ).map((proof, index) => (
                                      <a
                                        key={`${project.jobId}-proof-${index}`}
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
                                onClick={() => openSubmitWorkModal(project)}
                                disabled={submittingWorkJobId === project.jobId}
                                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-sm font-semibold py-2 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {submittingWorkJobId === project.jobId
                                  ? "Submitting..."
                                  : "Submit Another Proof"}
                              </button>

                              <button
                                onClick={() => openDisputeModal(project)}
                                disabled={hasOngoingGovernanceDispute(project.jobId)}
                                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-sm font-semibold py-2 rounded transition-colors"
                              >
                                {hasOngoingGovernanceDispute(project.jobId)
                                  ? "Governance Dispute Ongoing"
                                  : "Re-raise Dispute"}
                              </button>
                            </div>
                          }
                          onShowContract={() => handleShowContract(project)}
                          onMessage={() => handleMessage(project)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Completed" && (
                <div>
                  {completedProjects.length === 0 ? (
                    <EmptyState
                      title="No completed projects"
                      description="Your delivered work and reviews will appear here."
                    />
                  ) : (
                    <div className="grid gap-4">
                      {completedProjects.map((project) => (
                        <StatusProjectCard
                          key={project.jobId}
                          project={project}
                          status="Completed"
                          showActions={true}
                          extraActions={
                            ratedJobIds[project.jobId] ? (
                              <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                                You rated this client {ratedJobIds[project.jobId]}/5.
                              </div>
                            ) : (
                              <button
                                onClick={() => openRatingModal(project)}
                                className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-sm font-semibold py-2 rounded transition-colors"
                              >
                                Rate Client
                              </button>
                            )
                          }
                          onShowContract={() => handleShowContract(project)}
                          onMessage={() => handleMessage(project)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Disputed" && (
                <div>
                  {disputedProjects.length === 0 ? (
                    <EmptyState
                      title="No disputed projects"
                      description="Disputed contracts will appear here."
                    />
                  ) : (
                    <div className="grid gap-4">
                      {disputedProjects.map((project) => (
                        <StatusProjectCard
                          key={project.jobId}
                          project={project}
                          status="Disputed"
                          showActions={true}
                          extraActions={
                            <button
                              onClick={() => openDisputeModal(project)}
                              disabled={hasOngoingGovernanceDispute(project.jobId)}
                              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-sm font-semibold py-2 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {hasOngoingGovernanceDispute(project.jobId)
                                ? "Governance Dispute Ongoing"
                                : "Re-raise Dispute"}
                            </button>
                          }
                          onShowContract={() => handleShowContract(project)}
                          onMessage={() => handleMessage(project)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Cancelled" && (
                <div>
                  {cancelledProjects.length === 0 ? (
                    <EmptyState
                      title="No cancelled projects"
                      description="Cancelled contracts will appear here."
                    />
                  ) : (
                    <div className="grid gap-4">
                      {cancelledProjects.map((project) => (
                        <StatusProjectCard
                          key={project.jobId}
                          project={project}
                          status="Cancelled"
                          showActions={true}
                          showArchive={true}
                          onShowContract={() => handleShowContract(project)}
                          onMessage={() => handleMessage(project)}
                          onArchive={handleArchive}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Expired" && (
                <div>
                  {expiredProjects.length === 0 ? (
                    <EmptyState
                      title="No expired projects"
                      description="Projects with passed deadlines will appear here."
                    />
                  ) : (
                    <div className="grid gap-4">
                      {expiredProjects.map((project) => (
                        <StatusProjectCard
                          key={project.jobId}
                          project={project}
                          status="Expired"
                          showActions={true}
                          showArchive={true}
                          onShowContract={() => handleShowContract(project)}
                          onMessage={() => handleMessage(project)}
                          onArchive={handleArchive}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ManageJobs;
