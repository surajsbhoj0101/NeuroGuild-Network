import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { AlertCircle, SwatchBook } from "lucide-react";
import SideBar from "../../components/SideBar";
import ClientOpenJobs from "../../components/ClientOpenJobs";
import ClientStats from "../../components/ClientStats";
import api from "../../utils/api.js";
import NoticeToast from "../../components/NoticeToast";
import ClientInProgressJobs from "../../components/ClientInProgressJobs";

function EmptyOpenJobs({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border border-[#14a19f]/20 bg-[#0d1224]/45 rounded-2xl">
      <div className="mb-4 flex justify-center">
        <SwatchBook className="w-16 h-16 text-[#1ecac7] drop-shadow-[0_0_12px_rgba(20,161,159,0.35)]" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">No Open Jobs Yet</h2>
      <p className="text-gray-400 max-w-md mb-6">
        You haven’t posted any jobs yet. Post your first job and start receiving
        bids from talented freelancers.
      </p>
      <button
        onClick={() => navigate("/post-job")}
        className="px-6 py-3 rounded-lg bg-[#14a19f] text-white font-semibold hover:bg-[#1ecac7] transition-all"
      >
        + Post a Job
      </button>
      <p className="text-xs text-gray-500 mt-4">Takes less than 2 minutes</p>
    </div>
  );
}

function GenericEmpty({ title, description }) {
  return (
    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-2xl p-10 text-center">
      <AlertCircle size={46} className="mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function Dashboard() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("open");
  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openJobs, setOpenJobs] = useState([]);
  const [inProgressJobs, setInProgressJobs] = useState([]);

  const [stats, setStats] = useState({
    openJobs: 0,
    activeProjects: 0,
    completedProjects: 0,
    disputedProjects: 0,
  });

  useEffect(() => {
    let timer;
    if (!isConnected) {
      timer = setTimeout(() => {
        if (!isConnected) {
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
  }, [isConnected, navigate]);

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

      setOpenJobs(opJobs);
      setInProgressJobs(inProgressJobsArr);

      setStats({
        openJobs: opJobs.length,
        activeProjects: inProgressJobsArr.length,
        completedProjects: data.categorized?.completed?.length || 0,
        disputedProjects: data.categorized?.disputed?.length || 0,
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

  return (
    <>
      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen">
        <SideBar />

        <div className="flex-1 px-4 md:px-8 pb-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Manage your jobs and bids
            </p>
          </div>

          {!loading && <ClientStats stats={stats} />}

          <div className="flex gap-2 mb-6 border-b border-[#14a19f]/20 overflow-x-auto pb-1">
            {[
              { id: "open", label: "Open Projects", count: stats.openJobs },
              {
                id: "active",
                label: "Active Projects",
                count: stats.activeProjects,
              },
              {
                id: "completed",
                label: "Completed Projects",
                count: stats.completedProjects,
              },
              {
                id: "disputed",
                label: "Disputed Projects",
                count: stats.disputedProjects,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-4 md:px-6 py-3 font-medium text-sm border-b-2 transition-colors rounded-t-lg ${
                  activeTab === tab.id
                    ? "text-[#14a19f] border-[#14a19f] bg-[#14a19f]/10"
                    : "text-gray-400 border-transparent hover:text-gray-300"
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-[#14a19f]/30 text-[#14a19f] px-2 py-1 rounded text-xs font-semibold">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-10 w-10 rounded-full border-2 border-[#14a19f]/30 border-t-[#14a19f] animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "open" &&
                (openJobs.length === 0 ? (
                  <EmptyOpenJobs navigate={navigate} />
                ) : (
                  openJobs.map((job) => (
                    <ClientOpenJobs
                      key={job.jobId}
                      job={job}
                      setNotice={setNotice}
                      setRedNotice={setRedNotice}
                    />
                  ))
                ))}

              {activeTab === "active" &&
                (inProgressJobs.length === 0 ? (
                  <GenericEmpty
                    title="No active projects"
                    description="Accepted bids and running contracts will appear here."
                  />
                ) : (
                  inProgressJobs.map((job) => (
                    <ClientInProgressJobs
                      key={job.jobId}
                      job={job}
                      setNotice={setNotice}
                      setRedNotice={setRedNotice}
                    />
                  ))
                ))}

              {activeTab === "completed" && (
                <GenericEmpty
                  title="Completed section is coming soon"
                  description="Completed project cards can be added once your backend payload is wired here."
                />
              )}

              {activeTab === "disputed" && (
                <GenericEmpty
                  title="No disputed projects"
                  description="If a contract enters dispute, it will appear in this tab."
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
