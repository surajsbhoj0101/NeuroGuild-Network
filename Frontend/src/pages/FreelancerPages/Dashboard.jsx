import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar";
import api from "../../utils/api.js";
import "../../index.css";
import FreelancerStats from "../../components/FreelancerStats";
import NoticeToast from "../../components/NoticeToast";
import { useAuth } from "../../contexts/AuthContext.jsx";
import DashboardAnalyticsPanel from "../../components/DashboardAnalyticsPanel.jsx";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Gavel,
  Send,
  WalletCards,
} from "lucide-react";

function ActionPanel({ title, detail, meta, icon, onClick, tone = "default" }) {
  const IconComponent = icon;
  const iconTone =
    tone === "sky"
      ? "bg-sky-500/12 text-sky-300"
      : tone === "amber"
        ? "bg-amber-500/12 text-amber-300"
        : tone === "emerald"
          ? "bg-emerald-500/12 text-emerald-300"
          : "bg-white/8 text-white";

  return (
    <button
      onClick={onClick}
      className="border border-white/10 bg-[#101827] p-4 text-left transition-colors hover:border-white/20 hover:bg-[#131d30]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`border border-white/10 p-2 ${iconTone}`}>
          <IconComponent size={16} />
        </div>
        <span className="text-xs text-gray-500">{meta}</span>
      </div>
      <h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-400">{detail}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-gray-200">
        Open
        <ArrowRight size={14} />
      </div>
    </button>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-3 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-24 border border-white/8 bg-white/5" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="h-96 border border-white/8 bg-white/5" />
        </div>
        <div className="space-y-4">
          <div className="h-44 border border-white/8 bg-white/5" />
          <div className="h-44 border border-white/8 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

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
    } catch {
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

  const actionItems = [
    {
      title: "Manage active contracts",
      detail:
        "Review submitted proofs, delivery deadlines, disputes, and completed work without switching context.",
      meta: `${breakdown.inProgress} active`,
      icon: BriefcaseBusiness,
      tone: "emerald",
      onClick: () => navigate("/freelancer/manage-jobs"),
    },
    {
      title: "Browse new work",
      detail:
        "Open jobs and pending proposals move fastest when you keep the top of the funnel warm.",
      meta: `${breakdown.open} open`,
      icon: Send,
      tone: "sky",
      onClick: () => navigate("/browse-jobs"),
    },
    {
      title: "Watch governance",
      detail:
        "Disputes and rule changes can affect payouts, review flow, and future credentialing.",
      meta: `${breakdown.disputed} disputed`,
      icon: Gavel,
      tone: "amber",
      onClick: () => navigate("/governance"),
    },
  ];

  return (
    <>
      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

      <div className="dark:bg-[#0f111d] py-4 md:py-6 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen overflow-x-clip">
        <div className="hidden md:block">
          <SideBar />
        </div>

        <div className="min-w-0 flex-1 px-4 md:px-8 pb-8">
          <div className="mb-4 border border-white/10 bg-[#101827] px-4 py-4 md:px-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                  Freelancer Workspace
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-white">
                  Freelancer Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                  Keep delivery, review timing, dispute pressure, and revenue visibility in one working view.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 md:w-[360px]">
                <div className="border border-white/10 bg-[#0b111b] px-3 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <WalletCards size={13} />
                    Revenue
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    ${stats.totalEarnings.toLocaleString()}
                  </div>
                </div>
                <div className="border border-white/10 bg-[#0b111b] px-3 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock3 size={13} />
                    Review queue
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {breakdown.submitted}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!loading ? (
            <div className="space-y-4">
              <FreelancerStats stats={stats} />

              <DashboardAnalyticsPanel
                doughnutTitle="Workload Distribution"
                doughnutSubtitle="Where your current contracts are concentrated across delivery states."
                doughnutData={doughnutData}
                barTitle="Lifecycle Breakdown"
                barSubtitle="A full state distribution of freelancer jobs indexed right now."
                barData={barData}
                insights={insights}
              />

              <div className="border border-white/10 bg-[#101827] px-4 py-4">
                <div className="border-b border-white/8 pb-3">
                  <h2 className="text-sm font-semibold text-white">Action Queue</h2>
                  <p className="mt-1 text-xs text-gray-400">
                    The highest-leverage places to spend time right now.
                  </p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {actionItems.map((item) => (
                    <ActionPanel key={item.title} {...item} />
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <LoadingDashboard />
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
