import { useState, useEffect } from "react";
import SideBar from "../../components/SideBar";
import { useAccount } from "wagmi";
import axios from "axios";
import "../../index.css";
import FreelancerStats from "../../components/FreelancerStats";
import ActiveProjectCard from "../../components/ActiveProjectCard";
import CompletedProjectCard from "../../components/CompletedProjectCard";
import { AlertCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bidding");

  const [bids, setBids] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);

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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/jobs/fetch-freelancer-jobs",
        {withCredentials: true}
      );

      const data = response.data || {};

      const openBids = Array.isArray(data.categorized?.open)
        ? data.categorized.open.map((bid) => ({
            jobId: bid.jobId,
            jobTitle: bid.JobDetails?.title || "Untitled Job",
            jobDescription: bid.JobDetails?.description || "",
            clientName:
              bid.JobDetails?.clientDetails?.companyDetails?.companyName ||
              "Unknown Client",
            clientAddress: bid.JobDetails?.clientAddress,
            bidAmount: bid.bidAmount,
            budget: bid.JobDetails?.budget,
            deadline: bid.JobDetails?.deadline,
            skills: bid.JobDetails?.skills || [],
            jobType: bid.JobDetails?.jobType || "Fixed",
            status: bid.status,
            proposal: bid.proposal,
            submittedAt: bid.createdAt,
          }))
        : [];

      // Transform active projects
      const inProgressProjects = Array.isArray(data.categorized?.inProgress)
        ? data.categorized.inProgress.map((project) => ({
            jobId: project.jobId,
            jobTitle: project.JobDetails?.title || "Untitled Job",
            jobDescription: project.JobDetails?.description || "",
            clientName:
              project.JobDetails?.clientDetails?.companyDetails?.companyName ||
              project.JobDetails?.clientAddress,
            clientAddress: project.JobDetails?.clientAddress,
            contractValue: project.bidAmount,
            deadline: project.JobDetails?.completion,
            status: "Active",
            milestones: project?.milestones || [],
          }))
        : [];

      const completedProj = Array.isArray(data.categorized?.completed)
        ? data.categorized.completed.map((project) => ({
            jobId: project.jobId,
            jobTitle: project.JobDetails?.title || "Untitled Job",
            jobDescription: project.JobDetails?.description || "",
            clientName:
              project.JobDetails?.clientDetails?.companyDetails?.companyName ||
              project.JobDetails?.clientAddress,
            amountEarned: project.bidAmount,
            completedDate: project.completedDate || project.updatedAt,
            clientRating: project.clientRating,
            clientComment: project.clientComment,
            daysWorked: project.daysWorked || 0,
            deliverables: project.deliverables || 0,
          }))
        : [];

      setBids(openBids);
      setActiveProjects(inProgressProjects);
      setCompletedProjects(completedProj);

      setStats({
        totalEarnings: 0,
        activeProjects: inProgressProjects.length,
        completedProjects: completedProj.length,
        pendingBids: openBids.length,
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

  const handleMessageClient = (item) => {
    navigate("/messages", {
      state: { recipient: item.clientName || item.clientAddress },
    });
  };

  const handleViewContract = (project) => {
    navigate("/freelancer/contract", { state: { project } });
  };

  const handleViewDetails = (project) => {
    navigate("/freelancer/project-details", { state: { project } });
  };

  const handleLeaveReview = (project) => {
    navigate("/freelancer/add-portfolio", { state: { project } });
  };

  return (
    <>
      {/* Floating Notice */}
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
            <p className="text-gray-400">
              Manage your bids, active projects, and completed work
            </p>
          </div>

          {/* Stats Section */}
          {!loading && <FreelancerStats stats={stats} />}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[#14a19f]/20">
            {[
              { id: "bidding", label: "Bidding", count: stats.pendingBids },
              {
                id: "active",
                label: "Active Projects",
                count: stats.activeProjects,
              },
              {
                id: "completed",
                label: "Completed",
                count: stats.completedProjects,
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
                {tab.count > 0 && (
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
              {/* Bidding Tab */}
              {activeTab === "bidding" && (
                <div>
                  {bids.length === 0 ? (
                    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-12 text-center">
                      <AlertCircle
                        size={48}
                        className="mx-auto mb-4 text-gray-400"
                      />
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">
                        No bids placed
                      </h3>
                      <p className="text-gray-400">
                        Browse and place bids on jobs to get started
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {bids.map((bid) => (
                        <div
                          key={bid.jobId}
                          className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-6 hover:bg-[#0d1224]/70 transition-all"
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">
                                  {bid.jobTitle}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    bid.status === "accepted"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : bid.status === "rejected"
                                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  }`}
                                >
                                  {bid.status === "accepted"
                                    ? "Accepted"
                                    : bid.status === "rejected"
                                    ? "Rejected"
                                    : "Pending"}
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm mb-3">
                                {bid.jobDescription}
                              </p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {bid.skills?.map((skill) => (
                                  <span
                                    key={skill}
                                    className="bg-[#14a19f]/10 text-[#14a19f] px-3 py-1 rounded-full text-xs border border-[#14a19f]/30"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-500 text-xs">
                                    Client
                                  </p>
                                  <p className="text-gray-300 font-medium">
                                    {bid.clientName}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">
                                    Your Bid
                                  </p>
                                  <p className="text-[#14a19f] font-semibold">
                                    ${bid.bidAmount}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">
                                    Budget
                                  </p>
                                  <p className="text-gray-300 font-medium">
                                    ${bid.budget}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">
                                    Deadline
                                  </p>
                                  <p className="text-gray-300 font-medium">
                                    {bid.deadline
                                      ? new Date(
                                          bid.deadline
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Active Projects Tab */}
              {activeTab === "active" && (
                <div>
                  {activeProjects.length === 0 ? (
                    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-12 text-center">
                      <AlertCircle
                        size={48}
                        className="mx-auto mb-4 text-gray-400"
                      />
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">
                        No active projects
                      </h3>
                      <p className="text-gray-400">
                        Your accepted bids will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {activeProjects.map((project) => (
                        <ActiveProjectCard
                          key={project.jobId}
                          project={project}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Completed Projects Tab */}
              {activeTab === "completed" && (
                <div>
                  {completedProjects.length === 0 ? (
                    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-12 text-center">
                      <AlertCircle
                        size={48}
                        className="mx-auto mb-4 text-gray-400"
                      />
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">
                        No completed projects
                      </h3>
                      <p className="text-gray-400">
                        Your completed work will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {completedProjects.map((project) => (
                        <CompletedProjectCard
                          key={project.jobId}
                          project={project}
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

export default Dashboard;
