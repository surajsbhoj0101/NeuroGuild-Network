import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { AlertCircle } from "lucide-react";
import SideBar from "../../components/SideBar";
import api from "../../utils/api.js";
import "../../index.css";
import FreelancerStats from "../../components/FreelancerStats";
import NoticeToast from "../../components/NoticeToast";
import StatusProjectCard from "../../components/StatusProjectCard";
import { useAuth } from "../../contexts/AuthContext.jsx";

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
  const { isAuthentication } = useAuth();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("InProgress");

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
    inProgressProjects: 0,
    submittedProjects: 0,
    disputedProjects: 0,
    cancelledProjects: 0,
    expiredProjects: 0,
    completedProjects: 0,
    openProjects: 0,
  });

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

  const fetchDashboardData = async () => {
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

      setActiveProjects(inProgressProjects);
      setSubmittedProjects(submittedProj);
      setDisputedProjects(disputedProj);
      setCancelledProjects(cancelledProj);
      setExpiredProjects(expiredProj);
      setCompletedProjects(completedProj);

      setStats({
        totalEarnings: 0,
        activeProjects: inProgressProjects.length,
        pendingBids: 0,
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
        recipient: project?.clientId
      },
    });
  };

  const handleArchive = () => { };

  return (
    <>
      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

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
