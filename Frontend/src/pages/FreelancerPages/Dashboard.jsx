import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import SideBar from "../../components/SideBar";
import api from "../../utils/api.js";
import "../../index.css";
import FreelancerStats from "../../components/FreelancerStats";
import NoticeToast from "../../components/NoticeToast";

function Dashboard() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
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
      const response = await api.get(
        "http://localhost:5000/api/jobs/fetch-freelancer-jobs",
        { withCredentials: true }
      );

      const categorized = response.data?.categorized || {};
      setStats({
        totalEarnings: 0,
        activeProjects: categorized?.inProgress?.length || 0,
        completedProjects: categorized?.completed?.length || 0,
        pendingBids: categorized?.open?.length || 0,
      });
      setRedNotice(false);
    } catch (error) {
      setRedNotice(true);
      setNotice("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              Overview only. Manage all jobs from the Manage Jobs page.
            </p>
          </div>

          {!loading && <FreelancerStats stats={stats} />}

          <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Manage Jobs</h2>
            <p className="text-sm text-gray-400 mb-4">
              Open, InProgress, Submitted, Completed, Disputed, Cancelled, and Expired
              jobs are moved to a dedicated page.
            </p>
            <button
              onClick={() => navigate("/freelancer/manage-jobs")}
              className="px-5 py-2 rounded-lg bg-[#14a19f] text-white text-sm font-semibold hover:bg-[#1ecac7] transition-colors"
            >
              Go To Manage Jobs
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
