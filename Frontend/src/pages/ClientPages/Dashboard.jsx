import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar";
import ClientStats from "../../components/ClientStats";
import api from "../../utils/api.js";
import NoticeToast from "../../components/NoticeToast";
import { useAuth } from "../../contexts/AuthContext.jsx";
import DashboardAnalyticsPanel from "../../components/DashboardAnalyticsPanel.jsx";
import { ArrowRight, BriefcaseBusiness, Vote } from "lucide-react";

function Dashboard() {
  const { isAuthentication } = useAuth();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    openJobs: 0,
    activeProjects: 0,
    completedProjects: 0,
    disputedProjects: 0,
  });
  const [breakdown, setBreakdown] = useState({
    open: 0,
    inProgress: 0,
    submitted: 0,
    completed: 0,
    disputed: 0,
    cancelled: 0,
    expired: 0,
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

      const categorized = response.data?.categorized || {};
      setStats({
        openJobs: categorized?.open?.length || 0,
        activeProjects: categorized?.inProgress?.length || 0,
        completedProjects: categorized?.completed?.length || 0,
        disputedProjects: categorized?.disputed?.length || 0,
      });
      setBreakdown({
        open: categorized?.open?.length || 0,
        inProgress: categorized?.inProgress?.length || 0,
        submitted: categorized?.submitted?.length || 0,
        completed: categorized?.completed?.length || 0,
        disputed: categorized?.disputed?.length || 0,
        cancelled: categorized?.cancelled?.length || 0,
        expired: categorized?.expired?.length || 0,
      });
      setRedNotice(false);
    } catch (error) {
      setRedNotice(true);
      setNotice(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const doughnutData = {
    labels: ["Open", "In Progress", "Submitted", "Disputed"],
    datasets: [
      {
        data: [
          breakdown.open,
          breakdown.inProgress,
          breakdown.submitted,
          breakdown.disputed,
        ],
        backgroundColor: [
          "rgba(109, 84, 201, 0.7)",
          "rgba(56, 189, 248, 0.72)",
          "rgba(245, 158, 11, 0.68)",
          "rgba(244, 63, 94, 0.64)",
        ],
        borderColor: "#10182d",
        borderWidth: 3,
      },
    ],
  };

  const barData = {
    labels: ["Open", "In Progress", "Submitted", "Completed", "Cancelled", "Expired"],
    datasets: [
      {
        data: [
          breakdown.open,
          breakdown.inProgress,
          breakdown.submitted,
          breakdown.completed,
          breakdown.cancelled,
          breakdown.expired,
        ],
        backgroundColor: [
          "rgba(109, 84, 201, 0.7)",
          "rgba(56, 189, 248, 0.72)",
          "rgba(245, 158, 11, 0.68)",
          "rgba(20, 161, 159, 0.78)",
          "rgba(239, 68, 68, 0.62)",
          "rgba(190, 24, 93, 0.58)",
        ],
        borderColor: "rgba(16, 24, 45, 0.95)",
        borderWidth: 1.5,
        borderRadius: 10,
      },
    ],
  };

  const insights = [
    {
      label: "Jobs waiting for review",
      value: `${breakdown.submitted}`,
      description: "Submitted work should be accepted or disputed quickly so funds do not sit idle.",
      tone: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
    },
    {
      label: "Open hiring slots",
      value: `${breakdown.open}`,
      description: "These open jobs are still collecting bids and may need faster selection.",
      tone: "bg-violet-500/15 text-violet-300 border border-violet-500/25",
    },
    {
      label: "Dispute load",
      value: `${breakdown.disputed}`,
      description: "Disputed contracts need evidence review and may flow into governance resolution.",
      tone: "bg-rose-500/15 text-rose-300 border border-rose-500/25",
    },
  ];

  return (
    <>
      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] min-w-screen min-h-screen ">
        <div className="hidden md:block">
          <SideBar />
        </div>

        <div className="min-w-0 flex-1 px-4 md:px-8 pb-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Keep hiring, contract progress, and dispute pressure visible from one client control surface.
            </p>
          </div>

          {!loading && <ClientStats stats={stats} />}

          {!loading ? (
            <>
              <DashboardAnalyticsPanel
                doughnutTitle="Hiring Pipeline"
                doughnutSubtitle="Track open hiring, active delivery, submitted work, and dispute load."
                doughnutData={doughnutData}
                barTitle="Contract Lifecycle"
                barSubtitle="A full distribution of client jobs across the lifecycle."
                barData={barData}
                insights={insights}
              />

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <button
                  onClick={() => navigate("/client/manage-jobs")}
                  className="rounded-2xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-5 text-left backdrop-blur-md transition-colors hover:border-[#14a19f]/35"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#14a19f]/12 text-[#7df3f0]">
                    <BriefcaseBusiness size={18} />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">Manage Jobs</h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Review bids, accept deliveries, raise disputes, and close contracts from one workflow.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8ff6f3]">
                    Open workspace <ArrowRight size={15} />
                  </div>
                </button>

                <button
                  onClick={() => navigate("/post-job")}
                  className="rounded-2xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-5 text-left backdrop-blur-md transition-colors hover:border-[#14a19f]/35"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/12 text-violet-300">
                    <ArrowRight size={18} />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">Post New Job</h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Keep the hiring funnel healthy by opening new work when open jobs are running low.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
                    Post a job <ArrowRight size={15} />
                  </div>
                </button>

                <button
                  onClick={() => navigate("/governance")}
                  className="rounded-2xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-5 text-left backdrop-blur-md transition-colors hover:border-[#14a19f]/35"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/12 text-amber-300">
                    <Vote size={18} />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">Governance</h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Disputes and protocol changes can affect payouts, timelock resolution, and platform policy.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-300">
                    Open governance <ArrowRight size={15} />
                  </div>
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
