import { useState, useEffect } from "react";
import SideBar from "../../components/SideBar";
import { useAccount } from "wagmi";
import ClientOpenJobs from "../../components/ClientOpenJobs";
import ClientStats from "../../components/ClientStats";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("open");
  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openJobs, setOpenJobs] = useState([]);

  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingBids: 0,
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
      const response = await axios.get(
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

      setOpenJobs(opJobs);
    } catch (error) {
      console.error("Dashboard fetch failed:", error);
      setRedNotice(true);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {notice && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <div
            className={`flex items-center gap-3 bg-[#14a19f] text-white px-4 py-2 rounded shadow-lg border border-[#1ecac7]/30 ${
              redNotice
                ? "bg-red-600 border-red-700"
                : "bg-[#14a19f] border-[#1ecac7]/30"
            } `}
          >
            <div className="text-sm">{notice}</div>
            <button
              onClick={() => setNotice(null)}
              className="ml-2 text-xs text-white/90 px-2 py-1 rounded hover:opacity-90 transition-opacity"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="dark:bg-[#0f111d] py-8 flex bg-[#161c32] w-full min-h-screen">
        {/* Decorative Background Blobs */}
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen"></div>
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen"></div>

        <SideBar />
        <div className="flex-1 px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Manage your Jobs & Bids</p>
          </div>

          {!loading && <ClientStats stats={stats} />}
          <div className="flex gap-2 mb-6 border-b border-[#14a19f]/20">
            {[
              {
                id: "open",
                label: "Open Projects",
                count: stats.openJobs,
              },
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
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "text-[#14a19f] border-[#14a19f]"
                    : "text-gray-400 border-transparent hover:text-gray-300"
                }`}
              >
                {tab.label}

                {/* Count Badge */}
                {(tab.count > 0 || tab.id === "my-jobs") && (
                  <span className="ml-2 bg-[#14a19f]/30 text-[#14a19f] px-2 py-1 rounded text-xs font-semibold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading dashboard...</div>
            </div>
          ) : (
            <>
              {activeTab === "open" &&
                openJobs.map((job) => (
                  <ClientOpenJobs
                    key={job.jobId}
                    job={job}
                    setNotice={setNotice}
                    setRedNotice={setRedNotice}
                  />
                ))}{" "}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
