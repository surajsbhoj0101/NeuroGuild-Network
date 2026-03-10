import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar";
import api from "../../utils/api.js";
import "../../index.css";
import FreelancerStats from "../../components/FreelancerStats";
import NoticeToast from "../../components/NoticeToast";
import { useAuth } from "../../contexts/AuthContext.jsx";
import DashboardAnalyticsPanel from "../../components/DashboardAnalyticsPanel.jsx";
import { ArrowRight, BriefcaseBusiness, Gavel, Send } from "lucide-react";

function Dashboard() {
  const { isAuthentication } = useAuth();
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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        "http://localhost:5000/api/jobs/fetch-freelancer-jobs",
        { withCredentials: true }
      );

      const categorized = response.data?.categorized || {};
      const totalEarnings = (categorized?.completed || []).reduce(
        (sum, project) => sum + Number(project?.bidAmount || 0),
        0
      );

      setStats({
        totalEarnings,
        activeProjects: categorized?.inProgress?.length || 0,
        completedProjects: categorized?.completed?.length || 0,
        pendingBids: categorized?.open?.length || 0,
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
      setNotice("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const doughnutData = {
    labels: ["In Progress", "Submitted", "Completed", "Disputed"],
    datasets: [
      {
        data: [
          breakdown.inProgress,
          breakdown.submitted,
          breakdown.completed,
          breakdown.disputed,
        ],
        backgroundColor: [
          "rgba(56, 189, 248, 0.72)",
          "rgba(245, 158, 11, 0.68)",
          "rgba(20, 161, 159, 0.78)",
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
      label: "Work waiting on client review",
      value: `${breakdown.submitted}`,
      description: "Submitted projects are ready for client approval or dispute review.",
      tone: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
    },
    {
      label: "Live contracts needing delivery",
      value: `${breakdown.inProgress}`,
      description: "These jobs are active and should be tracked closely for proofs and deadlines.",
      tone: "bg-sky-500/15 text-sky-300 border border-sky-500/25",
    },
    {
      label: "Dispute pressure",
      value: `${breakdown.disputed}`,
      description: "Disputed work usually needs governance follow-through and evidence management.",
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

      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen ">
        <div className="hidden md:block">
          <SideBar />
        </div>

        <div className="min-w-0 flex-1 px-4 md:px-8 pb-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Track delivery health, review pressure, and job lifecycle momentum from one overview.
            </p>
          </div>

          {!loading && <FreelancerStats stats={stats} />}

          {!loading ? (
            <>
              <DashboardAnalyticsPanel
                doughnutTitle="Workload Distribution"
                doughnutSubtitle="See how current freelancer work is distributed across active delivery states."
                doughnutData={doughnutData}
                barTitle="Lifecycle Breakdown"
                barSubtitle="A full view of every freelancer job state currently indexed."
                barData={barData}
                insights={insights}
              />

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <button
                  onClick={() => navigate("/freelancer/manage-jobs")}
                  className="rounded-2xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-5 text-left backdrop-blur-md transition-colors hover:border-[#14a19f]/35"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#14a19f]/12 text-[#7df3f0]">
                    <BriefcaseBusiness size={18} />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">Manage Jobs</h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Review submitted work, disputes, completed jobs, and every live contract state.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8ff6f3]">
                    Open workspace <ArrowRight size={15} />
                  </div>
                </button>

                <button
                  onClick={() => navigate("/browse-jobs")}
                  className="rounded-2xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-5 text-left backdrop-blur-md transition-colors hover:border-[#14a19f]/35"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/12 text-sky-300">
                    <Send size={18} />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">Find New Work</h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Open listings and pending bids are easiest to improve from the browse jobs flow.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
                    Browse jobs <ArrowRight size={15} />
                  </div>
                </button>

                <button
                  onClick={() => navigate("/governance")}
                  className="rounded-2xl border border-[#14a19f]/20 bg-[#0d1224]/50 p-5 text-left backdrop-blur-md transition-colors hover:border-[#14a19f]/35"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/12 text-amber-300">
                    <Gavel size={18} />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">Governance Watch</h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Keep an eye on disputes and protocol proposals that affect payment and reputation rules.
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
