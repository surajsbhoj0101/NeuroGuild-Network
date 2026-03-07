import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { AlertCircle } from "lucide-react";
import SideBar from "../../components/SideBar";
import api from "../../utils/api.js";
import "../../index.css";
import FreelancerStats from "../../components/FreelancerStats";
import NoticeToast from "../../components/NoticeToast";
import StatusProjectCard from "../../components/StatusProjectCard";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { submitWorkOnChain } from "../../utils/submit_work.js";

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
      const response = await api.get(
        "http://localhost:5000/api/jobs/fetch-freelancer-jobs",
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

      setStats({
        totalEarnings: 0,
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
            "http://localhost:5000/api/notifications/job-event",
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
      closeSubmitWorkModal();
      setActiveTab("Submitted");
      await fetchDashboardData(nextSubmittedProofByJob);
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

  const handleRaiseDisputeUIOnly = () => {
    setRedNotice(false);
    setNotice("Raise dispute flow will be available soon.");
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

      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen">
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

        <SideBar />

        <div className="flex-1 px-4 md:px-8 pb-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Manage Jobs
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Manage your bids, active projects, and completed work
            </p>
          </div>

          {!loading && <FreelancerStats stats={stats} />}

          <div className="flex gap-2 mb-6 border-b border-[#14a19f]/20 overflow-x-auto pb-1">
            {[
              {
                id: "MyBids",
                label: "My Bids",
                count: stats.myBids,
              },
              {
                id: "InProgress",
                label: "InProgress",
                count: stats.inProgressProjects,
              },
              {
                id: "Submitted",
                label: "Submitted",
                count: stats.submittedProjects,
              },
              {
                id: "Completed",
                label: "Completed",
                count: stats.completedProjects,
              },
              {
                id: "Disputed",
                label: "Disputed",
                count: stats.disputedProjects,
              },
              {
                id: "Cancelled",
                label: "Cancelled",
                count: stats.cancelledProjects,
              },
              {
                id: "Expired",
                label: "Expired",
                count: stats.expiredProjects,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-4 md:px-6 py-3 font-medium text-sm border-b-2 transition-colors rounded-t-lg ${activeTab === tab.id
                    ? "text-[#14a19f] border-[#14a19f] bg-[#14a19f]/10"
                    : "text-gray-400 border-transparent hover:text-gray-300"
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-[#14a19f]/30 text-[#14a19f] px-2 py-1 rounded text-xs font-semibold">
                    {tab.count}
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
                          className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-5 hover:border-[#14a19f]/40 transition-all space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {bid.jobTitle || "Untitled Job"}
                              </h3>
                              <p className="text-xs text-gray-400 mt-1">
                                Job ID: {bid.jobId || "N/A"}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getBidStatusClasses(
                                bid.bidStatus
                              )}`}
                            >
                              {bid.bidStatus}
                            </span>
                          </div>

                          <p className="text-sm text-gray-300 bg-[#161c32]/50 rounded p-3">
                            {bid.jobDescription || "No description provided."}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Your Bid</p>
                              <p className="text-gray-300 font-medium">
                                ${bid?.bidAmount ?? 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Job Status</p>
                              <p className="text-gray-300 font-medium capitalize">
                                {(bid?.jobStatus || "OPEN")
                                  .replace("_", " ")
                                  .toLowerCase()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Deadline</p>
                              <p className="text-gray-300 font-medium">
                                {bid?.deadline
                                  ? new Date(bid.deadline).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Client</p>
                              <p className="text-gray-300 font-medium line-clamp-1">
                                {bid?.clientName || bid?.clientAddress || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-gray-500 text-xs mb-1">Proposal</p>
                            <p className="text-sm text-gray-300 bg-[#161c32]/50 rounded p-3">
                              {bid?.proposal || "No proposal text available."}
                            </p>
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
                                onClick={handleRaiseDisputeUIOnly}
                                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-sm font-semibold py-2 rounded transition-colors"
                              >
                                Raise Dispute
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
