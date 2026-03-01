import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import SideBar from "../../components/SideBar";
import ClientStats from "../../components/ClientStats";
import api from "../../utils/api.js";
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
  const { isAuthentication } = useAuth();
  const navigate = useNavigate();

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

  const [stats, setStats] = useState({
    openJobs: 0,
    activeProjects: 0,
    submittedProjects: 0,
    completedProjects: 0,
    disputedProjects: 0,
    cancelledProjects: 0,
    expiredProjects: 0,
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
            freelancerAddress: `${job.bidder.slice(0, 6)}...${job.bidder.slice(
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
            freelancerAddress: `${job.bidder.slice(0, 6)}...${job.bidder.slice(
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
    navigate(`/job/${project.jobId}`);
  };

  const handleMessage = (project) => {
    console.log(project?.clientId)
    navigate(`/messages/${project?.clientId}`, {
      state: {
        recipient: project?.freelancerId
      },
    });
  };

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

          {!loading && <ClientStats stats={stats} />}

          <div className="flex gap-2 mb-6 border-b border-[#14a19f]/20 overflow-x-auto pb-1">
            {[
              { id: "Open", label: "Open", count: stats.openJobs },
              {
                id: "InProgress",
                label: "InProgress",
                count: stats.activeProjects,
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
              {activeTab === "Open" &&
                (openJobs.length === 0 ? (
                  <EmptyState
                    title="No open jobs"
                    description="You haven’t posted any jobs yet. Post your first job and start receiving bids."
                    ctaLabel="Post A Job"
                    onCta={() => navigate("/post-job")}
                  />
                ) : (
                  openJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={{
                        ...job,
                        freelancerName: job?.bids?.[0]?.freelancerName || "N/A",
                        freelancerAddress: job?.bids?.[0]?.freelancerAddress || "N/A",
                      }}
                      status="Open"
                      showActions={true}
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() =>
                        handleMessage({
                          ...job,
                          freelancerName:
                            job?.bids?.[0]?.freelancerName || "N/A",
                          freelancerAddress:
                            job?.bids?.[0]?.freelancerAddress || "N/A",
                        })
                      }
                    />
                  ))
                ))}

              {activeTab === "InProgress" &&
                (inProgressJobs.length === 0 ? (
                  <EmptyState
                    title="No active projects"
                    description="Accepted bids and running contracts will appear here."
                  />
                ) : (
                  inProgressJobs.map((job) => (
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
                          freelancerName: job?.bid?.freelancerName || "N/A",
                          freelancerAddress:
                            job?.bid?.freelancerAddress || "N/A",
                        })
                      }
                    />
                  ))
                ))}

              {activeTab === "Submitted" &&
                (submittedJobs.length === 0 ? (
                  <EmptyState
                    title="No submitted projects"
                    description="Projects waiting for your approval will appear here."
                  />
                ) : (
                  submittedJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={job}
                      status="Submitted"
                      showActions={true}
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() => handleMessage(job)}
                    />
                  ))
                ))}

              {activeTab === "Completed" &&
                (completedJobs.length === 0 ? (
                  <EmptyState
                    title="No completed projects"
                    description="Completed contracts will appear here."
                  />
                ) : (
                  completedJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={job}
                      status="Completed"
                      showActions={true}
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() => handleMessage(job)}
                    />
                  ))
                ))}

              {activeTab === "Disputed" &&
                (disputedJobs.length === 0 ? (
                  <EmptyState
                    title="No disputed projects"
                    description="If a contract enters dispute, it will appear in this tab."
                  />
                ) : (
                  disputedJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={job}
                      status="Disputed"
                      showActions={true}
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() => handleMessage(job)}
                    />
                  ))
                ))}

              {activeTab === "Cancelled" &&
                (cancelledJobs.length === 0 ? (
                  <EmptyState
                    title="No cancelled projects"
                    description="Cancelled contracts will appear here."
                  />
                ) : (
                  cancelledJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={job}
                      status="Cancelled"
                      showActions={true}
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() => handleMessage(job)}
                    />
                  ))
                ))}

              {activeTab === "Expired" &&
                (expiredJobs.length === 0 ? (
                  <EmptyState
                    title="No expired projects"
                    description="Expired contracts will appear here."
                  />
                ) : (
                  expiredJobs.map((job) => (
                    <StatusProjectCard
                      key={job.jobId}
                      project={job}
                      status="Expired"
                      showActions={true}
                      onShowContract={() => handleShowContract(job)}
                      onMessage={() => handleMessage(job)}
                    />
                  ))
                ))}

            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ManageJobs;
